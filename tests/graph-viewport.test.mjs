import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateNodeBounds,
  fitNodesToViewport,
  fitViewportToNodes,
  midpoint,
  pointDistance,
  zoomAroundPoint
} from '../docs/.vitepress/theme/lib/graph-viewport.mjs';

test('fitNodesToViewport preserves aspect ratio with one uniform semantic scale', () => {
  const source = [
    { id: 'a', x: -2, y: -1 },
    { id: 'b', x: 2, y: 1 }
  ];

  const fitted = fitNodesToViewport(source, {
    width: 1000,
    height: 700,
    padding: 100
  });

  assert.equal(fitted.nodes.length, 2);
  assert.equal(fitted.scale, 200);
  assert.deepEqual(
    fitted.nodes.map((node) => [node.x, node.y]),
    [[100, 150], [900, 550]]
  );

  const sourceDx = source[1].x - source[0].x;
  const sourceDy = source[1].y - source[0].y;
  const fittedDx = fitted.nodes[1].x - fitted.nodes[0].x;
  const fittedDy = fitted.nodes[1].y - fitted.nodes[0].y;
  assert.equal(fittedDx / sourceDx, fittedDy / sourceDy);
});

test('calculateNodeBounds ignores invalid points and centers the occupied area', () => {
  const bounds = calculateNodeBounds([
    { x: -3, y: 4 },
    { x: 5, y: -2 },
    { x: Number.NaN, y: 99 }
  ]);

  assert.deepEqual(bounds, {
    minX: -3,
    maxX: 5,
    minY: -2,
    maxY: 4,
    width: 8,
    height: 6,
    centerX: 1,
    centerY: 1
  });
});

test('zoomAroundPoint keeps the semantic point under the cursor fixed', () => {
  const viewport = { x: 20, y: -10, scale: 1.5 };
  const cursor = { x: 420, y: 280 };
  const world = {
    x: (cursor.x - viewport.x) / viewport.scale,
    y: (cursor.y - viewport.y) / viewport.scale
  };

  const zoomed = zoomAroundPoint(viewport, cursor, 3);

  assert.equal(zoomed.scale, 3);
  assert.ok(Math.abs(zoomed.x + world.x * zoomed.scale - cursor.x) < 1e-9);
  assert.ok(Math.abs(zoomed.y + world.y * zoomed.scale - cursor.y) < 1e-9);
});

test('fitViewportToNodes zooms a local neighborhood without shrinking below global fit', () => {
  const viewport = fitViewportToNodes(
    [
      { x: 400, y: 300 },
      { x: 500, y: 360 },
      { x: 460, y: 420 }
    ],
    { width: 1000, height: 720, padding: 120 }
  );

  assert.ok(viewport.scale >= 1);
  assert.ok(viewport.scale <= 2.8);
  assert.ok(Number.isFinite(viewport.x));
  assert.ok(Number.isFinite(viewport.y));
});

test('pinch helpers calculate distance and midpoint', () => {
  const left = { x: 100, y: 200 };
  const right = { x: 300, y: 400 };

  assert.equal(pointDistance(left, right), Math.hypot(200, 200));
  assert.deepEqual(midpoint(left, right), { x: 200, y: 300 });
});
