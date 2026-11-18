export const clamp = n => Math.min(1, Math.max(0, n));
export function smooth(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
export function mix(a, b, t) {
  if(t<=0)return a;
  if(t>=1)return b;
  const w = clamp(t), v = 1 - w;
  return (Math.round((a >> 16 & 255) * v + (b >> 16 & 255) * w) << 16) |
    (Math.round((a >> 8 & 255) * v + (b >> 8 & 255) * w) << 8) |
    Math.round((a & 255) * v + (b & 255) * w);
}
