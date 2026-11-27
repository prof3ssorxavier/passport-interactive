import { useEffect, useState } from 'react';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { COLORS, PASSPORT_DIMS, PBR, SPRING_CONFIGS } from '@/constants/tokens';
import type { PageIndex, PassportTextures } from '@/types/passport';
import { createPassportTextures, disposePassportTextures } from '@/utils/textures';
import { PassportLeaf } from './PassportLeaf';

export interface PassportBookProps {
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly onNextPage: () => void;
  readonly onPrevPage: () => void;
}

const TOTAL_ROTATABLE_LEAVES = 3; // 0: Front Cover, 1: Profile/Guatemala, 2: Guatemala/SDQ

export function PassportBook({
  currentPage,
  isSigning,
  onNextPage,
  onPrevPage,
}: PassportBookProps) {
  const [textures, setTextures] = useState<PassportTextures | null>(null);

  useEffect(() => {
    let active = true;
    let loaded: PassportTextures | null = null;

    void createPassportTextures().then((result) => {
      if (!active) {
        disposePassportTextures(result);
        return;
      }
      loaded = result;
      setTextures(result);
    });

    return () => {
      active = false;
      if (loaded) {
        disposePassportTextures(loaded);
      }
    };
  }, []);

  const { width, height, coverThickness, leafZSpacing, spinePivotX } = PASSPORT_DIMS;

  // Keep closed passport centered at x = 0; shift spine to x = 0 when opened
  const { bookOffsetX } = useSpring({
    bookOffsetX: currentPage === 0 ? 0 : width / 2,
    config: SPRING_CONFIGS.bookShift,
  });

  const handleFrontClick = () => {
    if (!isSigning) onNextPage();
  };

  const handleBackClick = () => {
    if (!isSigning) onPrevPage();
  };

  const backCoverZ = -(coverThickness / 2) - leafZSpacing;
  const spineDepth = coverThickness * 2 + (TOTAL_ROTATABLE_LEAVES + 1) * leafZSpacing;

  return (
    <animated.group position-x={bookOffsetX}>
      {/* Static Back Cover */}
      <mesh position={[0, 0, backCoverZ]} castShadow receiveShadow>
        <boxGeometry args={[width, height, coverThickness]} />
        <meshStandardMaterial
          color={COLORS.leatherNavy}
          roughness={PBR.leather.roughness}
          metalness={PBR.leather.metalness}
        />
      </mesh>

      {/* Navy Leather Spine Bridge along x = -width / 2 */}
      <mesh position={[spinePivotX - 0.012, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, height, spineDepth]} />
        <meshStandardMaterial
          color={COLORS.leatherNavy}
          roughness={PBR.spine.roughness}
          metalness={PBR.spine.metalness}
        />
      </mesh>

      {textures ? (
        <>
          {/* Static Base Page (Page 3 Recto — Santo Domingo Residence Visa) */}
          <mesh
            position={[0, 0, 0]}
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              handleFrontClick();
            }}
          >
            <planeGeometry args={[width - 0.04, height - 0.05]} />
            <meshStandardMaterial
              map={textures.page3Recto}
              roughness={PBR.paper.roughness}
              metalness={PBR.paper.metalness}
              side={THREE.FrontSide}
            />
          </mesh>

          {/* Leaf 2: Guatemala Entry Visa (Recto) / Endorsements (Verso) */}
          <PassportLeaf
            index={2}
            totalLeaves={TOTAL_ROTATABLE_LEAVES}
            isFlipped={currentPage >= 3}
            frontTexture={textures.page2Recto}
            backTexture={textures.page2Verso}
            onFrontClick={handleFrontClick}
            onBackClick={handleBackClick}
          />

          {/* Leaf 1: Profile & Touch Signature (Recto) / Visa Intro (Verso) */}
          <PassportLeaf
            index={1}
            totalLeaves={TOTAL_ROTATABLE_LEAVES}
            isFlipped={currentPage >= 2}
            frontTexture={textures.page1Recto}
            backTexture={textures.page1Verso}
            onFrontClick={handleFrontClick}
            onBackClick={handleBackClick}
          />

          {/* Leaf 0: Rigid Navy Leather Front Cover with Gold Hot-Stamping */}
          <PassportLeaf
            index={0}
            totalLeaves={TOTAL_ROTATABLE_LEAVES}
            isFlipped={currentPage >= 1}
            isCover
            frontTexture={textures.coverFront}
            frontMetalnessMap={textures.coverMetalness}
            backTexture={textures.coverInner}
            onFrontClick={handleFrontClick}
            onBackClick={handleBackClick}
          />
        </>
      ) : null}
    </animated.group>
  );
}
