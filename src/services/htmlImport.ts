import type { Chapter, Work } from '../types';

interface Ao3HtmlOptions {
  sourceUrl?: string;
  sourceType?: 'Live AO3' | 'Wayback Machine';
  snapshotDate?: string;
}

function textFrom(element: Element | null): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function safeSourceUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== 'https:' || !['archiveofourown.org', 'www.archiveofourown.org'].includes(url.hostname)) return '';
    return url.href;
  } catch {
    return '';
  }
}

function listText(root: ParentNode, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector))
    .map((item) => textFrom(item))
    .filter(Boolean);
}

function parseChapterBody(body: Element): string[] {
  const blocks = Array.from(body.children)
    .map((element) => textFrom(element))
    .filter(Boolean);
  return blocks.length ? blocks : textFrom(body).split(/\n+/).map((text) => text.trim()).filter(Boolean);
}

export function parseAo3Html(html: string, options: Ao3HtmlOptions = {}): Work {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const workTitle = textFrom(document.querySelector('#workskin h2.title, h2.title.heading'));
  if (!workTitle) {
    throw new Error('This HTML file does not look like a supported AO3 work page: the work title was not found.');
  }

  const baseUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
    || document.querySelector<HTMLAnchorElement>('a[href*="archiveofourown.org/works/"]')?.href
    || 'https://archiveofourown.org/';
  const sourceUrl = safeSourceUrl(options.sourceUrl || baseUrl, 'https://archiveofourown.org/');
  const workskin = document.querySelector('#workskin') ?? document;
  const metadata = document.querySelector('.work.meta.group') ?? workskin;
  const sourceChapters = Array.from(workskin.querySelectorAll('.chapter'));
  const chapterElements = sourceChapters.length
    ? sourceChapters
    : Array.from(workskin.querySelectorAll('#chapters > .userstuff, #chapters .userstuff')).slice(0, 1);

  const chapters = chapterElements.flatMap((element, index): Chapter[] => {
    const titleElement = element.querySelector('.chapter.preface .title, h3.title, h3.heading');
    const body = element.matches('.userstuff') ? element : element.querySelector('.userstuff');
    if (!body) return [];

    const bodyText = parseChapterBody(body);
    if (bodyText.length === 0) return [];
    const headingLink = element.querySelector<HTMLAnchorElement>('.chapter.preface a[href*="/chapters/"], h3 a[href*="/chapters/"]');
    const chapterUrl = safeSourceUrl(headingLink?.getAttribute('href') ?? '', sourceUrl || 'https://archiveofourown.org/');

    return [{
      id: `chapter-${index + 1}`,
      number: index + 1,
      title: textFrom(titleElement) || `Chapter ${index + 1}`,
      ...(chapterUrl ? { url: chapterUrl } : {}),
      wordCount: bodyText.join(' ').split(/\s+/).filter(Boolean).length,
      content: bodyText
    }];
  });

  if (chapters.length === 0) {
    throw new Error('No chapter text was found in this file. Import an AO3 work page saved as HTML.');
  }

  const summary = textFrom(workskin.querySelector('.summary .userstuff, .summary blockquote'));
  const ratingText = textFrom(metadata.querySelector('dd.rating.tags, dd.rating'));
  const ratingOptions: Work['rating'][] = [
    'General Audiences',
    'Teen And Up Audiences',
    'Mature',
    'Explicit'
  ];
  const rating = ratingOptions.find((option) => ratingText.includes(option)) ?? 'Not Rated';
  const wordCount = chapters.reduce((count, chapter) => count + chapter.wordCount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const metadataDate = textFrom(workskin.querySelector('dd.published, .published'));

  return {
    id: `local-${crypto.randomUUID()}`,
    title: workTitle,
    author: textFrom(workskin.querySelector('h3.byline a, h3.byline')) || 'Unknown',
    summary,
    fandoms: listText(metadata, 'dd.fandom.tags a.tag'),
    pairings: listText(metadata, 'dd.relationship.tags a.tag'),
    characters: listText(metadata, 'dd.character.tags a.tag'),
    tags: listText(metadata, 'dd.freeform.tags a.tag'),
    rating,
    warnings: listText(metadata, 'dd.warning.tags a.tag'),
    wordCount,
    chapterCount: chapters.length,
    language: textFrom(metadata.querySelector('dd.language')) || 'Unknown',
    publishedDate: metadataDate,
    updatedDate: metadataDate,
    status: 'To Read',
    reaction: 'Neutral',
    personalTags: [],
    privateNotes: '',
    sourceUrl,
    sourceType: options.sourceType ?? 'Local File',
    ...(options.snapshotDate ? { snapshotDate: options.snapshotDate } : {}),
    lastImportedOrRefreshed: today,
    isDownloaded: true,
    downloadSize: undefined,
    currentChapterId: chapters[0].id,
    currentParagraphIndex: 0,
    readingProgress: 0,
    chapters
  };
}
