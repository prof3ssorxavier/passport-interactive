import { useCallback, useState } from 'react';
import { PassportScene } from '@/components/canvas/PassportScene';
import { CrestStoryModal } from '@/components/ui/CrestStoryModal';
import { HudControls } from '@/components/ui/HudControls';
import { IntroOverlay } from '@/components/ui/IntroOverlay';
import { SignaturePadOverlay } from '@/components/ui/SignaturePadOverlay';
import type { CrestStoryTopic, Language } from '@/constants/i18n';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { usePassportState } from '@/hooks/usePassportState';

export function App() {
  const [language, setLanguage] = useState<Language>('pt');
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isSceneReady, setIsSceneReady] = useState<boolean>(false);
  const [storyTopic, setStoryTopic] = useState<CrestStoryTopic | null>(null);
  const device = useDeviceProfile();

  const {
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
    canGoPrev,
    canGoNext,
  } = usePassportState();

  const handleSceneReady = useCallback(() => {
    setIsSceneReady(true);
  }, []);

  const handleSelectIntroLanguage = (lang: Language) => {
    setLanguage(lang);
    setHasEntered(true);
  };

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#9B9A96]">
      <PassportScene
        language={language}
        currentPage={currentPage}
        isSigning={isSigning || storyTopic !== null}
        isInspecting={isInspecting}
        showHotspots={hasEntered && currentPage === 0 && storyTopic === null}
        device={device}
        signatures={signatures}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        onOpenCrestStory={setStoryTopic}
        onReady={handleSceneReady}
      />

      {hasEntered ? (
        <HudControls
          language={language}
          currentPage={currentPage}
          isSigning={isSigning}
          isInspecting={isInspecting}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onChangeLanguage={setLanguage}
          onGoToPage={goToPage}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onToggleSigning={() => setIsSigning(!isSigning)}
          onToggleInspecting={() => setIsInspecting(!isInspecting)}
          onOpenCrestStory={setStoryTopic}
        />
      ) : null}

      <SignaturePadOverlay
        language={language}
        isOpen={hasEntered && isSigning && currentPage === 1}
        currentSignatures={signatures}
        onSave={setSignatures}
        onClose={() => setIsSigning(false)}
      />

      <CrestStoryModal
        language={language}
        activeTopic={storyTopic}
        onSelectTopic={setStoryTopic}
        onClose={() => setStoryTopic(null)}
      />

      <IntroOverlay
        isVisible={!hasEntered}
        isReady={isSceneReady}
        onSelectLanguage={handleSelectIntroLanguage}
      />
    </main>
  );
}

export default App;
