import React from 'react';
import { Work, ReactionType } from '../types';
import { BookOpen, Clock, Play, Headphones, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ReadingTabProps {
  works: Work[];
  onSelectWork: (work: Work) => void;
  onReadWork: (work: Work) => void;
  onToggleReaction: (workId: string, reaction: ReactionType) => void;
}

export const ReadingTab: React.FC<ReadingTabProps> = ({
  works,
  onSelectWork,
  onReadWork,
  onToggleReaction
}) => {
  const activeWorks = works.filter((w) => w.readingProgress > 0 && w.readingProgress < 100);
  const completedWorks = works.filter((w) => w.readingProgress === 100 || w.status === 'Read');
  const queueWorks = works.filter((w) => w.status === 'Priority To Read' || w.status === 'To Read');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-24">
      {/* Header */}
      <div className="pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h1 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-main)' }}>
          Your Reading Activity
        </h1>
        <p className="text-xs opacity-75" style={{ color: 'var(--text-secondary)' }}>
          Track active works, reading progress, and immersive audio playback.
        </p>
      </div>

      {/* Currently Reading */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-normal flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          Currently Reading ({activeWorks.length})
        </h2>

        {activeWorks.length === 0 ? (
          <div
            className="p-8 rounded border text-center space-y-3"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
          >
            <p className="text-xs opacity-70">No works currently in progress. Pick a story from your library to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeWorks.map((work) => {
              const currentChapterNumber = work.currentChapterId.split('-').pop();
              return (
                <div
                  key={work.id}
                  onClick={() => onSelectWork(work)}
                  className="rounded border p-5 flex flex-col justify-between gap-4 transition-all hover:border-[var(--accent)] cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126]" style={{ color: 'var(--accent)' }}>
                        Chapter {currentChapterNumber} of {work.chapterCount}
                      </span>
                      <span className="text-xs opacity-75">{work.readingProgress}% complete</span>
                    </div>

                    <h3 className="font-serif text-lg font-medium">{work.title}</h3>
                    <p className="text-xs opacity-80" style={{ color: 'var(--accent)' }}>by {work.author}</p>

                    <div className="w-full bg-[#242126] h-1.5 rounded-full overflow-hidden border border-[#514852] mt-3">
                      <div
                        className="h-full transition-all duration-300"
                        style={{ width: `${work.readingProgress}%`, backgroundColor: 'var(--accent)' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#514852] text-xs">
                    <span className="opacity-70">Source: {work.sourceType}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReadWork(work);
                      }}
                      className="px-3 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--bg-main)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Resume Reading
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reading Queue & Priority */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-normal flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <Clock className="w-4 h-4 text-amber-400" />
          Up Next in Reading Queue
        </h2>

        <div className="space-y-2">
          {queueWorks.slice(0, 3).map((work) => (
            <div
              key={work.id}
              onClick={() => onSelectWork(work)}
              className="rounded border p-4 flex items-center justify-between gap-4 transition-colors hover:border-[var(--accent)] cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126]">
                    {work.status}
                  </span>
                  <span className="text-xs opacity-85" style={{ color: 'var(--accent)' }}>
                    by {work.author}
                  </span>
                </div>
                <h3 className="font-serif text-base font-medium">{work.title}</h3>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReadWork(work);
                }}
                className="px-3 py-1.5 rounded text-xs border transition-colors hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)'
                }}
              >
                Start
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Works */}
      {completedWorks.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-normal flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Recently Completed ({completedWorks.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedWorks.map((work) => (
              <div
                key={work.id}
                onClick={() => onSelectWork(work)}
                className="rounded border p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
              >
                <div className="space-y-1">
                  <h3 className="font-serif text-base font-medium">{work.title}</h3>
                  <p className="text-xs opacity-75">by {work.author} • {work.wordCount.toLocaleString()} words</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-[#2A3831] text-[#A4CEB5] border border-[#456653]">
                  Finished
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
