import { useCallback, useEffect, useState } from 'react';
import type { DualSignatures, PageIndex } from '@/types/passport';
import { playCoverFlipSound, playPageFlipSound } from '@/utils/sound';

const MIN_PAGE: PageIndex = 0;
const MAX_PAGE: PageIndex = 3;

export interface UsePassportStateReturn {
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly isInspecting: boolean;
  readonly signatures: DualSignatures;
  readonly setIsSigning: (signing: boolean) => void;
  readonly setIsInspecting: (inspecting: boolean) => void;
  readonly setSignatures: (sigs: DualSignatures) => void;
  readonly goToPage: (page: PageIndex) => void;
  readonly nextPage: () => void;
  readonly prevPage: () => void;
  readonly canGoPrev: boolean;
  readonly canGoNext: boolean;
}

function triggerTurnSound(from: PageIndex, to: PageIndex): void {
  if (from === to) return;
  if (from === 0 || to === 0) {
    playCoverFlipSound();
  } else {
    playPageFlipSound();
  }
}

export function usePassportState(): UsePassportStateReturn {
  const [currentPage, setCurrentPage] = useState<PageIndex>(0);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [signatures, setSignatures] = useState<DualSignatures>({
    marcos: null,
    allison: null,
  });

  const goToPage = useCallback((page: PageIndex) => {
    setCurrentPage((prev) => {
      triggerTurnSound(prev, page);
      return page;
    });
    if (page !== 1) {
      setIsSigning(false);
    }
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.min(MAX_PAGE, prev + 1) as PageIndex;
      triggerTurnSound(prev, next);
      if (next !== 1) {
        setIsSigning(false);
      }
      return next;
    });
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.max(MIN_PAGE, prev - 1) as PageIndex;
      triggerTurnSound(prev, next);
      if (next !== 1) {
        setIsSigning(false);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSigning) return;
      if (event.key === 'ArrowRight') {
        nextPage();
      } else if (event.key === 'ArrowLeft') {
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSigning, nextPage, prevPage]);

  return {
    currentPage,
    isSigning,
    isInspecting,
    signatures,
    setIsSigning,
    setIsInspecting,
    setSignatures,
    goToPage,
    nextPage,
    prevPage,
    canGoPrev: currentPage > MIN_PAGE,
    canGoNext: currentPage < MAX_PAGE,
  };
}
