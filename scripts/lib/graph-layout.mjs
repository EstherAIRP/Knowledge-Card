export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
    throw new Error('Embeddings must be non-empty vectors with matching dimensions.');
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = Number(left[index]);
    const b = Number(right[index]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      throw new Error('Embedding vectors must contain only finite numbers.');
    }
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    throw new Error('Embedding vectors must have non-zero magnitude.');
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function buildCosineDistanceMatrix(entries) {
  const size = entries.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  for (let row = 0; row < size; row += 1) {
    for (let column = row + 1; column < size; column += 1) {
      const similarity = cosineSimilarity(entries[row].embedding, entries[column].embedding);
      const distance = Math.max(0, Math.min(2, 1 - similarity));
      matrix[row][column] = distance;
      matrix[column][row] = distance;
    }
  }
  return matrix;
}

function centeredGramMatrix(distances) {
  const size = distances.length;
  if (size === 0) return [];
  const squared = distances.map((row) => row.map((value) => Number(value) ** 2));
  const rowMeans = squared.map((row) => row.reduce((sum, value) => sum + value, 0) / size);
  const totalMean = rowMeans.reduce((sum, value) => sum + value, 0) / size;
  return squared.map((row, i) => row.map((value, j) => -0.5 * (value - rowMeans[i] - rowMeans[j] + totalMean)));
}

function dot(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function norm(vector) {
  return Math.sqrt(dot(vector, vector));
}

function normalize(vector) {
  const magnitude = norm(vector);
  if (magnitude === 0) return vector.map(() => 0);
  return vector.map((value) => value / magnitude);
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map((row) => dot(row, vector));
}

function orthogonalize(vector, bases) {
  let result = [...vector];
  for (const base of bases) {
    const projection = dot(result, base);
    result = result.map((value, index) => value - projection * base[index]);
  }
  return result;
}

function seededVector(size, seed) {
  return Array.from({ length: size }, (_, index) => {
    const value = Math.sin((index + 1) * (seed + 1) * 12.9898) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  });
}

function topEigenpairs(matrix, count = 2, iterations = 250, tolerance = 1e-12) {
  const size = matrix.length;
  const eigenvectors = [];
  const pairs = [];

  for (let pairIndex = 0; pairIndex < Math.min(count, size); pairIndex += 1) {
    let vector = normalize(orthogonalize(seededVector(size, pairIndex + 17), eigenvectors));
    let previous = vector;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      let next = multiplyMatrixVector(matrix, vector);
      next = orthogonalize(next, eigenvectors);
      next = normalize(next);
      if (norm(next) === 0) break;

      const delta = Math.min(
        norm(next.map((value, index) => value - previous[index])),
        norm(next.map((value, index) => value + previous[index]))
      );
      vector = next;
      if (delta < tolerance) break;
      previous = vector;
    }

    const multiplied = multiplyMatrixVector(matrix, vector);
    const eigenvalue = dot(vector, multiplied);
    if (!Number.isFinite(eigenvalue) || eigenvalue <= 1e-12) break;

    const anchor = vector.find((value) => Math.abs(value) > 1e-12) ?? 1;
    if (anchor < 0) vector = vector.map((value) => -value);
    eigenvectors.push(vector);
    pairs.push({ eigenvalue, eigenvector: vector });
  }

  return pairs;
}

export function classicalMds(distances, dimensions = 2) {
  if (!Array.isArray(distances)) throw new Error('Distance matrix must be an array.');
  const size = distances.length;
  if (size === 0) return [];
  for (const row of distances) {
    if (!Array.isArray(row) || row.length !== size) throw new Error('Distance matrix must be square.');
  }
  if (size === 1) return [[0, 0]];

  const gram = centeredGramMatrix(distances);
  const pairs = topEigenpairs(gram, dimensions);
  const coordinates = Array.from({ length: size }, () => Array(dimensions).fill(0));

  for (let dimension = 0; dimension < pairs.length; dimension += 1) {
    const scale = Math.sqrt(Math.max(0, pairs[dimension].eigenvalue));
    for (let index = 0; index < size; index += 1) {
      coordinates[index][dimension] = pairs[dimension].eigenvector[index] * scale;
    }
  }

  return coordinates;
}

export function normalizeCoordinates(coordinates) {
  if (coordinates.length === 0) return [];
  const dimensions = Math.max(...coordinates.map((point) => point.length), 2);
  const padded = coordinates.map((point) => Array.from({ length: dimensions }, (_, index) => Number(point[index] ?? 0)));
  const centered = padded.map((point) => [...point]);

  for (let dimension = 0; dimension < dimensions; dimension += 1) {
    const mean = centered.reduce((sum, point) => sum + point[dimension], 0) / centered.length;
    for (const point of centered) point[dimension] -= mean;
  }

  const extent = Math.max(1e-12, ...centered.flatMap((point) => point.map((value) => Math.abs(value))));
  return centered.map((point) => point.slice(0, 2).map((value) => value / extent));
}

export function calculateStress(distances, coordinates) {
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < distances.length; i += 1) {
    for (let j = i + 1; j < distances.length; j += 1) {
      const dx = (coordinates[i]?.[0] ?? 0) - (coordinates[j]?.[0] ?? 0);
      const dy = (coordinates[i]?.[1] ?? 0) - (coordinates[j]?.[1] ?? 0);
      const projected = Math.sqrt(dx * dx + dy * dy);
      const original = distances[i][j];
      numerator += (projected - original) ** 2;
      denominator += original ** 2;
    }
  }
  return denominator === 0 ? 0 : Math.sqrt(numerator / denominator);
}
