import { useEffect, useState } from 'react';

export interface DeviceProfile {
  readonly isMobile: boolean;
  readonly isPortrait: boolean;
  readonly aspect: number;
  readonly dpr: readonly [number, number];
  readonly shadowMapSize: 512 | 1024;
  readonly leafSegmentsX: number;
  readonly leafSegmentsY: number;
  readonly textureWidth: number;
  readonly textureHeight: number;
}

function computeProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isPortrait: false,
      aspect: 16 / 9,
      dpr: [1, 1.75],
      shadowMapSize: 1024,
      leafSegmentsX: 28,
      leafSegmentsY: 6,
      textureWidth: 1280,
      textureHeight: 1818,
    };
  }

  const width = window.innerWidth;
  const height = Math.max(1, window.innerHeight);
  const aspect = width / height;
  const isPortrait = aspect < 1;
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const isMobile = width < 768 || isTouch;

  return {
    isMobile,
    isPortrait,
    aspect,
    dpr: isMobile ? [1, 1.5] : [1, 1.75],
    shadowMapSize: isMobile ? 512 : 1024,
    leafSegmentsX: isMobile ? 18 : 28,
    leafSegmentsY: isMobile ? 4 : 6,
    textureWidth: isMobile ? 1024 : 1280,
    textureHeight: isMobile ? 1455 : 1818,
  };
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(() => computeProfile());

  useEffect(() => {
    const handleResize = () => {
      setProfile(computeProfile());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return profile;
}
