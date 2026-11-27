import { useEffect, useMemo, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CrestStoryTopic, Language } from '@/constants/i18n';
import { COLORS, PASSPORT_DIMS, PBR, SPRING_CONFIGS } from '@/constants/tokens';
import type { DualSignatures, PageIndex, PassportTextures } from '@/types/passport';
import { createRoundedCoverGeometry } from '@/utils/geometry';
import { createPassportTextures, disposePassportTextures } from '@/utils/textures';
import { PassportLeaf } from './PassportLeaf';

export interface PassportBookProps {
  readonly language: Language;
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly isInspecting: boolean;
  readonly showHotspots: boolean;
  readonly segmentsX?: number;
  readonly segmentsY?: number;
  readonly signatures: DualSignatures;
  readonly onNextPage: () => void;
  readonly onPrevPage: () => void;
  readonly onOpenCrestStory: (topic: CrestStoryTopic) => void;
  readonly onReady?: () => void;
}

const TOTAL_ROTATABLE_LEAVES = 3;

export function PassportBook({
  language,
  currentPage,
  isSigning,
  isInspecting,
  showHotspots,
  segmentsX = 28,
  segmentsY = 6,
  signatures,
  onNextPage,
  onPrevPage,
  onOpenCrestStory,
  onReady,
}: PassportBookProps) {
  const [textures, setTextures] = useState<PassportTextures | null>(null);
  const postureGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let active = true;
    let loaded: PassportTextures | null = null;

    void createPassportTextures(language).then((result) => {
      if (!active) {
        disposePassportTextures(result);
        return;
      }
      loaded = result;
      setTextures(result);
      onReady?.();
    });

    return () => {
      active = false;
      if (loaded) {
        disposePassportTextures(loaded);
      }
    };
  }, [language, onReady]);

  // Sync both Marcos & Allison signatures onto the Inside Cover Signature Page
  useEffect(() => {
    if (!textures) return;
    void textures.setDualSignatures(signatures);
  }, [textures, signatures]);

  const { width, height, coverThickness, cornerRadius, spinePivotX } = PASSPORT_DIMS;

  const backCoverGeom = useMemo(
    () => createRoundedCoverGeometry(width, height, coverThickness, cornerRadius, false),
    [width, height, coverThickness, cornerRadius],
  );

  const pageBlockGeom = useMemo(
    () => createRoundedCoverGeometry(width - 0.06, height - 0.07, 0.012, cornerRadius * 0.85, false),
    [width, height, cornerRadius],
  );

  useEffect(() => {
    return () => {
      backCoverGeom.dispose();
      pageBlockGeom.dispose();
    };
  }, [backCoverGeom, pageBlockGeom]);

  const { bookOffsetX } = useSpring({
    bookOffsetX: currentPage === 0 ? 0 : width / 2,
    config: SPRING_CONFIGS.bookShift,
  });

  // Smooth flat desk rest (rotation.x = -π/2 flush on y=0) vs. lifted eye-level inspection
  useFrame(({ clock }) => {
    const g = postureGroupRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();

    const targetY = isInspecting ? 2.05 + Math.sin(t * 1.2) * 0.02 : 0.058;
    const targetZ = isInspecting ? 0.65 : 0.25;
    const targetRotX = isInspecting ? -0.06 : -Math.PI / 2;
    const targetRotY = isInspecting
      ? currentPage === 0
        ? -0.1 + Math.sin(t * 0.7) * 0.02
        : 0
      : 0;
    const targetRotZ = !isInspecting && currentPage === 0 ? -0.04 : 0;

    g.position.y = THREE.MathUtils.lerp(g.position.y, targetY, 0.08);
    g.position.z = THREE.MathUtils.lerp(g.position.z, targetZ, 0.08);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRotX, 0.08);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, 0.08);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, targetRotZ, 0.08);
  });

  const handleFrontClick = () => {
    if (!isSigning) onNextPage();
  };

  const handleBackClick = () => {
    if (!isSigning) onPrevPage();
  };

  const backCoverZ = -(coverThickness / 2) - 0.014;
  const spineRadius = (coverThickness * 2 + 0.022) / 2;

  return (
    <group ref={postureGroupRef}>
      <animated.group position-x={bookOffsetX}>
        {/* Beveled Rounded Back Cover */}
        <mesh geometry={backCoverGeom} position={[0, 0, backCoverZ]} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={COLORS.leatherNavy}
            roughness={PBR.leather.roughness}
            metalness={PBR.leather.metalness}
            sheen={0.18}
            sheenRoughness={0.75}
            sheenColor="#1C3F6E"
          />
        </mesh>

        {/* Visible Stacked Cream Paper-Block Edge */}
        <mesh geometry={pageBlockGeom} position={[0, 0, -0.008]} castShadow receiveShadow>
          <meshStandardMaterial color={COLORS.paperWarmEdge} roughness={0.95} metalness={0} />
        </mesh>

        {/* Rounded Navy Leather Spine Cylinder */}
        <mesh position={[spinePivotX - 0.004, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry
            args={[spineRadius, spineRadius, height - 0.006, 20, 1, false, Math.PI, Math.PI]}
          />
          <meshStandardMaterial
            color={COLORS.leatherNavy}
            roughness={PBR.spine.roughness}
            metalness={PBR.spine.metalness}
          />
        </mesh>

        {textures ? (
          <>
            {/* Static Base Page (Page 3 Recto — Santo Domingo Residence Visa) */}
            <mesh position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[width - 0.05, height - 0.06]} />
              <meshPhysicalMaterial
                map={textures.page3Recto}
                normalMap={textures.paperNormal}
                normalScale={new THREE.Vector2(0.32, 0.32)}
                alphaMap={textures.pageAlphaRecto}
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

            {/* Leaf 2: Dual Guatemala IGM Stamps (Recto) / Endorsements (Verso) */}
            <PassportLeaf
              index={2}
              totalLeaves={TOTAL_ROTATABLE_LEAVES}
              isFlipped={currentPage >= 3}
              segmentsX={segmentsX}
              segmentsY={segmentsY}
              frontTexture={textures.page2Recto}
              backTexture={textures.page2Verso}
              paperNormalMap={textures.paperNormal}
              alphaRecto={textures.pageAlphaRecto}
              alphaVerso={textures.pageAlphaVerso}
              onFrontClick={handleFrontClick}
              onBackClick={handleBackClick}
            />

            {/* Leaf 1: Real Brazilian Biodata Page (Recto) / Antigua Photo (Verso) */}
            <PassportLeaf
              index={1}
              totalLeaves={TOTAL_ROTATABLE_LEAVES}
              isFlipped={currentPage >= 2}
              segmentsX={segmentsX}
              segmentsY={segmentsY}
              frontTexture={textures.page1Recto}
              backTexture={textures.page1Verso}
              paperNormalMap={textures.paperNormal}
              alphaRecto={textures.pageAlphaRecto}
              alphaVerso={textures.pageAlphaVerso}
              onFrontClick={handleFrontClick}
              onBackClick={handleBackClick}
            />

            {/* Leaf 0: Navy Leather Cover + Gold Foil (Front) / Dual Signature & Barcode Page (Inner) */}
            <PassportLeaf
              index={0}
              totalLeaves={TOTAL_ROTATABLE_LEAVES}
              isFlipped={currentPage >= 1}
              isCover
              language={language}
              showHotspots={showHotspots}
              frontTexture={textures.coverFront}
              frontMetalnessMap={textures.coverMetalness}
              frontRoughnessMap={textures.coverRoughness}
              frontNormalMap={textures.coverNormal}
              frontClearcoatMap={textures.coverClearcoat}
              backTexture={textures.coverInner}
              alphaRecto={textures.pageAlphaRecto}
              alphaVerso={textures.pageAlphaVerso}
              onFrontClick={handleFrontClick}
              onBackClick={handleBackClick}
              onOpenCrestStory={onOpenCrestStory}
            />
          </>
        ) : null}
      </animated.group>
    </group>
  );
}
