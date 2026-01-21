
import { Point } from '../types';

export const getDistance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getPathPosition = (points: Point[], distance: number): Point => {
  let remaining = distance;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentDist = getDistance(p1, p2);

    if (remaining <= segmentDist) {
      const ratio = remaining / segmentDist;
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio
      };
    }
    remaining -= segmentDist;
  }
  return points[points.length - 1];
};

export const getTotalPathLength = (points: Point[]): number => {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += getDistance(points[i], points[i + 1]);
  }
  return total;
};

export const checkCircleCollision = (p1: Point, r1: number, p2: Point, r2: number): boolean => {
  const dist = getDistance(p1, p2);
  return dist < (r1 + r2);
};
