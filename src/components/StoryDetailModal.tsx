import React, { useState } from 'react';
import { Work, ReadingStatus, ReactionType, Annotation } from '../types';
import { getStatusBadgeStyle, SourceIndicator } from './SharedComponents';
import { X, BookOpen, Heart, Globe, Download, Trash2, Edit3, Save, ExternalLink, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface StoryDetailModalProps {
  work: Work;
  annotations: Annotation[];
  onClose: () => void;
  onStartReading: (work: Work) => void;
  onUpdateWork: (updatedWork: Work) => void;
  onDeleteWork: (workId: string) => void;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({
  work,
  annotations,
  onClose,
  onStartReading,
  onUpdateWork,
  onDeleteWork
}) => {
  const [status, setStatus] = useState<ReadingStatus>(work.status);
  const [reaction, setReaction] = useState<ReactionType>(work.reaction);
  const [privateNotes, setPrivateNotes] = useState<string>(work.privateNotes);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const workAnnotations = annotations.filter((annotation) => annotation.workId === work.id);

  const statuses: ReadingStatus[] = ['To Read', 'Priority To Read', 'Reading', 'Read', 'Abandoned', 'Possibly Read Before'];

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    onUpdateWork({ ...work, privateNotes, status, reaction });
  };

  const handleStatusChange = (newStatus: ReadingStatus) => {
    setStatus(newStatus);
    onUpdateWork({ ...work, status: newStatus, reaction, privateNotes });
  };

  const handleReactionChange = (newReaction: ReactionType) => {
    setReaction(newReaction);
    onUpdateWork({ ...work, status, reaction: newReaction, privateNotes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${getStatusBadgeStyle(status)}`}>
              {status}
            </span>
            <SourceIndicator sourceType={work.sourceType} snapshotDate={work.snapshotDate} isSampleData={work.isSampleData} />
          </div>
          <button onClick={onClose} className="p-1 rounded opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Title & Author */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-normal leading-snug">
              {work.title}
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              by {work.author}
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onStartReading(work)}
              className="flex items-center gap-2 px-5 py-2.5 rounded text-xs font-semibold border transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
            >
              <BookOpen className="w-4 h-4" />
              {work.readingProgress > 0 ? 'Continue Reading' : 'Start Reading'}
            </button>

            <button
              onClick={() => handleReactionChange(reaction === 'Favorite' ? 'Neutral' : 'Favorite')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs border transition-colors ${
                reaction === 'Favorite' ? 'bg-[#402A36] border-[#6F455B] text-[#E489B3]' : 'border-[var(--border-color)]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${reaction === 'Favorite' ? 'fill-current' : ''}`} />
              {reaction === 'Favorite' ? 'Favorited' : 'Favorite'}
            </button>

            {!work.isSampleData && work.sourceUrl && (
              <a
                href={work.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs border transition-colors hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
              >
                <Globe className="w-3.5 h-3.5" />
                Open Source
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            <span className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Download className="h-3.5 w-3.5" />
              {work.isDownloaded ? 'Content stored on this device' : 'Remote download unavailable'}
            </span>
          </div>

          {/* Status Changer */}
          <div className="p-4 rounded border space-y-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
            <label className="block text-xs font-medium opacity-80">Reading Status:</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${
                    status === s
                      ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium border-transparent'
                      : 'border-[var(--border-color)] opacity-80 hover:opacity-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <h3 className="font-serif text-sm font-medium uppercase tracking-wider opacity-75">Summary</h3>
            <p className="text-sm leading-relaxed opacity-90" style={{ color: 'var(--text-secondary)' }}>
              {work.summary}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded border text-xs" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
            <div>
              <span className="block opacity-60 mb-0.5">Word Count</span>
              <span className="font-medium">{work.wordCount.toLocaleString()} words</span>
            </div>
            <div>
              <span className="block opacity-60 mb-0.5">Chapters</span>
              <span className="font-medium">{work.chapterCount}</span>
            </div>
            <div>
              <span className="block opacity-60 mb-0.5">Rating</span>
              <span className="font-medium">{work.rating}</span>
            </div>
            <div>
              <span className="block opacity-60 mb-0.5">Language</span>
              <span className="font-medium">{work.language}</span>
            </div>
          </div>

          {/* Fandoms, Pairings, Characters & Tags */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium opacity-75 block mb-1.5">Fandoms & Pairings</span>
              <div className="flex flex-wrap gap-1.5">
                {work.fandoms.map((f, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded border border-[#514852] bg-[#242126]">
                    {f}
                  </span>
                ))}
                {work.pairings.map((p, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded border border-[#6F455B] bg-[#402A36] text-[#E489B3]">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium opacity-75 block mb-1.5">Archive Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {work.tags.map((t, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-[#514852] opacity-85">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Private Library Note */}
          <div className="p-4 rounded border space-y-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Private Library Note</span>
              {!isEditingNotes ? (
                <button onClick={() => setIsEditingNotes(true)} className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 underline">
                  <Edit3 className="w-3 h-3" /> Edit Notes
                </button>
              ) : (
                <button onClick={handleSaveNotes} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[var(--accent)] text-[var(--bg-main)] font-medium">
                  <Save className="w-3 h-3" /> Save
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                rows={3}
                className="w-full p-2 text-xs rounded border outline-none"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                placeholder="Add a general note about this work..."
              />
            ) : (
              <p className="text-xs italic opacity-90">
                {privateNotes || 'No private library note yet. Reader highlights and notes are listed below.'}
              </p>
            )}
          </div>

          <div className="p-4 rounded border space-y-3" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Reader Notes & Highlights</span>
              <span className="text-[11px] opacity-70">{workAnnotations.length}</span>
            </div>
            {workAnnotations.length ? (
              workAnnotations.map((annotation) => (
                <article key={annotation.id} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-[11px] opacity-70">{annotation.chapterTitle}</p>
                  <blockquote className="border-l-2 pl-3 text-xs italic" style={{ borderColor: 'var(--accent)' }}>
                    {annotation.selectedText}
                  </blockquote>
                  {annotation.note && (
                    <p className="whitespace-pre-wrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {annotation.note}
                    </p>
                  )}
                  {annotation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {annotation.tags.map((tag, index) => (
                        <span key={`${annotation.id}-${index}`} className="rounded border px-1.5 py-0.5 text-[10px]" style={{ borderColor: 'var(--border-color)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <p className="text-xs opacity-70">No reader highlights or notes for this work yet.</p>
            )}
          </div>

          {/* Delete Work Option */}
          <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            {!deleteConfirmOpen ? (
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove work from library
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400 font-medium">Are you sure?</span>
                <button
                  onClick={() => onDeleteWork(work.id)}
                  className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-medium"
                >
                  Yes, Remove
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-3 py-1 rounded border text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
