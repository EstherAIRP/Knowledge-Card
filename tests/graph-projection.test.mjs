import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectGraph, readRequiredJson } from '../scripts/lib/graph-projection.mjs';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-card-graph-'));
}

function fixtureLayout() {
  return {
    schema_version: 1,
    generated_at: '2026-09-12T00:00:00.000Z',
    method: 'metric_mds_smacof',
    metric: 'cosine_distance',
    dimensions: 2,
    embedding_provider: 'fixture',
    embedding_model: 'fixture-model',
    embedding_input_hash: 'fixture-hash',
    card_count: 2,
    quality: { stress: 0.1, iterations: 10 },
    nodes: {
      a: { x: -1, y: 0 },
      b: { x: 1, y: 0 }
    }
  };
}

function fixtureGraphInputs() {
  return {
    cards: [
      { data: { id: 'a', title: 'A', summary: 'Card A' } },
      { data: { id: 'b', title: 'B', summary: 'Card B' } }
    ],
    concepts: {
      generated_at: '2026-09-11T00:00:00.000Z',
      concepts: [
        {
          id: 'agent-memory',
          label: 'Agent Memory',
          type: 'workflow',
          description: 'Memory',
          card_count: 2
        }
      ],
      card_concepts: [
        { card_id: 'a', concept_id: 'agent-memory', strength: 0.9, evidence: ['tag'] },
        { card_id: 'b', concept_id: 'agent-memory', strength: 0.8, evidence: ['tag'] }
      ],
      concept_relations: [
        {
          source: 'agent-memory',
          target: 'agent-memory',
          type: 'co_occurs',
          weight: 1,
          support: 2
        }
      ]
    },
    relations: {
      edges: [
        {
          source: 'a',
          target: 'b',
          type: 'depends_on',
          score: 0.75,
          direction: 'target_to_source'
        }
      ]
    },
    layout: fixtureLayout()
  };
}

test('readRequiredJson fails closed for missing, empty, and invalid graph inputs', () => {
  const root = makeTempDir();
  const filePath = path.join(root, 'graph.json');

  assert.throws(
    () => readRequiredJson(filePath, { label: 'fixture.json' }),
    /Missing required graph input: fixture\.json/
  );

  fs.writeFileSync(filePath, '', 'utf8');
  assert.throws(
    () => readRequiredJson(filePath, { label: 'fixture.json' }),
    /Graph input is empty or invalid: fixture\.json/
  );

  fs.writeFileSync(filePath, '{broken', 'utf8');
  assert.throws(
    () => readRequiredJson(filePath, { label: 'fixture.json' }),
    /Cannot parse graph input fixture\.json/
  );
});

test('projectGraph projects semantic Card coordinates and weighted Concept centroids', () => {
  const inputs = fixtureGraphInputs();
  const graph = projectGraph(inputs);

  assert.equal(graph.generatedAt, inputs.concepts.generated_at);
  assert.deepEqual(graph.stats, {
    cards: 2,
    concepts: 1,
    cardConceptEdges: 2,
    conceptRelations: 1,
    cardRelations: 1
  });
  assert.equal(graph.layout.method, 'metric_mds_smacof');
  assert.equal(graph.layout.embeddingInputHash, 'fixture-hash');

  const cardA = graph.nodes.find((node) => node.id === 'card:a');
  const cardB = graph.nodes.find((node) => node.id === 'card:b');
  const concept = graph.nodes.find((node) => node.id === 'concept:agent-memory');

  assert.deepEqual({ x: cardA.x, y: cardA.y }, { x: -1, y: 0 });
  assert.deepEqual({ x: cardB.x, y: cardB.y }, { x: 1, y: 0 });
  assert.ok(Math.abs(concept.x - (-0.1 / 1.7)) < 1e-12);
  assert.equal(concept.y, 0);
  assert.equal(cardA.degree, 1);

  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.kind === 'card-concept' &&
        edge.source === 'card:a' &&
        edge.target === 'concept:agent-memory'
    )
  );
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.kind === 'card-card' &&
        edge.source === 'card:a' &&
        edge.target === 'card:b' &&
        edge.direction === 'target_to_source'
    )
  );
});

test('projectGraph rejects graph edges whose endpoints are missing', () => {
  const inputs = fixtureGraphInputs();
  inputs.concepts.card_concepts[0].card_id = 'missing';

  assert.throws(
    () => projectGraph(inputs),
    /Card-concept edge references missing card: missing/
  );
});

test('projectGraph rejects missing or stale layout card coverage', () => {
  const inputs = fixtureGraphInputs();
  delete inputs.layout.nodes.b;

  assert.throws(
    () => projectGraph(inputs),
    /Graph layout is missing card: b/
  );
});

test('projectGraph rejects malformed index collections instead of substituting empty arrays', () => {
  const inputs = fixtureGraphInputs();
  inputs.relations = {};

  assert.throws(
    () => projectGraph(inputs),
    /relations\.edges must be an array/
  );
});
