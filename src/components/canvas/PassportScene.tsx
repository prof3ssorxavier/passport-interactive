import { Suspense, useEffect, useRef } from 'react';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CrestStoryTopic, Language } from '@/constants/i18n';
import type { DeviceProfile } from '@/hooks/useDeviceProfile';
import type { DualSignatures, PageIndex } from '@/types/passport';
import { DeskEnvironment } from './DeskEnvironment';
import { PassportBook } from './PassportBook';

export interface PassportSceneProps {
  readonly language: Language;
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly isInspecting: boolean;
  readonly showHotspots: boolean;
  readonly device: DeviceProfile;
  readonly signatures: DualSignatures;
  readonly onNextPage: () => void;
  readonly onPrevPage: () => void;
  readonly onOpenCrestStory: (topic: CrestStoryTopic) => void;
  readonly onReady: () => void;
}

const DESK_CAM_CLOSED = new THREE.Vector3(0.3, 4.95, 2.35);
const DESK_CAM_OPEN = new THREE.Vector3(0, 5.55, 2.25);
const DESK_TARGET = new THREE.Vector3(0, 0.06, 0.25);

const INSPECT_CAM_CLOSED = new THREE.Vector3(0.45, 2.15, 5.05);
const INSPECT_CAM_OPEN = new THREE.Vector3(0, 2.15, 5.55);
const INSPECT_TARGET = new THREE.Vector3(0, 2.05, 0.65);

/**
 * Computes aspect-aware camera positions so both closed covers and wide two-page spreads
 * frame cleanly inside portrait smartphone screens without clipping either page.
 */
function getResponsiveCamPos(
  baseCam: THREE.Vector3,
  target: THREE.Vector3,
  aspect: number,
  isOpen: boolean,
): THREE.Vector3 {
  if (aspect >= 0.95) {
    return baseCam;
  }
  const safeAspect = Math.max(0.42, aspect);
  const scale = isOpen
    ? Math.max(1, 1.12 / safeAspect)
    : Math.max(1, 0.88 / safeAspect);

  return baseCam.clone().sub(target).multiplyScalar(scale).add(target);
}

function CameraRig({
  currentPage,
  isInspecting,
  aspect,
  controlsRef,
  userInteractingRef,
}: {
  readonly currentPage: PageIndex;
  readonly isInspecting: boolean;
  readonly aspect: number;
  readonly controlsRef: React.RefObject<OrbitControlsImpl | null>;
  readonly userInteractingRef: React.MutableRefObject<boolean>;
}) {
  const { camera } = useThree();
  const isTransitioningRef = useRef(true);
  const prevStateRef = useRef({
    open: currentPage > 0,
    inspecting: isInspecting,
    aspect,
  });

  useEffect(() => {
    const open = currentPage > 0;
    if (
      open !== prevStateRef.current.open ||
      isInspecting !== prevStateRef.current.inspecting ||
      Math.abs(aspect - prevStateRef.current.aspect) > 0.05
    ) {
      prevStateRef.current = { open, inspecting: isInspecting, aspect };
      isTransitioningRef.current = true;
    }
  }, [currentPage, isInspecting, aspect]);

  useFrame(() => {
    if (!isTransitioningRef.current || userInteractingRef.current) return;

    const isOpen = currentPage > 0;
    const baseCam = isInspecting
      ? isOpen
        ? INSPECT_CAM_OPEN
        : INSPECT_CAM_CLOSED
      : isOpen
        ? DESK_CAM_OPEN
        : DESK_CAM_CLOSED;

    const targetLook = isInspecting ? INSPECT_TARGET : DESK_TARGET;
    const targetCam = getResponsiveCamPos(baseCam, targetLook, aspect, isOpen);

    camera.position.lerp(targetCam, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook, 0.09);
      controlsRef.current.update();
    }

    const camClose = camera.position.distanceTo(targetCam) < 0.025;
    const lookClose =
      !controlsRef.current || controlsRef.current.target.distanceTo(targetLook) < 0.025;
    if (camClose && lookClose) {
      isTransitioningRef.current = false;
    }
  });

  return null;
}

export function PassportScene({
  language,
  currentPage,
  isSigning,
  isInspecting,
  showHotspots,
  device,
  signatures,
  onNextPage,
  onPrevPage,
  onOpenCrestStory,
  onReady,
}: PassportSceneProps) {
  const userInteractingRef = useRef(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const initialCam = getResponsiveCamPos(DESK_CAM_CLOSED, DESK_TARGET, device.aspect, false);

  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        dpr={[device.dpr[0], device.dpr[1]]}
        camera={{
          position: [initialCam.x, initialCam.y, initialCam.z],
          fov: device.isPortrait ? 42 : 38,
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.92,
        }}
      >
        <color attach="background" args={['#9B9A96']} />

        <ambientLight intensity={0.38} color="#FFF7EA" />

        {/* Golden afternoon sunlight streaming through the open window */}
        <directionalLight
          position={[1.8, 6.2, -2.8]}
          intensity={1.15}
          color="#FFE8C2"
          castShadow
          shadow-mapSize={[device.shadowMapSize, device.shadowMapSize]}
          shadow-camera-near={1}
          shadow-camera-far={20}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-bias={-0.0004}
        />

        <directionalLight position={[2.8, 5.2, 4.5]} intensity={0.68} color="#FFFFFF" />
        <pointLight position={[-3.2, 3.0, 2.8]} intensity={0.48} color="#FFF0C8" />

        <CameraRig
          currentPage={currentPage}
          isInspecting={isInspecting}
          aspect={device.aspect}
          controlsRef={controlsRef}
          userInteractingRef={userInteractingRef}
        />

        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.32} />

          <DeskEnvironment />

          <PassportBook
            language={language}
            currentPage={currentPage}
            isSigning={isSigning}
            isInspecting={isInspecting}
            showHotspots={showHotspots}
            segmentsX={device.leafSegmentsX}
            segmentsY={device.leafSegmentsY}
            signatures={signatures}
            onNextPage={onNextPage}
            onPrevPage={onPrevPage}
            onOpenCrestStory={onOpenCrestStory}
            onReady={onReady}
          />

          <ContactShadows
            frames={1}
            position={[0, 0.004, 0.25]}
            opacity={0.4}
            scale={10}
            blur={1.8}
            far={3.5}
            color="#24150A"
          />
        </Suspense>

        {/* Touch Isolation Rule: OrbitControls is disabled whenever isSigning is true */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={!isSigning}
          target={[0, 0.06, 0.25]}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.4}
          maxDistance={device.isPortrait ? 18 : 9}
          minPolarAngle={0.08}
          maxPolarAngle={isInspecting ? Math.PI * 0.56 : Math.PI * 0.47}
          minAzimuthAngle={isInspecting ? -Math.PI * 0.32 : -Math.PI * 0.45}
          maxAzimuthAngle={isInspecting ? Math.PI * 0.32 : Math.PI * 0.45}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
          onStart={() => {
            userInteractingRef.current = true;
          }}
          onEnd={() => {
            userInteractingRef.current = false;
          }}
        />
      </Canvas>
    </div>
  );
}
