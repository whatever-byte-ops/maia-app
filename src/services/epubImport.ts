import JSZip from 'jszip';
import type { Chapter, Work } from '../types';

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MAX_TEXT_SIZE = 3_000_000;
const MAX_CHAPTER_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_CHAPTER_FILE_SIZE = 20 * 1024 * 1024;
const DC_NAMESPACE = 'http://purl.org/dc/elements/1.1/';

interface ZipEntryWithSize extends JSZip.JSZipObject {
  _data?: { uncompressedSize?: number };
}

function assertUncompressedSize(file: JSZip.JSZipObject, maxSize: number): number {
  const size = (file as ZipEntryWithSize)._data?.uncompressedSize;
  if (typeof size !== 'number' || size > maxSize) {
    throw new Error('This EPUB contains a file that exceeds the safe extraction limit.');
  }
  return size;
}

function elementsByLocalName(root: ParentNode, localName: string): Element[] {
  return Array.from(root.querySelectorAll('*')).filter((element) => element.localName.toLowerCase() === localName);
}

function firstByLocalName(root: ParentNode, localName: string): Element | null {
  return elementsByLocalName(root, localName)[0] ?? null;
}

function metadataText(metadata: Element, localName: string): string {
  const namespaced = Array.from(metadata.getElementsByTagNameNS(DC_NAMESPACE, localName));
  const matching = namespaced.length
    ? namespaced
    : elementsByLocalName(metadata, localName);
  return matching.map((element) => element.textContent?.trim() ?? '').find(Boolean) ?? '';
}

function appendTextBlocks(element: Element, blocks: string[]): void {
  const blockTags = new Set(['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre']);
  const ignoredTags = new Set(['script', 'style', 'svg', 'nav', 'noscript', 'head']);
  const visit = (node: Element) => {
    const tag = node.localName.toLowerCase();
    if (ignoredTags.has(tag)) return;
    if (blockTags.has(tag)) {
      const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (text) blocks.push(text);
      return;
    }
    for (const child of Array.from(node.children)) visit(child);
  };
  visit(element);
}

function safeAo3Source(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['archiveofourown.org', 'www.archiveofourown.org'].includes(url.hostname)) return '';
    if (!/^\/(?:works|chapters)\/\d+(?:\/chapters\/\d+)?\/?$/.test(url.pathname)) return '';
    return `https://archiveofourown.org${url.pathname}`;
  } catch {
    return '';
  }
}

function textContent(document: Document, selectors: string): string {
  const names = selectors.split(',').map((selector) => selector.trim().toLowerCase());
  return elementsByLocalName(document, names[0])
    .concat(...names.slice(1).map((name) => elementsByLocalName(document, name)))
    .find((element) => element.textContent?.trim())
    ?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export async function parseEpubFile(file: File): Promise<Work> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('This EPUB is larger than the 30 MB import limit.');
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) throw new Error('This file is not a valid EPUB: its container metadata is missing.');
  assertUncompressedSize(containerFile, 256 * 1024);

  const containerDocument = new DOMParser().parseFromString(await containerFile.async('text'), 'application/xml');
  const packagePath = firstByLocalName(containerDocument, 'rootfile')?.getAttribute('full-path');
  if (!packagePath) throw new Error('This EPUB is missing its package document.');

  const packageFile = zip.file(packagePath);
  if (!packageFile) throw new Error('This EPUB references a package document that is not present in the file.');
  assertUncompressedSize(packageFile, 1024 * 1024);
  const packageDocument = new DOMParser().parseFromString(await packageFile.async('text'), 'application/xml');
  if (packageDocument.querySelector('parsererror')) throw new Error('The EPUB package metadata could not be read.');

  const metadata = firstByLocalName(packageDocument, 'metadata');
  const manifest = firstByLocalName(packageDocument, 'manifest');
  const spine = firstByLocalName(packageDocument, 'spine');
  if (!metadata || !manifest || !spine) throw new Error('This EPUB is missing its title, manifest, or reading order.');

  const manifestItems = new Map(
    elementsByLocalName(manifest, 'item')
      .map((item) => [item.id, item] as const)
      .filter(([id]) => Boolean(id))
  );
  const packageDirectory = packagePath.includes('/') ? packagePath.slice(0, packagePath.lastIndexOf('/') + 1) : '';
  const chapterElements = elementsByLocalName(spine, 'itemref')
    .map((itemref) => manifestItems.get(itemref.getAttribute('idref') ?? ''))
    .filter((item): item is Element => Boolean(item))
    .filter((item) => {
      const properties = (item.getAttribute('properties') ?? '').split(/\s+/);
      return !properties.includes('nav')
        && !/nav|toc|cover/i.test(item.getAttribute('href') ?? '')
        && /(?:application\/xhtml\+xml|text\/html)/i.test(item.getAttribute('media-type') ?? 'application/xhtml+xml');
    });

  const chapters: Chapter[] = [];
  let totalTextSize = 0;
  let totalChapterFileSize = 0;
  for (const [index, item] of chapterElements.entries()) {
    const href = item.getAttribute('href');
    if (!href) continue;
    let chapterPath: string;
    try {
      chapterPath = decodeURIComponent(new URL(href, `https://epub.invalid/${packageDirectory}`).pathname.slice(1));
    } catch {
      continue;
    }
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile || chapterFile.dir) continue;
    totalChapterFileSize += assertUncompressedSize(chapterFile, MAX_CHAPTER_FILE_SIZE);
    if (totalChapterFileSize > MAX_TOTAL_CHAPTER_FILE_SIZE) {
      throw new Error('This EPUB contains more than 20 MB of chapter files, which exceeds the safe extraction limit.');
    }
    const chapterDocument = new DOMParser().parseFromString(await chapterFile.async('text'), 'application/xhtml+xml');
    if (chapterDocument.querySelector('parsererror')) continue;
    const body = firstByLocalName(chapterDocument, 'body') ?? chapterDocument.documentElement;
    const paragraphs: string[] = [];
    appendTextBlocks(body, paragraphs);
    if (!paragraphs.length) continue;
    totalTextSize += paragraphs.reduce((total, paragraph) => total + paragraph.length, 0);
    if (totalTextSize > MAX_TEXT_SIZE) {
      throw new Error('This EPUB contains more than 3 million characters of chapter text, which exceeds the current import limit.');
    }
    const heading = textContent(chapterDocument, 'h1, h2, h3, title') || `Chapter ${chapters.length + 1}`;
    chapters.push({
      id: `chapter-${chapters.length + 1}`,
      number: chapters.length + 1,
      title: heading,
      wordCount: paragraphs.join(' ').split(/\s+/).filter(Boolean).length,
      content: paragraphs
    });
  }

  if (!chapters.length) throw new Error('No readable chapter text was found in this EPUB.');

  const title = metadataText(metadata, 'title') || file.name.replace(/\.epub$/i, '');
  const author = metadataText(metadata, 'creator') || 'Unknown';
  const wordCount = chapters.reduce((total, chapter) => total + chapter.wordCount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const tags = Array.from(metadata.getElementsByTagNameNS(DC_NAMESPACE, 'subject'))
    .map((subject) => subject.textContent?.trim() ?? '')
    .filter(Boolean);
  if (!tags.length) tags.push(...elementsByLocalName(metadata, 'subject').map((subject) => subject.textContent?.trim() ?? '').filter(Boolean));
  const sourceUrl = safeAo3Source(metadataText(metadata, 'identifier'));

  return {
    id: `local-${crypto.randomUUID()}`,
    title,
    author,
    summary: metadataText(metadata, 'description'),
    fandoms: [],
    pairings: [],
    characters: [],
    tags,
    rating: 'Not Rated',
    warnings: [],
    wordCount,
    chapterCount: chapters.length,
    language: metadataText(metadata, 'language') || 'Unknown',
    publishedDate: metadataText(metadata, 'date'),
    updatedDate: metadataText(metadata, 'date'),
    status: 'To Read',
    reaction: 'Neutral',
    personalTags: [],
    privateNotes: '',
    sourceUrl,
    sourceType: 'EPUB',
    lastImportedOrRefreshed: today,
    isDownloaded: true,
    currentChapterId: chapters[0].id,
    currentParagraphIndex: 0,
    readingProgress: 0,
    chapters
  };
}
