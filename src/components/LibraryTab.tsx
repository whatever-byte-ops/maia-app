import React, { useState, useMemo } from 'react';
import { Work, ReadingStatus, ReactionType, SourceType } from '../types';
import { WorkCard, getStatusBadgeStyle } from './SharedComponents';
import { Search, Filter, LayoutGrid, List, SlidersHorizontal, Heart, BookOpen, Globe, Archive, FileText, Check, X } from 'lucide-react';

interface LibraryTabProps {
  works: Work[];
  initialFilterStatus?: string;
  onSelectWork: (work: Work) => void;
  onReadWork: (work: Work) => void;
  onToggleReaction: (workId: string, reaction: ReactionType) => void;
  onOpenImport: () => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  works,
  initialFilterStatus,
  onSelectWork,
  onReadWork,
  onToggleReaction,
  onOpenImport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus || 'All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [favoriteOnly, setFavoriteOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'dateAdded' | 'wordCount'>('dateAdded');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const statuses: string[] = ['All', 'To Read', 'Priority To Read', 'Reading', 'Read', 'Abandoned', 'Possibly Read Before'];
  const sources: string[] = ['All', 'Live AO3', 'Wayback Machine', 'Local File', 'EPUB'];

  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      const matchesSearch =
        work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.fandoms.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
        work.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || work.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || work.sourceType === sourceFilter;
      const matchesFavorite = !favoriteOnly || work.reaction === 'Favorite';

      return matchesSearch && matchesStatus && matchesSource && matchesFavorite;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      if (sortBy === 'wordCount') return b.wordCount - a.wordCount;
      return new Date(b.lastImportedOrRefreshed).getTime() - new Date(a.lastImportedOrRefreshed).getTime();
    });
  }, [works, searchQuery, statusFilter, sourceFilter, favoriteOnly, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-main)' }}>
            Personal Library
          </h1>
          <p className="text-xs opacity-75" style={{ color: 'var(--text-secondary)' }}>
            Showing {filteredWorks.length} of {works.length} cataloged works
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, fandom, tags..."
              className="w-full pl-9 pr-4 py-2 rounded text-xs border outline-none transition-colors"
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

          <div className="flex items-center gap-1 border rounded p-0.5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs ${viewMode === 'grid' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'opacity-70'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs ${viewMode === 'list' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'opacity-70'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs opacity-70 font-medium whitespace-nowrap">Status:</span>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs px-3 py-1 rounded border transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium border-transparent'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-color)] opacity-80 hover:opacity-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="opacity-75 font-medium">Source:</span>
            {sources.map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-2 py-0.5 rounded border ${
                  sourceFilter === src
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border-color)] opacity-70 hover:opacity-100'
                }`}
              >
                {src}
              </button>
            ))}

            <button
              onClick={() => setFavoriteOnly(!favoriteOnly)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded border transition-colors ${
                favoriteOnly
                  ? 'bg-[#402A36] border-[#6F455B] text-[#E489B3]'
                  : 'border-[var(--border-color)] opacity-75 hover:opacity-100'
              }`}
            >
              <Heart className={`w-3 h-3 ${favoriteOnly ? 'fill-current' : ''}`} />
              Favorites Only
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-75">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 rounded border text-xs outline-none"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)'
              }}
            >
              <option value="dateAdded">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="author">Author (A-Z)</option>
              <option value="wordCount">Word Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Works Display */}
      {filteredWorks.length === 0 ? (
        <div
          className="text-center py-16 px-4 rounded border border-dashed space-y-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}
        >
          <BookOpen className="w-10 h-10 mx-auto opacity-40" style={{ color: 'var(--accent)' }} />
          <div className="space-y-1">
            <h3 className="font-serif text-lg">No matching works found</h3>
            <p className="text-xs opacity-70">
              Try adjusting your search query, status filters, or import a new work.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
              setSourceFilter('All');
              setFavoriteOnly(false);
            }}
            className="px-3 py-1.5 rounded text-xs font-medium border"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorks.map((work) => (
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
        <div className="space-y-2">
          {filteredWorks.map((work) => (
            <div
              key={work.id}
              onClick={() => onSelectWork(work)}
              className="rounded border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:border-[var(--accent)] cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusBadgeStyle(work.status)}`}>
                    {work.status}
                  </span>
                  <span className="text-xs opacity-80" style={{ color: 'var(--accent)' }}>
                    by {work.author}
                  </span>
                </div>
                <h3 className="font-serif text-base font-medium">
                  {work.title}
                </h3>
                <p className="text-xs opacity-75 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                  {work.summary}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs opacity-80 self-end sm:self-center">
                <span>{work.wordCount.toLocaleString()} words</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReadWork(work);
                  }}
                  className="px-3 py-1.5 rounded text-xs font-medium border"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--bg-main)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  Read
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
