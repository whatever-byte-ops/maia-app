import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Work, Annotation, ThemePreset, ReaderSettings, ReactionType } from './types';
import { loadAppState, saveAppState } from './services/appStorage';
import { syncLibraryState } from './services/librarySync';
import { getSupabaseClient } from './services/supabase';
import { Navigation } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { LibraryTab } from './components/LibraryTab';
import { ReadingTab } from './components/ReadingTab';
import { NotebookTab } from './components/NotebookTab';
import { SettingsTab } from './components/SettingsTab';
import { StoryDetailModal } from './components/StoryDetailModal';
import { ReaderView } from './components/ReaderView';
import { ImportModal } from './components/ImportModal';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { DownloadsManagerModal } from './components/DownloadsManagerModal';
import { SyncModal } from './components/SyncModal';
import { AccountModal } from './components/AccountModal';

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontFamily: 'Merriweather',
  fontSize: 18,
  lineHeight: 1.75,
  letterSpacing: 0,
  paragraphSpacing: 16,
  contentWidth: '700px',
  alignment: 'left',
  readerBackground: 'match-theme'
};

function isReaderSettings(value: unknown): value is ReaderSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<ReaderSettings>;
  return ['System', 'Merriweather', 'Georgia', 'Inter', 'OpenDyslexic'].includes(settings.fontFamily ?? '')
    && typeof settings.fontSize === 'number'
    && typeof settings.lineHeight === 'number'
    && typeof settings.letterSpacing === 'number'
    && typeof settings.paragraphSpacing === 'number'
    && ['600px', '700px', '800px', '950px', '100%;'].includes(settings.contentWidth ?? '')
    && (settings.alignment === 'left' || settings.alignment === 'justify')
    && ['match-theme', 'dark', 'light', 'sepia', 'cream', 'navy'].includes(settings.readerBackground ?? '');
}

export default function App() {
  const [storedState] = useState(() => loadAppState());
  const [storageError, setStorageError] = useState(storedState.error);
  const [authError, setAuthError] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(
    () => new URLSearchParams(window.location.search).has('delete-account')
  );
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  const [works, setWorks] = useState<Work[]>(
    storedState.value?.works?.map((work) =>
      /^fic-[1-6]$/.test(work.id) ? { ...work, isSampleData: true } : work
    ) ?? []
  );
  const [annotations, setAnnotations] = useState<Annotation[]>(storedState.value?.annotations ?? []);
  const [activeTab, setActiveTab] = useState<'home' | 'reading' | 'notebook' | 'settings'>(storedState.value?.activeTab ?? 'home');
  const [libraryInitialFilter, setLibraryInitialFilter] = useState<string>(storedState.value?.libraryInitialFilter ?? 'All');

  // Theme & Reader settings
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(
    ['rose-noir', 'midnight-blue', 'soft-light', 'warm-sepia'].includes(storedState.value?.currentTheme ?? '')
      ? storedState.value!.currentTheme!
      : 'rose-noir'
  );
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(
    isReaderSettings(storedState.value?.readerSettings)
      ? storedState.value.readerSettings
      : DEFAULT_READER_SETTINGS
  );

  // Modal / Reader navigation states
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<Work | null>(null);
  const [readingWork, setReadingWork] = useState<Work | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreviewWork, setImportPreviewWork] = useState<Work | null>(null);
  const [downloadsModalOpen, setDownloadsModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // Update root html/body theme class and persist the mobile-friendly app state
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
    document.body.dataset.theme = currentTheme;
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (storedState.error) return;

    const error = saveAppState({
      works,
      annotations,
      activeTab,
      libraryInitialFilter,
      currentTheme,
      readerSettings
    }, storedState.legacyStorageKey);

    setStorageError(error);
  }, [works, annotations, activeTab, libraryInitialFilter, currentTheme, readerSettings, storedState.error]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void getSupabaseClient().then(async (supabase) => {
      if (!active || !supabase) return;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUser(session?.user ?? null);
      });
      unsubscribe = () => subscription.unsubscribe();
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setAuthError(`Unable to restore the account session: ${error.message}`);
        return;
      }
      setAuthUser(data.session?.user ?? null);
    }).catch((error: unknown) => {
      if (!active) return;
      setAuthError(error instanceof Error ? `Unable to restore the account session: ${error.message}` : 'Unable to restore the account session.');
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const handleToggleReaction = (workId: string, reaction: ReactionType) => {
    setWorks((prev) =>
      prev.map((w) => (w.id === workId ? { ...w, reaction } : w))
    );
  };

  const handleUpdateWork = (updatedWork: Work) => {
    setWorks((prev) => prev.map((w) => (w.id === updatedWork.id ? updatedWork : w)));
    if (selectedWorkForDetail?.id === updatedWork.id) {
      setSelectedWorkForDetail(updatedWork);
    }
  };

  const handleDeleteWork = (workId: string) => {
    setWorks((prev) => prev.filter((w) => w.id !== workId));
    setSelectedWorkForDetail(null);
  };

  const handleAddAnnotation = (newAnn: Omit<Annotation, 'id' | 'createdAt'>) => {
    const ann: Annotation = {
      ...newAnn,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAnnotations((prev) => [ann, ...prev]);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateProgress = (workId: string, chapterId: string, paragraphIndex: number, progress: number) => {
    setWorks((prev) =>
      prev.map((w) =>
        w.id === workId
          ? { ...w, currentChapterId: chapterId, currentParagraphIndex: paragraphIndex, readingProgress: progress }
          : w
      )
    );
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncError('');
    setSyncMessage('');
    try {
      const result = await syncLibraryState({ works, annotations, currentTheme, readerSettings });
      setWorks(result.state.works);
      setAnnotations(result.state.annotations);
      setCurrentTheme(result.state.currentTheme);
      setReaderSettings(result.state.readerSettings);
      setSyncMessage(`Sync complete. Added ${result.addedWorks} works and ${result.addedAnnotations} notes from your account.`);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sync failed. Your local library was not changed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className={`min-h-screen theme-${currentTheme} transition-colors pb-16`}
      style={{
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)'
      }}
    >
      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'home' && activeTab === 'home') setLibraryInitialFilter('All');
          setActiveTab(tab);
        }}
        accountEmail={authUser?.email ?? null}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenImport={() => setImportModalOpen(true)}
        onOpenSync={() => setSyncModalOpen(true)}
      />

      {storageError && (
        <div role="alert" className="mx-auto max-w-6xl px-4 pt-3">
          <p className="border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
            {storageError} Saved data was left untouched.
          </p>
        </div>
      )}
      {authError && (
        <div role="alert" className="mx-auto max-w-6xl px-4 pt-3">
          <p className="border border-rose-700/50 bg-rose-900/20 px-3 py-2 text-xs text-rose-200">{authError}</p>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="transition-all">
        {activeTab === 'home' && (
          <HomeTab
            works={works}
            onSelectWork={(w) => setSelectedWorkForDetail(w)}
            onReadWork={(w) => setReadingWork(w)}
            onToggleReaction={handleToggleReaction}
            onOpenImport={() => setImportModalOpen(true)}
            onNavigateLibrary={(filter) => {
              setLibraryInitialFilter(filter || 'All');
              setActiveTab('reading'); // or library if we had a dedicated tab, but prompt requires exactly 4 bottom nav items (Home, Reading, Notebook, Settings). Library is accessed from Home or Reading. Let's make LibraryTab rendered inside ReadingTab or Home when requested, or let's check prompt bottom nav requirements.
            }}
          />
        )}

        {activeTab === 'reading' && (
          <LibraryTab
            works={works}
            initialFilterStatus={libraryInitialFilter}
            onSelectWork={(w) => setSelectedWorkForDetail(w)}
            onReadWork={(w) => setReadingWork(w)}
            onToggleReaction={handleToggleReaction}
            onOpenImport={() => setImportModalOpen(true)}
          />
        )}

        {activeTab === 'notebook' && (
          <NotebookTab
            annotations={annotations}
            works={works}
            onSelectWork={(w) => setSelectedWorkForDetail(w)}
            onJumpToPassage={(workId, chapterId) => {
              const work = works.find((w) => w.id === workId);
              if (work) setReadingWork(work);
            }}
            onDeleteAnnotation={handleDeleteAnnotation}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            currentTheme={currentTheme}
            setTheme={setCurrentTheme}
            readerSettings={readerSettings}
            setReaderSettings={setReaderSettings}
            authEmail={authUser?.email ?? null}
            works={works}
            onOpenDownloads={() => setDownloadsModalOpen(true)}
            onOpenSync={() => setSyncModalOpen(true)}
            onOpenAccount={() => setAccountModalOpen(true)}
          />
        )}
      </main>

      {/* Story Detail Modal */}
      {selectedWorkForDetail && (
        <StoryDetailModal
          work={selectedWorkForDetail}
          annotations={annotations}
          onClose={() => setSelectedWorkForDetail(null)}
          onStartReading={(w) => {
            setSelectedWorkForDetail(null);
            setReadingWork(w);
          }}
          onUpdateWork={handleUpdateWork}
          onDeleteWork={handleDeleteWork}
        />
      )}

      {/* Reader View */}
      {readingWork && (
        <ReaderView
          work={readingWork}
          readerSettings={readerSettings}
          onClose={() => setReadingWork(null)}
          onUpdateProgress={handleUpdateProgress}
          onAddAnnotation={handleAddAnnotation}
          onUpdateSettings={setReaderSettings}
        />
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <ImportModal
          onClose={() => setImportModalOpen(false)}
          onPreviewImport={(work) => {
            setImportModalOpen(false);
            setImportPreviewWork(work);
          }}
        />
      )}

      {importPreviewWork && (
        <ImportPreviewModal
          previewWork={importPreviewWork}
          onClose={() => setImportPreviewWork(null)}
          onConfirmSave={(work) => {
            setWorks((prev) => [work, ...prev]);
            setImportPreviewWork(null);
            setSelectedWorkForDetail(work);
          }}
        />
      )}

      {/* Downloads Manager Modal */}
      {downloadsModalOpen && (
        <DownloadsManagerModal
          works={works}
          onClose={() => setDownloadsModalOpen(false)}
        />
      )}

      {/* Sync Status Modal */}
      {syncModalOpen && (
        <SyncModal
          accountEmail={authUser?.email ?? null}
          syncing={syncing}
          syncError={syncError}
          syncMessage={syncMessage}
          onSyncNow={() => { void handleSyncNow(); }}
          onOpenAccount={() => setAccountModalOpen(true)}
          onClose={() => setSyncModalOpen(false)}
        />
      )}

      {accountModalOpen && (
        <AccountModal
          email={authUser?.email ?? null}
          deletionRequest={new URLSearchParams(window.location.search).has('delete-account')}
          onClose={() => setAccountModalOpen(false)}
          onSignedOut={() => setAuthUser(null)}
        />
      )}
    </div>
  );
}
