import * as THREE from 'three';

/**
 * Creates a physically beveled ISO ID-3 passport cover board with flush left spine
 * and smoothly rounded outer right corners.
 * Origin is centered horizontally at [0..width] shifted by [-width/2..+width/2]
 * or spine-aligned [0..width] when spineAligned = true.
 */
export function createRoundedCoverGeometry(
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number,
  spineAligned = false,
): THREE.ExtrudeGeometry {
  const bevel = 0.005;
  const innerW = width - bevel * 2;
  const innerH = height - bevel * 2;
  const halfH = innerH / 2;
  const r = Math.min(cornerRadius, innerW * 0.25, innerH * 0.25);

  const shape = new THREE.Shape();
  // Spine edge (left, x = 0) is crisp/flush; outer right corners are rounded
  shape.moveTo(0, -halfH);
  shape.lineTo(innerW - r, -halfH);
  shape.quadraticCurveTo(innerW, -halfH, innerW, -halfH + r);
  shape.lineTo(innerW, halfH - r);
  shape.quadraticCurveTo(innerW, halfH, innerW - r, halfH);
  shape.lineTo(0, halfH);
  shape.closePath();

  const extrudeDepth = Math.max(0.002, thickness - bevel * 2);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 14,
  });

  // Center along Z so front is at +thickness/2 and back is at -thickness/2
  geometry.translate(spineAligned ? bevel : -width / 2 + bevel, 0, -extrudeDepth / 2);
  geometry.computeVertexNormals();
  return geometry;
}
