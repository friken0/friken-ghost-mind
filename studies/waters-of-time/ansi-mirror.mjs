// The same transform can be used for a scene, layer, or bounded region.
// Apply it to the shared coordinates of color, alpha and depth sources.
export function ansiMirrorPoint(x, y, {horizontal = false, vertical = false, region} = {}) {
  const {left = 0, top = 0, right = 1, bottom = 1} = region ?? {};
  if (x < left || x > right || y < top || y > bottom) return {x, y};
  return {
    x: horizontal ? left + right - x : x,
    y: vertical ? top + bottom - y : y,
  };
}

export function mirrorAnsiInk(sample, mirror) {
  return (x, y, ...args) => {
    const source = ansiMirrorPoint(x, y, mirror);
    return sample(source.x, source.y, ...args);
  };
}
