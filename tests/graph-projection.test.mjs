import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectGraph, readRequiredJson } from '../scripts/lib/graph-projection.mjs';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-card-graph-'));
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

test('projectGraph projects all graph families and preserves card relation direction', () => {
  const cards = [
    { data: { id: 'a', title: 'A', summary: 'Card A' } },
    { data: { id: 'b', title: 'B', summary: 'Card B' } }
  ];
  const concepts = {
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
  };
  const relations = {
    edges: [
      {
        source: 'a',
        target: 'b',
        type: 'depends_on',
        score: 0.75,
        direction: 'target_to_source'
      }
    ]
  };

  const graph = projectGraph({ cards, concepts, relations });

  assert.equal(graph.generatedAt, concepts.generated_at);
  assert.deepEqual(graph.stats, {
    cards: 2,
    concepts: 1,
    cardConceptEdges: 2,
    conceptRelations: 1,
    cardRelations: 1
  });
  assert.deepEqual(
    graph.nodes.map((node) => node.id),
    ['card:a', 'card:b', 'concept:agent-memory']
  );
  assert.equal(graph.nodes.find((node) => node.id === 'card:a').degree, 1);
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
        edge.kind === 'concept-concept' &&
        edge.source === 'concept:agent-memory' &&
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
  const cards = [{ data: { id: 'a', title: 'A', summary: 'Card A' } }];
  const concepts = {
    concepts: [{ id: 'c', label: 'C', type: 'tag', description: 'C', card_count: 1 }],
    card_concepts: [{ card_id: 'missing', concept_id: 'c', strength: 1, evidence: [] }],
    concept_relations: []
  };
  const relations = { edges: [] };

  assert.throws(
    () => projectGraph({ cards, concepts, relations }),
    /Card-concept edge references missing card: missing/
  );
});

test('projectGraph rejects malformed index collections instead of substituting empty arrays', () => {
  const cards = [{ data: { id: 'a', title: 'A', summary: 'Card A' } }];
  const concepts = { concepts: [], card_concepts: [], concept_relations: [] };

  assert.throws(
    () => projectGraph({ cards, concepts, relations: {} }),
    /relations\.edges must be an array/
  );
});
