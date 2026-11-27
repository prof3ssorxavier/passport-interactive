import { useCallback, useEffect, useState } from 'react';
import type { PageIndex } from '@/types/passport';

const MIN_PAGE: PageIndex = 0;
const MAX_PAGE: PageIndex = 3;

export interface UsePassportStateReturn {
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly setIsSigning: (signing: boolean) => void;
  readonly goToPage: (page: PageIndex) => void;
  readonly nextPage: () => void;
  readonly prevPage: () => void;
  readonly canGoPrev: boolean;
  readonly canGoNext: boolean;
}

export function usePassportState(): UsePassportStateReturn {
  const [currentPage, setCurrentPage] = useState<PageIndex>(0);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  const goToPage = useCallback((page: PageIndex) => {
    setCurrentPage(page);
    if (page !== 1) {
      setIsSigning(false);
    }
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.min(MAX_PAGE, prev + 1) as PageIndex;
      if (next !== 1) {
        setIsSigning(false);
      }
      return next;
    });
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.max(MIN_PAGE, prev - 1) as PageIndex;
      if (next !== 1) {
        setIsSigning(false);
      }
      return next;
    });
  }, []);

  // Keyboard navigation is disabled while signing to preserve touch/input isolation
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
    setIsSigning,
    goToPage,
    nextPage,
    prevPage,
    canGoPrev: currentPage > MIN_PAGE,
    canGoNext: currentPage < MAX_PAGE,
  };
}
