import { PassportScene } from '@/components/canvas/PassportScene';
import { HudControls } from '@/components/ui/HudControls';
import { usePassportState } from '@/hooks/usePassportState';

export function App() {
  const {
    currentPage,
    isSigning,
    setIsSigning,
    goToPage,
    nextPage,
    prevPage,
    canGoPrev,
    canGoNext,
  } = usePassportState();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#183B68_0%,_#102A4C_42%,_#071221_100%)]">
      <PassportScene
        currentPage={currentPage}
        isSigning={isSigning}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />

      <HudControls
        currentPage={currentPage}
        isSigning={isSigning}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onGoToPage={goToPage}
        onPrevPage={prevPage}
        onNextPage={nextPage}
        onToggleSigning={() => setIsSigning(!isSigning)}
      />
    </main>
  );
}

export default App;
