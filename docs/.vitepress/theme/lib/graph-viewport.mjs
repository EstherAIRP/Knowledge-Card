export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finitePoint(node) {
  return Number.isFinite(Number(node?.x)) && Number.isFinite(Number(node?.y));
}

export function calculateNodeBounds(nodes) {
  const valid = (nodes ?? []).filter(finitePoint);
  if (valid.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0
    };
  }

  const xs = valid.map((node) => Number(node.x));
  const ys = valid.map((node) => Number(node.y));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

export function fitNodesToViewport(
  nodes,
  { width, height, padding = 72, minimumSpan = 1e-6 } = {}
) {
  const viewportWidth = Number(width);
  const viewportHeight = Number(height);
  const safePadding = Math.max(0, Number(padding) || 0);

  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    throw new Error('viewport width must be a positive finite number.');
  }
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    throw new Error('viewport height must be a positive finite number.');
  }

  const bounds = calculateNodeBounds(nodes);
  const spanX = Math.max(bounds.width, minimumSpan);
  const spanY = Math.max(bounds.height, minimumSpan);
  const usableWidth = Math.max(1, viewportWidth - safePadding * 2);
  const usableHeight = Math.max(1, viewportHeight - safePadding * 2);
  const scale = Math.min(usableWidth / spanX, usableHeight / spanY);

  return {
    scale,
    bounds,
    nodes: (nodes ?? []).map((node) => {
      if (!finitePoint(node)) return { ...node };
      return {
        ...node,
        semanticX: Number(node.x),
        semanticY: Number(node.y),
        x: viewportWidth / 2 + (Number(node.x) - bounds.centerX) * scale,
        y: viewportHeight / 2 + (Number(node.y) - bounds.centerY) * scale
      };
    })
  };
}

export function clampZoom(scale, { minimum = 0.55, maximum = 4 } = {}) {
  const numeric = Number(scale);
  if (!Number.isFinite(numeric)) return minimum;
  return clamp(numeric, minimum, maximum);
}

export function zoomAroundPoint(
  viewport,
  point,
  requestedScale,
  options = {}
) {
  const currentScale = clampZoom(viewport?.scale ?? 1, options);
  const nextScale = clampZoom(requestedScale, options);
  const x = Number(viewport?.x) || 0;
  const y = Number(viewport?.y) || 0;
  const pointX = Number(point?.x) || 0;
  const pointY = Number(point?.y) || 0;

  const worldX = (pointX - x) / currentScale;
  const worldY = (pointY - y) / currentScale;

  return {
    scale: nextScale,
    x: pointX - worldX * nextScale,
    y: pointY - worldY * nextScale
  };
}

export function fitViewportToNodes(
  nodes,
  {
    width,
    height,
    padding = 110,
    minimumScale = 1,
    maximumScale = 2.8
  } = {}
) {
  const bounds = calculateNodeBounds(nodes);
  if (!nodes?.length || (bounds.width === 0 && bounds.height === 0)) {
    return { x: 0, y: 0, scale: 1 };
  }

  const usableWidth = Math.max(1, Number(width) - padding * 2);
  const usableHeight = Math.max(1, Number(height) - padding * 2);
  const spanX = Math.max(bounds.width, 1);
  const spanY = Math.max(bounds.height, 1);
  const scale = clamp(
    Math.min(usableWidth / spanX, usableHeight / spanY),
    minimumScale,
    maximumScale
  );

  return {
    scale,
    x: Number(width) / 2 - bounds.centerX * scale,
    y: Number(height) / 2 - bounds.centerY * scale
  };
}

export function pointDistance(left, right) {
  return Math.hypot(
    Number(right?.x ?? 0) - Number(left?.x ?? 0),
    Number(right?.y ?? 0) - Number(left?.y ?? 0)
  );
}

export function midpoint(left, right) {
  return {
    x: (Number(left?.x ?? 0) + Number(right?.x ?? 0)) / 2,
    y: (Number(left?.y ?? 0) + Number(right?.y ?? 0)) / 2
  };
}
