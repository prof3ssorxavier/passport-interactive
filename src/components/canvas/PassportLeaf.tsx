import { useEffect, useMemo, useRef } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { I18N, type CrestStoryTopic, type Language } from '@/constants/i18n';
import { COLORS, PASSPORT_DIMS, PBR, SPRING_CONFIGS } from '@/constants/tokens';
import { createRoundedCoverGeometry } from '@/utils/geometry';

export interface PassportLeafProps {
  /** Zero-based index from top of right stack: 0 = Front Cover, 1 = Leaf 1, 2 = Leaf 2 */
  readonly index: number;
  readonly totalLeaves: number;
  readonly isFlipped: boolean;
  readonly isCover?: boolean;
  readonly segmentsX?: number;
  readonly segmentsY?: number;
  readonly language?: Language;
  readonly showHotspots?: boolean;
  readonly frontTexture: THREE.Texture;
  readonly backTexture: THREE.Texture;
  readonly frontMetalnessMap?: THREE.Texture;
  readonly frontRoughnessMap?: THREE.Texture;
  readonly frontNormalMap?: THREE.Texture;
  readonly frontClearcoatMap?: THREE.Texture;
  readonly paperNormalMap?: THREE.Texture;
  readonly alphaRecto: THREE.Texture;
  readonly alphaVerso: THREE.Texture;
  readonly onFrontClick?: () => void;
  readonly onBackClick?: () => void;
  readonly onOpenCrestStory?: (topic: CrestStoryTopic) => void;
}

const DRAG_PIXEL_THRESHOLD = 4;
const BORDER_ZONE_RATIO = 0.2;

const COVER_NORMAL_SCALE = new THREE.Vector2(0.85, 0.85);
const PAPER_NORMAL_SCALE = new THREE.Vector2(0.32, 0.32);

function isPointerOnOuterBorder(event: ThreeEvent<PointerEvent | MouseEvent>, isFlipped: boolean): boolean {
  const uv = event.uv;
  if (!uv) return false;
  return isFlipped ? uv.x <= BORDER_ZONE_RATIO : uv.x >= 1 - BORDER_ZONE_RATIO;
}

function deformCurvedPage(
  geometry: THREE.PlaneGeometry,
  pageWidth: number,
  segmentsX: number,
  progress: number,
  baseZ: number,
  normalOffset: number,
  isVerso: boolean,
): void {
  const pos = geometry.attributes.position;
  if (!pos) return;

  const baseAngle = progress * Math.PI;
  const midTurn = Math.sin(progress * Math.PI);

  for (let i = 0; i < pos.count; i += 1) {
    const col = i % (segmentsX + 1);
    const uTex = col / segmentsX;
    const u = isVerso ? 1 - uTex : uTex;

    const lag = midTurn * 0.44 * Math.pow(u, 1.35);
    const localAngle = Math.max(0, Math.min(Math.PI, baseAngle - lag));

    const dist = u * pageWidth;
    const cosA = Math.cos(localAngle);
    const sinA = Math.sin(localAngle);

    // Always positive +Z arch so both right-side and left-side pages curve UP away from covers
    const archUpZ = Math.sin(u * Math.PI) * (0.014 + 0.052 * midTurn);
    const nx = -sinA;
    const nz = cosA;

    pos.setX(i, cosA * dist + nx * normalOffset);
    pos.setZ(i, baseZ + sinA * dist + archUpZ + nz * normalOffset);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function PassportLeaf({
  index,
  totalLeaves,
  isFlipped,
  isCover = false,
  segmentsX = 28,
  segmentsY = 6,
  language = 'pt',
  showHotspots = false,
  frontTexture,
  backTexture,
  frontMetalnessMap,
  frontRoughnessMap,
  frontNormalMap,
  frontClearcoatMap,
  paperNormalMap,
  alphaRecto,
  alphaVerso,
  onFrontClick,
  onBackClick,
  onOpenCrestStory,
}: PassportLeafProps) {
  const { width, height, coverThickness, leafThickness, leafZSpacing, cornerRadius, spinePivotX } =
    PASSPORT_DIMS;

  const pageWidth = width - 0.05;
  const pageHeight = height - 0.06;

  const rightZ = isCover
    ? totalLeaves * leafZSpacing + coverThickness / 2 + 0.01
    : (totalLeaves - index) * leafZSpacing + 0.002;

  const leftZ = isCover ? -(coverThickness / 2) - 0.006 : 0.004 + index * 0.004;

  const coverSpring = useSpring({
    rotationY: isFlipped ? -Math.PI : 0,
    positionZ: isFlipped ? leftZ : rightZ,
    config: SPRING_CONFIGS.cover,
  });

  const leafSpring = useSpring({
    progress: isFlipped ? 1 : 0,
    config: SPRING_CONFIGS.leaf,
  });

  const coverBoardGeom = useMemo(() => {
    if (!isCover) return null;
    return createRoundedCoverGeometry(width, height, coverThickness, cornerRadius, true);
  }, [isCover, width, height, coverThickness, cornerRadius]);

  const rectoGeom = useMemo(() => {
    if (isCover) return null;
    return new THREE.PlaneGeometry(pageWidth, pageHeight, segmentsX, segmentsY);
  }, [isCover, pageWidth, pageHeight, segmentsX, segmentsY]);

  const versoGeom = useMemo(() => {
    if (isCover) return null;
    return new THREE.PlaneGeometry(pageWidth, pageHeight, segmentsX, segmentsY);
  }, [isCover, pageWidth, pageHeight, segmentsX, segmentsY]);

  useEffect(() => {
    return () => {
      coverBoardGeom?.dispose();
      rectoGeom?.dispose();
      versoGeom?.dispose();
      document.body.style.cursor = 'auto';
    };
  }, [coverBoardGeom, rectoGeom, versoGeom]);

  const lastProgressRef = useRef<number>(-1);
  useEffect(() => {
    if (isCover || !rectoGeom || !versoGeom) return;
    const p = isFlipped ? 1 : 0;
    const baseZ = rightZ * (1 - p) + leftZ * p;
    deformCurvedPage(rectoGeom, pageWidth, segmentsX, p, baseZ, leafThickness / 2, false);
    deformCurvedPage(versoGeom, pageWidth, segmentsX, p, baseZ, -leafThickness / 2, true);
    lastProgressRef.current = p;
  }, [isCover, rectoGeom, versoGeom, pageWidth, segmentsX, rightZ, leftZ, leafThickness, isFlipped]);

  useFrame(() => {
    if (isCover || !rectoGeom || !versoGeom) return;
    const p = leafSpring.progress.get();
    if (Math.abs(p - lastProgressRef.current) < 0.00025) return;

    const baseZ = rightZ * (1 - p) + leftZ * p;
    deformCurvedPage(rectoGeom, pageWidth, segmentsX, p, baseZ, leafThickness / 2, false);
    deformCurvedPage(versoGeom, pageWidth, segmentsX, p, baseZ, -leafThickness / 2, true);
    lastProgressRef.current = p;
  });

  const triggerFlip = () => {
    if (isFlipped) {
      onBackClick?.();
    } else {
      onFrontClick?.();
    }
  };

  // Single-click ONLY flips when on the outer 20% border/corner AND not an orbit drag
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > DRAG_PIXEL_THRESHOLD) return;
    if (isPointerOnOuterBorder(event, isFlipped)) {
      triggerFlip();
    }
  };

  // Double-click flips anywhere on the cover/page (also drag-safe)
  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > DRAG_PIXEL_THRESHOLD) return;
    triggerFlip();
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = isPointerOnOuterBorder(event, isFlipped) ? 'pointer' : 'grab';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
  };

  if (isCover && coverBoardGeom) {
    return (
      <animated.group
        position-x={spinePivotX}
        position-y={0}
        position-z={coverSpring.positionZ}
        rotation-y={coverSpring.rotationY}
      >
        <group
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        >
          <mesh geometry={coverBoardGeom} castShadow receiveShadow>
            <meshPhysicalMaterial
              color={COLORS.leatherNavy}
              roughness={PBR.leather.roughness}
              metalness={PBR.leather.metalness}
              sheen={0.18}
              sheenRoughness={0.75}
              sheenColor="#1C3F6E"
            />
          </mesh>

          {/* Outer gold-stamped leather face (+Z) with MeshPhysicalMaterial + Normal Map + Foil Clearcoat */}
          <mesh position={[width / 2, 0, coverThickness / 2 + 0.0005]} castShadow receiveShadow>
            <planeGeometry args={[width - 0.01, height - 0.01]} />
            <meshPhysicalMaterial
              map={frontTexture}
              metalnessMap={frontMetalnessMap ?? null}
              roughnessMap={frontRoughnessMap ?? null}
              normalMap={frontNormalMap ?? null}
              normalScale={COVER_NORMAL_SCALE}
              clearcoat={0.78}
              clearcoatMap={frontClearcoatMap ?? null}
              clearcoatRoughness={0.18}
              metalness={1}
              roughness={1}
              alphaMap={alphaRecto}
              transparent
              alphaTest={0.5}
              side={THREE.FrontSide}
            />
          </mesh>

          <mesh
            position={[width / 2, 0, -(coverThickness / 2 + 0.0005)]}
            rotation={[0, Math.PI, 0]}
            receiveShadow
          >
            <planeGeometry args={[width - 0.01, height - 0.01]} />
            <meshPhysicalMaterial
              map={backTexture}
              roughness={0.86}
              metalness={0.05}
              alphaMap={alphaVerso}
              transparent
              alphaTest={0.5}
              side={THREE.FrontSide}
            />
          </mesh>

          {/* Subtle pulsing gold interactive hotspots on the closed Front Cover */}
          {showHotspots && !isFlipped && onOpenCrestStory ? (
            <>
              <Html
                position={[width * 0.34, 0.22, coverThickness / 2 + 0.03]}
                center
                distanceFactor={6}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCrestStory('colibri');
                  }}
                  title={I18N[language].hotspotColibri}
                  className="group flex items-center gap-1.5 rounded-full border border-[#F5DF89]/80 bg-[#102A4C]/85 px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap text-[#F5DF89] shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-[#102A4C] cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-[#F5DF89] animate-ping" />
                  <span>{I18N[language].hotspotColibri}</span>
                </button>
              </Html>

              <Html
                position={[width * 0.56, -0.02, coverThickness / 2 + 0.03]}
                center
                distanceFactor={6}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCrestStory('tangerine');
                  }}
                  title={I18N[language].hotspotTangerine}
                  className="group flex items-center gap-1.5 rounded-full border border-[#E86F2C]/90 bg-[#102A4C]/85 px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap text-[#F7F3E8] shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-[#E86F2C] cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-[#E86F2C] animate-ping" />
                  <span>{I18N[language].hotspotTangerine}</span>
                </button>
              </Html>
            </>
          ) : null}
        </group>
      </animated.group>
    );
  }

  return (
    <group
      position={[spinePivotX, 0, 0]}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      {rectoGeom ? (
        <mesh geometry={rectoGeom} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={frontTexture}
            normalMap={paperNormalMap ?? null}
            normalScale={PAPER_NORMAL_SCALE}
            alphaMap={alphaRecto}
            transparent
            alphaTest={0.5}
            roughness={PBR.paper.roughness}
            metalness={PBR.paper.metalness}
            sheen={0.28}
            sheenRoughness={0.85}
            sheenColor="#F5EFE0"
            side={THREE.FrontSide}
          />
        </mesh>
      ) : null}

      {versoGeom ? (
        <mesh geometry={versoGeom} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={backTexture}
            normalMap={paperNormalMap ?? null}
            normalScale={PAPER_NORMAL_SCALE}
            alphaMap={alphaVerso}
            transparent
            alphaTest={0.5}
            roughness={PBR.paper.roughness}
            metalness={PBR.paper.metalness}
            sheen={0.28}
            sheenRoughness={0.85}
            sheenColor="#F5EFE0"
            side={THREE.FrontSide}
          />
        </mesh>
      ) : null}
    </group>
  );
}
