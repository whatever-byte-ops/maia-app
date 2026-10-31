export type ReadingStatus = 'To Read' | 'Priority To Read' | 'Reading' | 'Read' | 'Abandoned' | 'Possibly Read Before';

export type ReactionType = 'Favorite' | 'Not My Thing' | 'Neutral';

export type SourceType = 'Live AO3' | 'Wayback Machine' | 'Local File' | 'EPUB' | 'Cached';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  url?: string;
  wordCount: number;
  content: string[]; // Array of paragraphs
}

export interface Work {
  id: string;
  title: string;
  author: string;
  summary: string;
  fandoms: string[];
  pairings: string[];
  characters: string[];
  tags: string[];
  rating: 'General Audiences' | 'Teen And Up Audiences' | 'Mature' | 'Explicit' | 'Not Rated';
  warnings: string[];
  wordCount: number;
  chapterCount: number;
  language: string;
  series?: { name: string; position: number };
  publishedDate: string;
  updatedDate: string;
  status: ReadingStatus;
  reaction: ReactionType;
  personalTags: string[];
  privateNotes: string;
  sourceUrl: string;
  sourceType: SourceType;
  isSampleData?: boolean;
  snapshotDate?: string;
  lastImportedOrRefreshed: string;
  isDownloaded: boolean;
  downloadSize?: string;
  currentChapterId: string;
  currentParagraphIndex: number;
  readingProgress: number; // 0 to 100
  chapters: Chapter[];
}

export interface Annotation {
  id: string;
  workId: string;
  workTitle: string;
  chapterId: string;
  chapterTitle: string;
  selectedText: string;
  excerptContext?: string;
  highlightColor: 'pink' | 'blue' | 'yellow' | 'green' | 'purple';
  note: string;
  tags: string[];
  createdAt: string;
}

export type ThemePreset = 'rose-noir' | 'midnight-blue' | 'soft-light' | 'warm-sepia';

export type ReaderFont = 'System' | 'Merriweather' | 'Georgia' | 'Inter' | 'OpenDyslexic';

export interface ReaderSettings {
  fontFamily: ReaderFont;
  fontSize: number; // e.g. 16
  lineHeight: number; // e.g. 1.75
  letterSpacing: number; // e.g. 0
  paragraphSpacing: number; // e.g. 16
  contentWidth: '600px' | '700px' | '800px' | '950px' | '100%;';
  alignment: 'left' | 'justify';
  readerBackground: 'match-theme' | 'dark' | 'light' | 'sepia' | 'cream' | 'navy';
}
