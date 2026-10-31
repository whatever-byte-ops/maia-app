import React, { useState, useMemo } from 'react';
import { Annotation, Work } from '../types';
import { Bookmark, Search, Trash2, Edit3, ExternalLink, Tag, Calendar, Filter, X } from 'lucide-react';

interface NotebookTabProps {
  annotations: Annotation[];
  works: Work[];
  onSelectWork: (work: Work) => void;
  onJumpToPassage: (workId: string, chapterId: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const NotebookTab: React.FC<NotebookTabProps> = ({
  annotations,
  works,
  onSelectWork,
  onJumpToPassage,
  onDeleteAnnotation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkId, setSelectedWorkId] = useState<string>('All');

  const filteredAnnotations = useMemo(() => {
    return annotations.filter((ann) => {
      const matchesSearch =
        ann.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.workTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesWork = selectedWorkId === 'All' || ann.workId === selectedWorkId;

      return matchesSearch && matchesWork;
    });
  }, [annotations, searchQuery, selectedWorkId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-main)' }}>
            Private Notebook & Annotations
          </h1>
          <p className="text-xs opacity-75" style={{ color: 'var(--text-secondary)' }}>
            {annotations.length} saved highlights, quotes, and reflections across your library. Stored in this browser on this device.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search highlights and notes..."
            className="w-full pl-9 pr-4 py-2 rounded text-xs border outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 opacity-50 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter by work */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <span className="opacity-75 font-medium whitespace-nowrap">Filter Work:</span>
        <button
          onClick={() => setSelectedWorkId('All')}
          className={`px-3 py-1 rounded border whitespace-nowrap ${
            selectedWorkId === 'All'
              ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium border-transparent'
              : 'bg-[var(--bg-elevated)] border-[var(--border-color)] opacity-80'
          }`}
        >
          All Works ({annotations.length})
        </button>
        {works.map((w) => {
          const count = annotations.filter((a) => a.workId === w.id).length;
          if (count === 0) return null;
          return (
            <button
              key={w.id}
              onClick={() => setSelectedWorkId(w.id)}
              className={`px-3 py-1 rounded border whitespace-nowrap ${
                selectedWorkId === w.id
                  ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium border-transparent'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-color)] opacity-80'
              }`}
            >
              {w.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Annotations List */}
      {filteredAnnotations.length === 0 ? (
        <div
          className="text-center py-16 px-4 rounded border border-dashed space-y-3"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}
        >
          <Bookmark className="w-10 h-10 mx-auto opacity-40" style={{ color: 'var(--accent)' }} />
          <h3 className="font-serif text-lg">No annotations or highlights found</h3>
          <p className="text-xs opacity-70">
            Select text while reading any chapter in your library to add personal notes and highlights.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnotations.map((ann) => (
            <div
              key={ann.id}
              className="rounded border p-5 space-y-3 transition-colors hover:border-[var(--accent)]"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-serif text-base font-medium" style={{ color: 'var(--text-main)' }}>
                    {ann.workTitle}
                  </h4>
                  <p className="text-xs opacity-75" style={{ color: 'var(--accent)' }}>
                    {ann.chapterTitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onJumpToPassage(ann.workId, ann.chapterId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)'
                    }}
                    title="Return to Passage in Reader"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Passage</span>
                  </button>
                  <button
                    onClick={() => onDeleteAnnotation(ann.id)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Annotation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Highlighted text block */}
              <blockquote
                className="pl-3 border-l-2 font-serif italic text-sm opacity-90 my-2"
                style={{ borderColor: 'var(--accent)', color: 'var(--text-main)' }}
              >
                "{ann.selectedText}"
              </blockquote>

              {/* Note */}
              {ann.note && (
                <div className="p-3 rounded text-xs border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                  <span className="font-semibold block mb-1 text-[var(--text-main)]">Private Note:</span>
                  {ann.note}
                </div>
              )}

              {/* Tags & Date */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex flex-wrap gap-1">
                  {ann.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded border border-[#514852] bg-[#242126] opacity-90">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="opacity-60 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
