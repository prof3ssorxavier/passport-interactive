import { Suspense } from 'react';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { COLORS } from '@/constants/tokens';
import type { PageIndex } from '@/types/passport';
import { PassportBook } from './PassportBook';

export interface PassportSceneProps {
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly onNextPage: () => void;
  readonly onPrevPage: () => void;
}

export function PassportScene({
  currentPage,
  isSigning,
  onNextPage,
  onPrevPage,
}: PassportSceneProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.25, 5.6], fov: 38 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />

        {/* Studio key light */}
        <directionalLight
          position={[4, 6, 5]}
          intensity={1.35}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
        />

        {/* Warm tangerine-gold rim light to catch #D4AF37 foil stamping */}
        <pointLight position={[-4, 2.5, 3]} intensity={0.75} color={COLORS.foilGoldHighlight} />
        <pointLight position={[3, -2, 2.5]} intensity={0.35} color={COLORS.tangerine} />

        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.4} />
          <PassportBook
            currentPage={currentPage}
            isSigning={isSigning}
            onNextPage={onNextPage}
            onPrevPage={onPrevPage}
          />
          <ContactShadows
            position={[0, -1.85, 0]}
            opacity={0.45}
            scale={10}
            blur={2.4}
            far={4}
            color="#040B14"
          />
        </Suspense>

        {/* Touch Isolation Rule: OrbitControls is disabled whenever isSigning is true */}
        <OrbitControls
          makeDefault
          enabled={!isSigning}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.8}
          maxDistance={8.5}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.82}
        />
      </Canvas>
    </div>
  );
}
