import React from 'react';
import { Work, ReadingStatus, ReactionType, SourceType } from '../types';
import { Heart, BookOpen, Clock, AlertCircle, CheckCircle2, BookmarkCheck, FileText, Globe, Archive, HardDrive } from 'lucide-react';

export const getStatusBadgeStyle = (status: ReadingStatus) => {
  switch (status) {
    case 'To Read':
      return 'bg-[#38313A] border-[#5A4F5D] text-[#D4CAD4]';
    case 'Priority To Read':
      return 'bg-[var(--priority-badge-bg)] border-[var(--priority-badge-border)] text-[var(--priority-badge-text)]';
    case 'Reading':
      return 'bg-[#2A3638] border-[#466266] text-[#A5CBD0]';
    case 'Read':
      return 'bg-[#2A3831] border-[#456653] text-[#A4CEB5]';
    case 'Abandoned':
      return 'bg-[#372B2B] border-[#664949] text-[#CF9E9E]';
    case 'Possibly Read Before':
      return 'bg-[#3A342B] border-[#6B5E46] text-[#DFCBA3]';
    default:
      return 'bg-[#343039] border-[#514852] text-[#C8BEC8]';
  }
};

export const SourceIndicator: React.FC<{ sourceType: SourceType; snapshotDate?: string; isSampleData?: boolean }> = ({ sourceType, snapshotDate, isSampleData }) => {
  if (isSampleData) {
    return (
      <span className="inline-flex items-center gap-1 border px-2 py-0.5 text-[11px]" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }}>
        Fictional Sample
      </span>
    );
  }

  switch (sourceType) {
    case 'Live AO3':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126] text-[#C8BEC8]">
          <Globe className="w-3 h-3 text-[#D49AB5]" />
          AO3 Live
        </span>
      );
    case 'Wayback Machine':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126] text-[#C8BEC8]" title={snapshotDate ? `Snapshot: ${snapshotDate}` : undefined}>
          <Archive className="w-3 h-3 text-amber-400" />
          Wayback {snapshotDate ? `(${snapshotDate})` : ''}
        </span>
      );
    case 'Local File':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126] text-[#C8BEC8]">
          <FileText className="w-3 h-3 text-blue-400" />
          Local File
        </span>
      );
    case 'EPUB':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126] text-[#C8BEC8]">
          <FileText className="w-3 h-3 text-blue-400" />
          EPUB
        </span>
      );
    case 'Cached':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126] text-[#C8BEC8]">
          <HardDrive className="w-3 h-3 text-emerald-400" />
          Offline Cache
        </span>
      );
  }
};

interface WorkCardProps {
  work: Work;
  onSelect: (work: Work) => void;
  onRead: (work: Work) => void;
  onToggleReaction: (workId: string, reaction: ReactionType) => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({ work, onSelect, onRead, onToggleReaction }) => {
  return (
    <div
      onClick={() => onSelect(work)}
      className="group rounded border p-4 transition-all hover:translate-y-[-2px] cursor-pointer flex flex-col justify-between"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-main)'
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${getStatusBadgeStyle(work.status)}`}>
              {work.status}
            </span>
            <SourceIndicator sourceType={work.sourceType} snapshotDate={work.snapshotDate} isSampleData={work.isSampleData} />
            {work.isDownloaded && !work.isSampleData && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3831] text-[#A4CEB5] border border-[#456653]">
                Stored locally
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextReaction: ReactionType = work.reaction === 'Favorite' ? 'Neutral' : 'Favorite';
              onToggleReaction(work.id, nextReaction);
            }}
            className={`p-1.5 rounded border transition-colors ${
              work.reaction === 'Favorite'
                ? 'bg-[#402A36] border-[#6F455B] text-[#E489B3]'
                : 'bg-transparent border-[#514852] text-[#C8BEC8] hover:text-[#F1E8EF]'
            }`}
            title={work.reaction === 'Favorite' ? 'Favorited' : 'Add to Favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${work.reaction === 'Favorite' ? 'fill-current' : ''}`} />
          </button>
        </div>

        <h3 className="font-serif text-lg font-medium group-hover:opacity-90 mb-1 leading-snug">
          {work.title}
        </h3>
        <p className="text-xs mb-3 font-medium opacity-80" style={{ color: 'var(--accent)' }}>
          by {work.author}
        </p>

        <p className="text-xs line-clamp-2 opacity-85 mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {work.summary}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          {work.fandoms.slice(0, 2).map((f, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-[#514852] bg-[#242126] opacity-90">
              {f}
            </span>
          ))}
          {work.tags.slice(0, 2).map((t, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-[#514852] opacity-75">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div>
        {/* Progress Bar if reading */}
        {work.readingProgress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[11px] mb-1 opacity-75">
              <span>Progress</span>
              <span>{work.readingProgress}% (Ch. {work.currentChapterId.split('-').pop()}/{work.chapterCount})</span>
            </div>
            <div className="w-full h-1 bg-[#242126] rounded-full overflow-hidden border border-[#514852]">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${work.readingProgress}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[#514852] text-xs opacity-80">
          <span>{work.wordCount.toLocaleString()} words</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead(work);
            }}
            className="px-3 py-1 rounded text-xs font-medium border transition-colors hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg-main)',
              borderColor: 'var(--border-color)'
            }}
          >
            {work.readingProgress > 0 ? 'Continue Reading' : 'Start Reading'}
          </button>
        </div>
      </div>
    </div>
  );
};
