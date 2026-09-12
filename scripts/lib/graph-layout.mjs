import { cosineSimilarity } from './semantic-relations.mjs';

const EPSILON = 1e-12;

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function dot(left, right) {
  let total = 0;
  for (let index = 0; index < left.length; index += 1) total += left[index] * right[index];
  return total;
}

function magnitude(vector) {
  return Math.sqrt(dot(vector, vector));
}

function normalize(vector) {
  const length = magnitude(vector);
  if (length <= EPSILON) return vector.map(() => 0);
  return vector.map((value) => value / length);
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map((row) => dot(row, vector));
}

function orthogonalize(vector, basis) {
  const output = [...vector];
  for (const axis of basis) {
    const projection = dot(output, axis);
    for (let index = 0; index < output.length; index += 1) {
      output[index] -= projection * axis[index];
    }
  }
  return output;
}

function deterministicVector(size, seed) {
  return Array.from({ length: size }, (_, index) =>
    Math.sin((index + 1) * (seed + 1) * 1.61803398875) +
    Math.cos((index + 1) * (seed + 2) * 0.754877666)
  );
}

function spectralShift(matrix) {
  let bound = 0;
  for (const row of matrix) {
    bound = Math.max(bound, row.reduce((sum, value) => sum + Math.abs(value), 0));
  }
  return bound + 1e-9;
}

function topEigenpairs(matrix, count = 2) {
  if (matrix.length === 0) return [];
  const shift = spectralShift(matrix);
  const shifted = matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) => value + (rowIndex === columnIndex ? shift : 0))
  );
  const basis = [];
  const pairs = [];

  for (let axisIndex = 0; axisIndex < count; axisIndex += 1) {
    let vector = normalize(orthogonalize(deterministicVector(matrix.length, axisIndex), basis));
    if (magnitude(vector) <= EPSILON) {
      pairs.push({ value: 0, vector: Array(matrix.length).fill(0) });
      continue;
    }

    for (let iteration = 0; iteration < 2000; iteration += 1) {
      let next = orthogonalize(multiplyMatrixVector(shifted, vector), basis);
      const nextMagnitude = magnitude(next);
      if (nextMagnitude <= EPSILON) break;
      next = next.map((value) => value / nextMagnitude);
      if (dot(next, vector) < 0) next = next.map((value) => -value);

      const delta = Math.sqrt(
        next.reduce((sum, value, index) => sum + (value - vector[index]) ** 2, 0)
      );
      vector = next;
      if (delta < 1e-12) break;
    }

    const shiftedValue = dot(vector, multiplyMatrixVector(shifted, vector));
    basis.push(vector);
    pairs.push({ value: shiftedValue - shift, vector });
  }

  return pairs;
}

function doubleCenteredGram(distanceMatrix) {
  const size = distanceMatrix.length;
  const squared = distanceMatrix.map((row) => row.map((value) => value * value));
  const rowMeans = squared.map((row) => row.reduce((sum, value) => sum + value, 0) / size);
  const totalMean = rowMeans.reduce((sum, value) => sum + value, 0) / size;

  return squared.map((row, rowIndex) =>
    row.map(
      (value, columnIndex) =>
        -0.5 * (value - rowMeans[rowIndex] - rowMeans[columnIndex] + totalMean)
    )
  );
}

function centerCoordinates(coordinates) {
  if (coordinates.length === 0) return coordinates;
  for (let axis = 0; axis < 2; axis += 1) {
    const mean = coordinates.reduce((sum, point) => sum + point[axis], 0) / coordinates.length;
    for (const point of coordinates) point[axis] -= mean;
  }
  return coordinates;
}

function canonicalizeOrientation(coordinates) {
  for (let axis = 0; axis < 2; axis += 1) {
    let anchor = 0;
    for (let index = 1; index < coordinates.length; index += 1) {
      if (Math.abs(coordinates[index][axis]) > Math.abs(coordinates[anchor][axis])) anchor = index;
    }
    if ((coordinates[anchor]?.[axis] ?? 0) < 0) {
      for (const point of coordinates) point[axis] *= -1;
    }
  }
  return coordinates;
}

function normalizeCoordinates(coordinates) {
  let maxAbsolute = 0;
  for (const point of coordinates) {
    maxAbsolute = Math.max(maxAbsolute, Math.abs(point[0]), Math.abs(point[1]));
  }
  if (maxAbsolute <= EPSILON) return coordinates.map(() => [0, 0]);
  return coordinates.map(([x, y]) => [x / maxAbsolute, y / maxAbsolute]);
}

function rawStress(distanceMatrix, coordinates) {
  let numerator = 0;
  let denominator = 0;
  for (let left = 0; left < coordinates.length; left += 1) {
    for (let right = left + 1; right < coordinates.length; right += 1) {
      const target = distanceMatrix[left][right];
      const projected = Math.hypot(
        coordinates[left][0] - coordinates[right][0],
        coordinates[left][1] - coordinates[right][1]
      );
      numerator += (target - projected) ** 2;
      denominator += target ** 2;
    }
  }
  return {
    raw: numerator,
    normalized: denominator > 0 ? Math.sqrt(numerator / denominator) : 0
  };
}

function classicalInitialCoordinates(distanceMatrix) {
  const size = distanceMatrix.length;
  if (size === 0) return [];
  if (size === 1) return [[0, 0]];

  const gram = doubleCenteredGram(distanceMatrix);
  const eigenpairs = topEigenpairs(gram, 2);
  return Array.from({ length: size }, (_, index) =>
    eigenpairs.map((pair) => Math.sqrt(Math.max(0, pair.value)) * pair.vector[index])
  );
}

function deterministicFallbackCoordinates(distanceMatrix) {
  const size = distanceMatrix.length;
  const nonZero = [];
  for (let left = 0; left < size; left += 1) {
    for (let right = left + 1; right < size; right += 1) {
      if (distanceMatrix[left][right] > EPSILON) nonZero.push(distanceMatrix[left][right]);
    }
  }
  if (nonZero.length === 0) return Array.from({ length: size }, () => [0, 0]);
  const radius = nonZero.reduce((sum, value) => sum + value, 0) / nonZero.length;
  return Array.from({ length: size }, (_, index) => {
    const angle = (Math.PI * 2 * index) / size;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

export function buildCosineDistanceMatrix(entries) {
  if (!Array.isArray(entries)) throw new Error('Embedding entries must be an array.');
  if (entries.length === 0) return [];

  const dimensions = entries[0]?.embedding?.length ?? 0;
  if (!dimensions) throw new Error('Embedding entries must contain non-empty vectors.');

  for (const entry of entries) {
    requireString(entry?.card_id, 'embedding entry card_id');
    if (!Array.isArray(entry.embedding) || entry.embedding.length !== dimensions) {
      throw new Error(`Embedding dimensions differ for ${entry.card_id}.`);
    }
  }

  const matrix = Array.from({ length: entries.length }, () => Array(entries.length).fill(0));
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const similarity = cosineSimilarity(entries[left].embedding, entries[right].embedding);
      if (!Number.isFinite(similarity)) {
        throw new Error(
          `Cannot compute cosine similarity for ${entries[left].card_id} and ${entries[right].card_id}.`
        );
      }
      const clamped = Math.max(-1, Math.min(1, similarity));
      const distance = Math.max(0, Math.min(2, 1 - clamped));
      matrix[left][right] = distance;
      matrix[right][left] = distance;
    }
  }
  return matrix;
}

export function metricMds(distanceMatrix, { maxIterations = 500, tolerance = 1e-10 } = {}) {
  if (!Array.isArray(distanceMatrix)) throw new Error('distanceMatrix must be an array.');
  const size = distanceMatrix.length;
  if (size === 0) return { coordinates: [], stress: 0, iterations: 0 };
  if (size === 1) return { coordinates: [[0, 0]], stress: 0, iterations: 0 };

  let coordinates = centerCoordinates(classicalInitialCoordinates(distanceMatrix));
  if (coordinates.every(([x, y]) => Math.abs(x) <= EPSILON && Math.abs(y) <= EPSILON)) {
    coordinates = centerCoordinates(deterministicFallbackCoordinates(distanceMatrix));
  }

  let previousStress = rawStress(distanceMatrix, coordinates).raw;
  let iterations = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const bMatrix = Array.from({ length: size }, () => Array(size).fill(0));
    for (let left = 0; left < size; left += 1) {
      for (let right = left + 1; right < size; right += 1) {
        const projected = Math.hypot(
          coordinates[left][0] - coordinates[right][0],
          coordinates[left][1] - coordinates[right][1]
        );
        const value = projected > EPSILON ? -distanceMatrix[left][right] / projected : 0;
        bMatrix[left][right] = value;
        bMatrix[right][left] = value;
        bMatrix[left][left] -= value;
        bMatrix[right][right] -= value;
      }
    }

    const next = Array.from({ length: size }, () => [0, 0]);
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        next[row][0] += (bMatrix[row][column] * coordinates[column][0]) / size;
        next[row][1] += (bMatrix[row][column] * coordinates[column][1]) / size;
      }
    }
    centerCoordinates(next);

    const nextStress = rawStress(distanceMatrix, next).raw;
    if (nextStress > previousStress + 1e-12) break;

    coordinates = next;
    iterations = iteration;
    const improvement = previousStress - nextStress;
    previousStress = nextStress;
    if (improvement <= tolerance * Math.max(1, previousStress)) break;
  }

  canonicalizeOrientation(coordinates);
  const stress = rawStress(distanceMatrix, coordinates).normalized;
  return {
    coordinates: normalizeCoordinates(coordinates),
    stress,
    iterations
  };
}

function distanceStats(distanceMatrix) {
  const values = [];
  for (let left = 0; left < distanceMatrix.length; left += 1) {
    for (let right = left + 1; right < distanceMatrix.length; right += 1) {
      values.push(distanceMatrix[left][right]);
    }
  }
  if (values.length === 0) return { min: 0, max: 0, mean: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length
  };
}

function rounded(value, digits = 8) {
  return Number(Number(value).toFixed(digits));
}

export function buildGraphLayoutIndex(embeddingIndex, { generatedAt = new Date().toISOString() } = {}) {
  requireObject(embeddingIndex, 'embedding index');
  if (embeddingIndex.schema_version !== 1) {
    throw new Error(`Unsupported embedding schema_version: ${embeddingIndex.schema_version}`);
  }
  const provider = requireString(embeddingIndex.provider, 'embedding provider');
  const model = requireString(embeddingIndex.model, 'embedding model');
  const inputHash = requireString(embeddingIndex.input_hash, 'embedding input_hash');
  if (!Array.isArray(embeddingIndex.entries)) throw new Error('embedding entries must be an array.');

  const entries = [...embeddingIndex.entries].sort((left, right) =>
    left.card_id.localeCompare(right.card_id)
  );
  const seen = new Set();
  for (const entry of entries) {
    const cardId = requireString(entry?.card_id, 'embedding entry card_id');
    if (seen.has(cardId)) throw new Error(`Duplicate embedding card_id: ${cardId}`);
    seen.add(cardId);
  }
  if (Number(embeddingIndex.card_count) !== entries.length) {
    throw new Error(
      `embedding card_count ${embeddingIndex.card_count} does not match ${entries.length} entries.`
    );
  }

  const distances = buildCosineDistanceMatrix(entries);
  const projected = metricMds(distances);
  const nodes = {};
  entries.forEach((entry, index) => {
    nodes[entry.card_id] = {
      x: rounded(projected.coordinates[index][0]),
      y: rounded(projected.coordinates[index][1])
    };
  });
  const stats = distanceStats(distances);

  return {
    schema_version: 1,
    generated_at: generatedAt,
    method: 'metric_mds_smacof',
    metric: 'cosine_distance',
    dimensions: 2,
    embedding_provider: provider,
    embedding_model: model,
    embedding_input_hash: inputHash,
    card_count: entries.length,
    distance_stats: {
      min: rounded(stats.min, 6),
      max: rounded(stats.max, 6),
      mean: rounded(stats.mean, 6)
    },
    quality: {
      stress: rounded(projected.stress, 6),
      iterations: projected.iterations
    },
    nodes
  };
}
