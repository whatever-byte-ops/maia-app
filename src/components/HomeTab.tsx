import React from 'react';
import { Work, ReadingStatus, ReactionType } from '../types';
import { WorkCard } from './SharedComponents';
import { BookOpen, Plus, Search, Clock, ArrowRight, Bookmark } from 'lucide-react';

interface HomeTabProps {
  works: Work[];
  onSelectWork: (work: Work) => void;
  onReadWork: (work: Work) => void;
  onToggleReaction: (workId: string, reaction: ReactionType) => void;
  onOpenImport: () => void;
  onNavigateLibrary: (filter?: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  works,
  onSelectWork,
  onReadWork,
  onToggleReaction,
  onOpenImport,
  onNavigateLibrary
}) => {
  const continueReadingWork = works.find((w) => w.readingProgress > 0 && w.readingProgress < 100);
  const priorityWorks = works.filter((w) => w.status === 'Priority To Read');
  const recentWorks = [...works].sort((a, b) => new Date(b.lastImportedOrRefreshed).getTime() - new Date(a.lastImportedOrRefreshed).getTime()).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-24">
      {/* Welcome Hero / Greeting */}
      <div
        className="rounded border p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)'
        }}
      >
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--accent)' }}>
            Personal Reading Library
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-wide">
            Welcome to your reading library.
          </h1>
          <p className="text-sm opacity-80 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your private library holds {works.length} {works.length === 1 ? 'work' : 'works'}. Reading progress and notes are stored on this device.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10 w-full sm:w-auto">
          <button
            onClick={onOpenImport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-medium border transition-all hover:opacity-90 shadow-sm"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg-main)',
              borderColor: 'var(--border-color)'
            }}
          >
            <Plus className="w-4 h-4" />
            Import Work from AO3
          </button>
          <button
            onClick={() => onNavigateLibrary()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-medium border transition-all hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
          >
            Browse Full Library
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Continue Reading Section */}
      {continueReadingWork && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-normal flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Continue Reading
            </h2>
            <span className="text-xs opacity-75">Updated {continueReadingWork.lastImportedOrRefreshed}</span>
          </div>

          <div
            onClick={() => onSelectWork(continueReadingWork)}
            className="rounded border p-5 sm:p-6 transition-all hover:border-[var(--accent)] cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126]">
                  Chapter {continueReadingWork.currentChapterId.split('-').pop()} of {continueReadingWork.chapterCount}
                </span>
                <span className="text-xs opacity-80" style={{ color: 'var(--accent)' }}>
                  by {continueReadingWork.author}
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium">
                {continueReadingWork.title}
              </h3>
              <p className="text-xs opacity-80 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {continueReadingWork.summary}
              </p>
              <div className="w-full bg-[#242126] h-1.5 rounded-full overflow-hidden border border-[#514852] mt-3">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${continueReadingWork.readingProgress}%`, backgroundColor: 'var(--accent)' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReadWork(continueReadingWork);
                }}
                className="w-full md:w-auto px-5 py-2.5 rounded text-xs font-semibold border transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--bg-main)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <BookOpen className="w-4 h-4" />
                Resume Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority To Read Section */}
      {priorityWorks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-normal flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Clock className="w-4 h-4 text-[#E8B8CE]" />
              Priority To Read
            </h2>
            <button
              onClick={() => onNavigateLibrary('Priority To Read')}
              className="text-xs opacity-80 hover:opacity-100 underline"
            >
              View all priority
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onSelect={onSelectWork}
                onRead={onReadWork}
                onToggleReaction={onToggleReaction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Added Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-normal flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <Bookmark className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            Recently Added & Refreshed
          </h2>
          <button
            onClick={() => onNavigateLibrary()}
            className="text-xs opacity-80 hover:opacity-100 underline"
          >
            View library ({works.length})
          </button>
        </div>

        {recentWorks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onSelect={onSelectWork}
                onRead={onReadWork}
                onToggleReaction={onToggleReaction}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed p-8 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}>
            <p className="font-serif text-lg">Your library is empty</p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Add a saved AO3 work page in HTML to begin. Direct URL import is not connected yet.
            </p>
            <button onClick={onOpenImport} className="mt-4 px-4 py-2 text-xs font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}>
              Import a Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
