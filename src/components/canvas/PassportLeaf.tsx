import { useMemo } from 'react';
import { animated, useSpring } from '@react-spring/three';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, PASSPORT_DIMS, PBR, SPRING_CONFIGS } from '@/constants/tokens';

export interface PassportLeafProps {
  /** Zero-based index from top of right stack: 0 = Front Cover, 1 = Leaf 1, 2 = Leaf 2 */
  readonly index: number;
  readonly totalLeaves: number;
  readonly isFlipped: boolean;
  readonly isCover?: boolean;
  readonly frontTexture: THREE.Texture;
  readonly backTexture: THREE.Texture;
  readonly frontMetalnessMap?: THREE.Texture;
  readonly onFrontClick?: () => void;
  readonly onBackClick?: () => void;
}

export function PassportLeaf({
  index,
  totalLeaves,
  isFlipped,
  isCover = false,
  frontTexture,
  backTexture,
  frontMetalnessMap,
  onFrontClick,
  onBackClick,
}: PassportLeafProps) {
  const { width, height, coverThickness, leafThickness, leafZSpacing, spinePivotX } = PASSPORT_DIMS;

  // Anti-z-fighting stack heights (exact 0.002 leaf spacing on both right and left stacks)
  const rightZ = isCover
    ? totalLeaves * leafZSpacing + coverThickness / 2
    : (totalLeaves - index) * leafZSpacing;

  const leftZ = isCover ? -(coverThickness / 2) : index * leafZSpacing;

  // Slight natural rest angle so flipped pages sit organically without clipping
  const targetRotationY = isFlipped ? -Math.PI + 0.015 : 0;
  const targetZ = isFlipped ? leftZ : rightZ;

  const { rotationY, positionZ } = useSpring({
    rotationY: targetRotationY,
    positionZ: targetZ,
    config: isCover ? SPRING_CONFIGS.cover : SPRING_CONFIGS.leaf,
  });

  // Materials for the rigid 3D leather front cover (6 faces of BoxGeometry)
  const coverMaterials = useMemo(() => {
    if (!isCover) return null;

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.leatherNavy,
      roughness: PBR.leather.roughness,
      metalness: PBR.leather.metalness,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      metalnessMap: frontMetalnessMap ?? null,
      metalness: frontMetalnessMap ? PBR.goldFoil.metalness : PBR.leather.metalness,
      roughness: PBR.leather.roughness * 0.75,
    });

    const innerMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.82,
      metalness: 0.05,
    });

    // BoxGeometry face order: +X, -X, +Y, -Y, +Z (front), -Z (back/inner)
    return [
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      frontMaterial,
      innerMaterial,
    ];
  }, [isCover, frontTexture, backTexture, frontMetalnessMap]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (isFlipped) {
      onBackClick?.();
    } else {
      onFrontClick?.();
    }
  };

  return (
    // Left-edge spine hinge pivot at x = -width / 2
    <animated.group
      position-x={spinePivotX}
      position-y={0}
      position-z={positionZ}
      rotation-y={rotationY}
    >
      {/* Offset geometry by +width / 2 so left edge aligns with the spine pivot */}
      <group position={[width / 2, 0, 0]} onClick={handleClick}>
        {isCover && coverMaterials ? (
          <mesh castShadow receiveShadow material={coverMaterials}>
            <boxGeometry args={[width, height, coverThickness]} />
          </mesh>
        ) : (
          <>
            {/* Recto (front face, +Z when unflipped) */}
            <mesh position={[0, 0, leafThickness / 2]} castShadow receiveShadow>
              <planeGeometry args={[width - 0.04, height - 0.05]} />
              <meshStandardMaterial
                map={frontTexture}
                roughness={PBR.paper.roughness}
                metalness={PBR.paper.metalness}
                side={THREE.FrontSide}
              />
            </mesh>

            {/* Verso (back face, -Z when unflipped → faces viewer when flipped) */}
            <mesh
              position={[0, 0, -leafThickness / 2]}
              rotation={[0, Math.PI, 0]}
              castShadow
              receiveShadow
            >
              <planeGeometry args={[width - 0.04, height - 0.05]} />
              <meshStandardMaterial
                map={backTexture}
                roughness={PBR.paper.roughness}
                metalness={PBR.paper.metalness}
                side={THREE.FrontSide}
              />
            </mesh>
          </>
        )}
      </group>
    </animated.group>
  );
}
