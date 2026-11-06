import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { QueueStrategy, TextToSpeech } from '@capacitor-community/text-to-speech';
import { Work, ReaderSettings, Annotation } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Settings as SettingsIcon, Volume2, Play, Pause, Square, Bookmark, Globe, X, Check, Highlighter, Plus, Minus, Timer } from 'lucide-react';
import { franc } from 'franc';
import { iso6393To1 } from 'iso-639-3';

const MAX_NATIVE_SPEECH_CHUNK_LENGTH = 3500;
const MIN_AUDIO_RATE = 0.5;
const MAX_AUDIO_RATE = 3;
const AUDIO_RATE_STEP = 0.05;

const normalizeAudioRate = (rate: number) => Math.min(
  MAX_AUDIO_RATE,
  Math.max(MIN_AUDIO_RATE, Math.round(rate / AUDIO_RATE_STEP) * AUDIO_RATE_STEP)
);

const formatAudioRate = (rate: number) => rate.toFixed(2).replace(/\.?0+$/, '');

const formatAudioTime = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const estimateSpeechDuration = (text: string, rate: number) => {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil((wordCount / (150 * rate)) * 60));
};

const splitNativeSpeechText = (text: string, maxLength = MAX_NATIVE_SPEECH_CHUNK_LENGTH) => {
  const chunks: { text: string; start: number }[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const boundary = Math.max(lastSpace, lastNewline);
      if (boundary > start + maxLength / 2) end = boundary + 1;
      if (text.charCodeAt(end - 1) >= 0xd800 && text.charCodeAt(end - 1) <= 0xdbff) end -= 1;
    }
    chunks.push({ text: text.slice(start, end), start });
    start = end;
  }
  return chunks;
};

const detectTextLanguage = (text: string): string | null => {
  const sample = text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);

  if (sample.length < 100) return null;

  const detected = franc(sample, { minLength: 100 });

  if (detected === 'und') return null;

  return iso6393To1[detected] ?? detected;
};

const selectNativeSpeechLanguage = (
  requestedLanguage: string,
  supportedLanguages: string[]
): string | null => {
  const normalize = (language: string) =>
    language.replace(/_/g, '-').toLowerCase();

  const requested = normalize(requestedLanguage);
  const requestedBase = requested.split('-')[0];

  const exactMatch = supportedLanguages.find(
    (language) => normalize(language) === requested
  );

  if (exactMatch) return exactMatch;

  const sameLanguage = supportedLanguages.find(
    (language) => normalize(language).split('-')[0] === requestedBase
  );

  if (sameLanguage) return sameLanguage;

  return null;
};

const SPEAKING_WORD_CLASS = 'rounded-sm bg-[var(--accent)] text-[var(--bg-main)] ring-1 ring-[var(--accent)]';
const SPEAKING_SPACE_CLASS = 'bg-[var(--accent)] text-[var(--bg-main)]';

type ChapterParagraphProps = {
  index: number;
  text: string;
  workId: string;
  chapterId: string;
  annotations: Annotation[];
  // Posición de la letra que se está leyendo en este párrafo, o -1 si no se lee aquí
  speakingCharacterIndex: number;
  // Fin del rango leído (solo iOS). Si no existe, se ilumina una sola palabra.
  speakingEndCharacterIndex?: number;
};

const ChapterParagraph = React.memo(function ChapterParagraph({
  index,
  text,
  workId,
  chapterId,
  annotations,
  speakingCharacterIndex,
  speakingEndCharacterIndex
}: ChapterParagraphProps) {
  // Se separa el texto en palabras y espacios una sola vez por párrafo
  const tokens = useMemo(() => {
    const result: { text: string; start: number; end: number; isSpace: boolean }[] = [];
    const pattern = /\S+|\s+/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      result.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        isSpace: /^\s+$/.test(match[0])
      });
    }
    return result;
  }, [text]);

  return (
    <p data-paragraph-index={index} className="indent-4 sm:indent-6">
      {tokens.map((token) => {
        // Con rango (iOS): se ilumina todo lo que cae dentro del fragmento.
        // Sin rango (Android): se ilumina solo la palabra que suena, como antes.
        const isSpeaking = speakingEndCharacterIndex !== undefined
          ? token.end > speakingCharacterIndex && token.start < speakingEndCharacterIndex
          : !token.isSpace && speakingCharacterIndex >= token.start && speakingCharacterIndex < token.end;

        if (token.isSpace) {
          return (
            <span key={token.start} className={isSpeaking ? SPEAKING_SPACE_CLASS : undefined}>
              {token.text}
            </span>
          );
        }

        const annotation = annotations.find((item) =>
          item.workId === workId
          && item.chapterId === chapterId
          && item.paragraphIndex === index
          && (item.startOffset ?? -1) < token.end
          && (item.endOffset ?? -1) > token.start
        );

        const wordStart = Math.max(token.start, annotation?.startOffset ?? token.start);
        const wordEnd = Math.min(token.end, annotation?.endOffset ?? token.end);
        const content = annotation && wordStart < wordEnd
          ? (
            <>
              {token.text.slice(0, wordStart - token.start)}
              <mark
                className="rounded-sm px-0.5"
                style={{ backgroundColor: `var(--highlight-${annotation.highlightColor})`, color: 'inherit' }}
              >
                {token.text.slice(wordStart - token.start, wordEnd - token.start)}
              </mark>
              {token.text.slice(wordEnd - token.start)}
            </>
          )
          : token.text;

        return (
          <span
            key={token.start}
            data-word-start={token.start}
            data-word-end={token.end}
            className={isSpeaking ? SPEAKING_WORD_CLASS : undefined}
          >
            {content}
          </span>
        );
      })}
    </p>
  );
});

const getSafeHttpUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.href
      : null;
  } catch {
    // Si la dirección no se puede leer (por ejemplo, una ruta relativa), no se usa
    return null;
  }
};

interface ReaderViewProps {
  work: Work;
  annotations: Annotation[];
  readerSettings: ReaderSettings;
  onClose: () => void;
  onUpdateProgress: (workId: string, chapterId: string, paragraphIndex: number, progress: number) => void;
  onUpdateTtsPosition: (workId: string, chapterId: string, paragraphIndex: number, characterIndex: number, rate: number) => void;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onUpdateSettings: (settings: ReaderSettings) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  work,
  annotations,
  readerSettings,
  onClose,
  onUpdateProgress,
  onUpdateTtsPosition,
  onAddAnnotation,
  onUpdateSettings
}) => {
  const [currentChapterId, setCurrentChapterId] = useState<string>(
    work.ttsChapterId || work.currentChapterId || work.chapters[0]?.id
  );
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(
    work.ttsChapterId === (work.currentChapterId || work.chapters[0]?.id)
      ? work.ttsParagraphIndex ?? work.currentParagraphIndex
      : work.currentParagraphIndex
  );
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [chapterNavOpen, setChapterNavOpen] = useState(false);
  const [audioControlsOpen, setAudioControlsOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [audioRate, setAudioRate] = useState(() => normalizeAudioRate(work.ttsRate ?? 1));
  const [audioElapsedSeconds, setAudioElapsedSeconds] = useState(0);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(0);
  const [activeSpeechPosition, setActiveSpeechPosition] = useState<{ paragraphIndex: number; characterIndex: number; endCharacterIndex?: number } | null>(null);
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState<number | null>(null);  const [selectedCharacterOffset, setSelectedCharacterOffset] = useState(0);
  const readerRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechIdRef = useRef(0);
  const speechParagraphRef = useRef<number | null>(null);
  const speechBoundaryHandlerRef = useRef<((characterIndex: number) => void) | null>(null);
  const nativeChunkOffsetRef = useRef(0);
  const nativeResumePositionRef = useRef({
    paragraphIndex: work.ttsChapterId === (work.currentChapterId || work.chapters[0]?.id)
      ? work.ttsParagraphIndex ?? currentParagraphIndex
      : currentParagraphIndex,
    characterIndex: work.ttsChapterId === (work.currentChapterId || work.chapters[0]?.id)
      ? work.ttsCharacterIndex ?? 0
      : 0
  });
  const nativeListenerReadyRef = useRef<Promise<void> | null>(null);
  const nativeSpeechLanguageRef = useRef<Promise<string> | null>(null);
  const savedPositionRef = useRef('');
  const speechPositionDirtyRef = useRef(false);
  const audioDurationRef = useRef(0);

  // Selection and annotation state

  const [selectedText, setSelectedText] = useState<string>('');
  const [annotationPopupOpen, setAnnotationPopupOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<Annotation['highlightColor']>('yellow');
  const [noteMode, setNoteMode] = useState(false);

  const currentChapterIndex = work.chapters.findIndex((c) => c.id === currentChapterId);
  const currentChapter = work.chapters[currentChapterIndex] || work.chapters[0];
  const sourceChapterUrl = currentChapter.url || work.sourceUrl;
  const safeChapterUrl = getSafeHttpUrl(sourceChapterUrl);
  const nativeSpeech = Capacitor.isNativePlatform();
  const saveSpeechPosition = useCallback(() => {
    if (!speechPositionDirtyRef.current) return;
    const { paragraphIndex, characterIndex } = nativeResumePositionRef.current;
    onUpdateTtsPosition(work.id, currentChapter.id, paragraphIndex, characterIndex, audioRate);
    speechPositionDirtyRef.current = false;
  }, [audioRate, currentChapter.id, onUpdateTtsPosition, work.id]);

  const speechSupported = nativeSpeech || (typeof window !== 'undefined' && 'speechSynthesis' in window);

  const scrollToParagraph = useCallback((paragraphIndex: number, behavior: ScrollBehavior) => {
    const reader = readerRef.current;
    const paragraph = reader?.querySelector<HTMLElement>(`[data-paragraph-index="${paragraphIndex}"]`);
    if (!reader || !paragraph) return;
    const headerHeight = reader.querySelector('header')?.getBoundingClientRect().height ?? 0;
    const top = reader.scrollTop + paragraph.getBoundingClientRect().top - reader.getBoundingClientRect().top - headerHeight - 12;
    reader.scrollTo({ top: Math.max(0, top), behavior });
  }, []);

  const scrollSpeechWordIntoView = useCallback((paragraphIndex: number, characterIndex: number) => {
    const reader = readerRef.current;
    const paragraph = reader?.querySelector<HTMLElement>(`[data-paragraph-index="${paragraphIndex}"]`);
    if (!reader || !paragraph) return;
    const word = Array.from(paragraph.querySelectorAll<HTMLElement>('[data-word-start]')).find((element) => {
      const start = Number(element.dataset.wordStart);
      const end = Number(element.dataset.wordEnd);
      return characterIndex >= start && characterIndex < end;
    });
    if (!word) return;
    const readerRect = reader.getBoundingClientRect();
    const headerHeight = reader.querySelector('header')?.getBoundingClientRect().height ?? 0;
    const wordRect = word.getBoundingClientRect();
    const visibleTop = readerRect.top + headerHeight + 20;
    const visibleBottom = readerRect.bottom - 48;
    if (wordRect.top >= visibleTop && wordRect.bottom <= visibleBottom) return;
    const targetTop = reader.scrollTop + wordRect.top - readerRect.top - headerHeight - reader.clientHeight * 0.4;
    reader.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  }, []);

  const stopSpeech = useCallback(() => {
    speechIdRef.current += 1;
    speechBoundaryHandlerRef.current = null;
    if (nativeSpeech) {
      void TextToSpeech.stop().catch((error: unknown) => {
        setAudioError(`Could not stop text-to-speech: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    speechParagraphRef.current = null;
    setActiveSpeechPosition(null);
    setAudioPlaying(false);
    setAudioPaused(false);
    setAudioElapsedSeconds(0);
    setAudioDurationSeconds(0);
  }, [nativeSpeech, speechSupported]);

  const startSpeech = useCallback((startAt: number, characterOffset = 0, rate = audioRate, preserveTiming = false) => {
    if (!speechSupported) {
      setAudioError('Text-to-speech is not supported by this browser.');
      return;
    }
    const paragraphs = currentChapter.content.slice(startAt);
    if (paragraphs.length > 0 && characterOffset > 0) {
      paragraphs[0] = paragraphs[0].slice(characterOffset);
    }
    const text = paragraphs.join('\n\n');
    if (!text.trim()) return;
    const estimatedDuration = estimateSpeechDuration(text, rate);
    if (!preserveTiming) {
      setAudioElapsedSeconds(0);
      setAudioDurationSeconds(estimatedDuration);
    }
    speechParagraphRef.current = startAt;
    setCurrentParagraphIndex(startAt);
    setActiveSpeechPosition(null);
    const initialChapterProgress = currentChapter.content.length > 1
      ? startAt / (currentChapter.content.length - 1)
      : 0;
    const initialProgress = Math.min(
      100,
      Math.round(((currentChapterIndex + initialChapterProgress) / work.chapters.length) * 100)
    );
    onUpdateProgress(work.id, currentChapter.id, startAt, initialProgress);
    const paragraphStarts: number[] = [];
    let textOffset = 0;
    paragraphs.forEach((paragraph, index) => {
      paragraphStarts.push(textOffset);
      textOffset += paragraph.length + (index < paragraphs.length - 1 ? 2 : 0);
    });
    const speechId = ++speechIdRef.current;
    nativeResumePositionRef.current = { paragraphIndex: startAt, characterIndex: characterOffset };
    speechPositionDirtyRef.current = true;
    const handleBoundary = (boundaryOffset: number, boundaryEndOffset?: number) => {      if (speechId !== speechIdRef.current) return;
      let segmentParagraphIndex = paragraphStarts.length - 1;
      for (let index = 0; index < paragraphStarts.length - 1; index += 1) {
        if (boundaryOffset < paragraphStarts[index + 1]) {
          segmentParagraphIndex = index;
          break;
        }
      }
      const paragraphIndex = startAt + segmentParagraphIndex;
      const localCharacterIndex = boundaryOffset - paragraphStarts[segmentParagraphIndex]
        + (segmentParagraphIndex === 0 ? characterOffset : 0);
      nativeResumePositionRef.current = { paragraphIndex, characterIndex: localCharacterIndex };
      speechPositionDirtyRef.current = true;
            const localEndIndex = boundaryEndOffset === undefined
        ? undefined
        : Math.min(
          boundaryEndOffset - paragraphStarts[segmentParagraphIndex],
          paragraphs[segmentParagraphIndex].length
        ) + (segmentParagraphIndex === 0 ? characterOffset : 0);
      setActiveSpeechPosition({ paragraphIndex, characterIndex: localCharacterIndex, endCharacterIndex: localEndIndex });
      scrollSpeechWordIntoView(paragraphIndex, localCharacterIndex);
      if (speechParagraphRef.current !== paragraphIndex) {
        speechParagraphRef.current = paragraphIndex;
        onUpdateTtsPosition(work.id, currentChapter.id, paragraphIndex, localCharacterIndex, audioRate);
        setCurrentParagraphIndex(paragraphIndex);
        const chapterProgress = currentChapter.content.length > 1
          ? paragraphIndex / (currentChapter.content.length - 1)
          : 0;
        const progress = Math.min(100, Math.round(((currentChapterIndex + chapterProgress) / work.chapters.length) * 100));
        onUpdateProgress(work.id, currentChapter.id, paragraphIndex, progress);
      }
    };
    speechBoundaryHandlerRef.current = handleBoundary;
    const finishSpeech = () => {
      if (speechId !== speechIdRef.current) return;
      utteranceRef.current = null;
      speechParagraphRef.current = null;
      speechBoundaryHandlerRef.current = null;
      setActiveSpeechPosition(null);
      setAudioElapsedSeconds(audioDurationRef.current);
      setAudioPlaying(false);
      setAudioPaused(false);
    };
    const failSpeech = (error: unknown) => {
      if (speechId !== speechIdRef.current) return;
      setAudioError(`Text-to-speech failed: ${error instanceof Error ? error.message : String(error)}`);
      setAudioControlsOpen(true);
      if (nativeSpeech) nativeSpeechLanguageRef.current = null;
      utteranceRef.current = null;
      speechParagraphRef.current = null;
      speechBoundaryHandlerRef.current = null;
      setActiveSpeechPosition(null);
      setAudioPlaying(false);
      setAudioPaused(false);
    };
    setAudioError('');
    setAudioPaused(false);
    setAudioPlaying(true);
    if (nativeSpeech) {
      const listenerReady = nativeListenerReadyRef.current;
      if (!listenerReady) {
        failSpeech(new Error('The Android text-to-speech service is not ready.'));
        return;
      }
      const chunks = splitNativeSpeechText(
        text,
        Capacitor.getPlatform() === 'ios' ? 150 : MAX_NATIVE_SPEECH_CHUNK_LENGTH
      );
        void listenerReady
          .then(async () => {

            const { languages } = await TextToSpeech.getSupportedLanguages();

            const availableLanguages = languages.filter(
              (language) => language && language.toLowerCase() !== 'und'
            );

            const declaredLanguage = work.language && !/^(unknown|und|)$/i.test(work.language.trim())
              ? work.language.trim()
              : null;

            const detectedLanguage = declaredLanguage ?? detectTextLanguage(text) ?? 'en';

            const language = selectNativeSpeechLanguage(
              detectedLanguage,
              availableLanguages
            ) ?? detectedLanguage;

            if (!language) {
              throw new Error(
                `Your phone doesn't have a voice for: ${detectedLanguage} Install one in Settings > Text-to-speech.`
              );
            }

            for (const chunk of chunks) {
              if (speechId !== speechIdRef.current) return;

              nativeChunkOffsetRef.current = chunk.start;
              handleBoundary(
                chunk.start,
                Capacitor.getPlatform() === 'ios' ? chunk.start + chunk.text.length : undefined
              );
              await TextToSpeech.speak({
                text: chunk.text,
                lang: language,
                rate,
                queueStrategy: QueueStrategy.Flush
              });
            }
            finishSpeech();
          })
          .catch((error: unknown) => {
            failSpeech(error);
          });
        return;
      }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onboundary = (event) => handleBoundary(event.charIndex);
    utterance.onend = finishSpeech;
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') failSpeech(event.error);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [audioRate, currentChapter, currentChapterIndex, nativeSpeech, onUpdateProgress, onUpdateTtsPosition, scrollSpeechWordIntoView, speechSupported, work.chapters.length, work.id, work.language]);

  useEffect(() => {
    audioDurationRef.current = audioDurationSeconds;
  }, [audioDurationSeconds]);

  useEffect(() => {
    if (!audioPlaying || audioPaused) return;
    const timer = window.setInterval(() => {
      setAudioElapsedSeconds((elapsed) => Math.min(audioDurationRef.current, elapsed + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [audioDurationSeconds, audioPaused, audioPlaying]);

  useEffect(() => {
    if (!nativeSpeech || audioPaused) return;
    let disposed = false;
    let listener: PluginListenerHandle | null = null;
    const listenerReady = TextToSpeech.addListener('onRangeStart', ({ start }) => {
      speechBoundaryHandlerRef.current?.(nativeChunkOffsetRef.current + start);
    }).then((registeredListener) => {
      if (disposed) {
        void registeredListener.remove().catch((error: unknown) => {
          console.error('Could not remove text-to-speech listener:', error);
        });
      } else {
        listener = registeredListener;
      }
    });
    nativeListenerReadyRef.current = listenerReady;
    void listenerReady.catch((error: unknown) => {
      if (!disposed) {
        setAudioError(`Could not initialize text-to-speech: ${error instanceof Error ? error.message : String(error)}`);
        setAudioControlsOpen(true);
      }
    });
    return () => {
      disposed = true;
      nativeListenerReadyRef.current = null;
      nativeSpeechLanguageRef.current = null;
      if (listener) {
        void listener.remove().catch((error: unknown) => {
          console.error('Could not remove text-to-speech listener:', error);
        });
      }
    };
  }, [nativeSpeech]);

  useEffect(() => {
    if (audioPlaying) return;
    saveSpeechPosition();
  }, [audioPlaying, saveSpeechPosition]);

  const getVisibleParagraphIndex = useCallback(() => {
    const reader = readerRef.current;
    if (!reader) return currentParagraphIndex;
    const paragraphs = Array.from(reader.querySelectorAll<HTMLElement>('[data-paragraph-index]'));
    const anchor = reader.getBoundingClientRect().top + reader.clientHeight * 0.28;
    const visibleParagraph = paragraphs.find((paragraph) => paragraph.getBoundingClientRect().bottom >= anchor);
    return visibleParagraph ? Number(visibleParagraph.dataset.paragraphIndex) : currentChapter.content.length - 1;
  }, [currentChapter.content.length, currentParagraphIndex]);

  const saveReadingPosition = useCallback(() => {
    const paragraphIndex = getVisibleParagraphIndex();
    const positionKey = `${currentChapter.id}:${paragraphIndex}`;
    if (savedPositionRef.current === positionKey) return;
    savedPositionRef.current = positionKey;
    setCurrentParagraphIndex(paragraphIndex);
    const chapterProgress = currentChapter.content.length > 1
      ? paragraphIndex / (currentChapter.content.length - 1)
      : 0;
    const progress = Math.min(100, Math.round(((currentChapterIndex + chapterProgress) / work.chapters.length) * 100));
    onUpdateProgress(work.id, currentChapter.id, paragraphIndex, progress);
  }, [currentChapter.content.length, currentChapter.id, currentChapterIndex, getVisibleParagraphIndex, onUpdateProgress, work.chapters.length, work.id]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    const savedParagraph = currentChapterId === work.ttsChapterId
      ? work.ttsParagraphIndex ?? 0
      : currentChapterId === work.currentChapterId
        ? work.currentParagraphIndex
        : 0;
    setCurrentParagraphIndex(savedParagraph);
    const frame = window.requestAnimationFrame(() => {
      scrollToParagraph(savedParagraph, 'auto');
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentChapterId, scrollToParagraph, work.id]);

  useEffect(() => {
    if (utteranceRef.current) utteranceRef.current.rate = audioRate;
  }, [audioRate]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    let frame = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(saveReadingPosition);
    };
    reader.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      reader.removeEventListener('scroll', handleScroll);
    };
  }, [saveReadingPosition]);

  useEffect(() => () => {
    speechIdRef.current += 1;
    speechBoundaryHandlerRef.current = null;
    if (nativeSpeech) {
      void TextToSpeech.stop().catch((error: unknown) => {
        console.error('Could not stop text-to-speech on reader close:', error);
      });
    } else {
      window.speechSynthesis?.cancel();
    }
  }, [nativeSpeech]);

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      const prev = work.chapters[currentChapterIndex - 1];
      stopSpeech();
      nativeResumePositionRef.current = { paragraphIndex: 0, characterIndex: 0 };
      setCurrentChapterId(prev.id);
      setCurrentParagraphIndex(0);
      onUpdateProgress(work.id, prev.id, 0, Math.round(((currentChapterIndex - 1) / work.chapters.length) * 100));
      readerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < work.chapters.length - 1) {
      const next = work.chapters[currentChapterIndex + 1];
      stopSpeech();
      nativeResumePositionRef.current = { paragraphIndex: 0, characterIndex: 0 };
      setCurrentChapterId(next.id);
      setCurrentParagraphIndex(0);
      onUpdateProgress(work.id, next.id, 0, Math.round(((currentChapterIndex + 1) / work.chapters.length) * 100));
      readerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rangeStart = range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
      const paragraph = rangeStart?.closest<HTMLElement>('[data-paragraph-index]');
      if (!paragraph) return;
      setSelectedText(selection.toString().trim());
      setSelectedParagraphIndex(Number(paragraph.dataset.paragraphIndex));
      const prefixRange = document.createRange();
      prefixRange.selectNodeContents(paragraph);
      prefixRange.setEnd(range.startContainer, range.startOffset);
      setSelectedCharacterOffset(prefixRange.toString().length);
      setAnnotationPopupOpen(true);
    }
  };

  const handleSelectionEnd = () => {
    window.setTimeout(handleTextSelection, 0);
  };

  const handlePlayPause = () => {
    setAudioError('');
    if (!speechSupported) return;
    if (!audioPlaying) {
      const savedChapterId = work.ttsChapterId;
      const hasSavedSpeechPosition = savedChapterId === currentChapter.id
        && typeof work.ttsParagraphIndex === 'number';
      startSpeech(
        hasSavedSpeechPosition ? work.ttsParagraphIndex! : currentParagraphIndex,
        hasSavedSpeechPosition ? work.ttsCharacterIndex ?? 0 : 0
      );
    } else if (audioPaused) {
      if (nativeSpeech) {
        const { paragraphIndex, characterIndex } = nativeResumePositionRef.current;
        startSpeech(paragraphIndex, characterIndex, audioRate, true);
      } else {
        window.speechSynthesis.resume();
        setAudioPaused(false);
      }
    } else if (nativeSpeech) {
      const { paragraphIndex, characterIndex } = nativeResumePositionRef.current;
      speechIdRef.current += 1;
      speechBoundaryHandlerRef.current = null;
      void TextToSpeech.stop()
        .then(() => {
          nativeResumePositionRef.current = { paragraphIndex, characterIndex };
          setAudioPaused(true);
        })
        .catch((error: unknown) => {
          setAudioError(`Could not pause text-to-speech: ${error instanceof Error ? error.message : String(error)}`);
          setAudioPlaying(false);
          setAudioPaused(false);
        });
    } else {
      window.speechSynthesis.pause();
      setAudioPaused(true);
    }
  };

  const handleAudioRateChange = (rate: number) => {
    const normalizedRate = normalizeAudioRate(rate);
    setAudioRate(normalizedRate);
    onUpdateTtsPosition(
      work.id,
      currentChapter.id,
      nativeResumePositionRef.current.paragraphIndex,
      nativeResumePositionRef.current.characterIndex,
      normalizedRate
    );
    if (!audioPlaying) return;
    setAudioDurationSeconds((duration) => {
      const remaining = Math.max(0, duration - audioElapsedSeconds);
      return Math.max(audioElapsedSeconds + 1, audioElapsedSeconds + Math.ceil(remaining * audioRate / normalizedRate));
    });
    if (!nativeSpeech || audioPaused) return;
    const { paragraphIndex, characterIndex } = nativeResumePositionRef.current;
    speechIdRef.current += 1;
    speechBoundaryHandlerRef.current = null;
    void TextToSpeech.stop()
      .then(() => startSpeech(paragraphIndex, characterIndex, normalizedRate, true))
      .catch((error: unknown) => {
        setAudioError(`Could not change text-to-speech speed: ${error instanceof Error ? error.message : String(error)}`);
        setAudioPlaying(false);
        setAudioPaused(false);
      });
  };

  const handleOpenSpeechSetup = () => {
    void TextToSpeech.openInstall().catch((error: unknown) => {
      setAudioError(`Could not open Android speech setup: ${error instanceof Error ? error.message : String(error)}`);
    });
  };

  const handleReadFromSelection = () => {
    if (selectedParagraphIndex === null) return;
    setCurrentParagraphIndex(selectedParagraphIndex);
    const chapterProgress = currentChapter.content.length > 1
      ? selectedParagraphIndex / (currentChapter.content.length - 1)
      : 0;
    const progress = Math.min(100, Math.round(((currentChapterIndex + chapterProgress) / work.chapters.length) * 100));
    onUpdateProgress(work.id, currentChapter.id, selectedParagraphIndex, progress);
    scrollToParagraph(selectedParagraphIndex, 'smooth');
    startSpeech(selectedParagraphIndex, selectedCharacterOffset);
    setAnnotationPopupOpen(false);
    setAudioControlsOpen(true);
  };

  const handleSaveAnnotation = (highlightColor = selectedHighlightColor) => {
    if (!selectedText) return;
    onAddAnnotation({
      workId: work.id,
      workTitle: work.title,
      chapterId: currentChapter.id,
      chapterTitle: currentChapter.title,
      selectedText,
      paragraphIndex: selectedParagraphIndex ?? undefined,
      startOffset: selectedCharacterOffset,
      endOffset: selectedCharacterOffset + selectedText.length,
      highlightColor,
      note: noteInput,
      tags: tagInput ? tagInput.split(',').map((t) => t.trim()) : ['Highlight']
    });
    setSelectedText('');
    setNoteInput('');
    setTagInput('');
    setNoteMode(false);
    setAnnotationPopupOpen(false);
  };

  const handleHighlight = (color: Annotation['highlightColor']) => {
    handleSaveAnnotation(color);
  };

  const handleCloseReader = () => {
    saveReadingPosition();
    saveSpeechPosition();
    stopSpeech();
    nativeResumePositionRef.current = { paragraphIndex: 0, characterIndex: 0 };
    onClose();
  };

  const handleSelectChapter = (chapterId: string) => {
    const chapterIndex = work.chapters.findIndex((chapter) => chapter.id === chapterId);
    if (chapterIndex < 0) return;
    stopSpeech();
    nativeResumePositionRef.current = { paragraphIndex: 0, characterIndex: 0 };
    setCurrentChapterId(chapterId);
    setCurrentParagraphIndex(0);
    setChapterNavOpen(false);
    onUpdateProgress(work.id, chapterId, 0, Math.round((chapterIndex / work.chapters.length) * 100));
    readerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine reader background class
  const getReaderBgClass = () => {
    switch (readerSettings.readerBackground) {
      case 'dark': return 'reader-bg-dark';
      case 'light': return 'reader-bg-light';
      case 'sepia': return 'reader-bg-sepia';
      case 'cream': return 'reader-bg-cream';
      case 'navy': return 'reader-bg-navy';
      default: return '';
    }
  };

  const fontFamily = {
    System: 'system-ui, sans-serif',
    Merriweather: 'Merriweather, Georgia, serif',
    Georgia: 'Georgia, serif',
    Inter: 'Inter, Arial, sans-serif',
    OpenDyslexic: 'OpenDyslexic, system-ui, sans-serif'
  }[readerSettings.fontFamily];

  const sourceLabels: Record<string, string> = {
    'Live AO3': 'AO3',
    'Local File': 'file',
  };
  const sourceName = sourceLabels[work.sourceType] ?? 'original page';
  const openLabel = `Open this work on ${sourceName}`;

  return (
    <div
      ref={readerRef}
      className={`fixed inset-0 z-50 overflow-y-auto transition-colors ${getReaderBgClass()}`}
      style={{
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)'
      }}
    >
      {/* Reader Top HUD */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 border-b backdrop-blur-md bg-opacity-95"
        style={{
          backgroundColor: readerSettings.readerBackground === 'match-theme' ? 'var(--bg-elevated)' : undefined,
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleCloseReader}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Library</span>
          </button>
          <div className="hidden sm:block overflow-hidden max-w-md">
            <p className="font-serif text-sm font-medium truncate">{work.title}</p>
            <p className="text-xs opacity-70 truncate">by {work.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio TTS toggle */}
          <button
            onClick={handlePlayPause}
            disabled={!speechSupported}
            aria-pressed={audioPlaying && !audioPaused}
            aria-label={audioPlaying ? (audioPaused ? 'Resume text-to-speech' : 'Pause text-to-speech') : 'Start text-to-speech'}
            title={!speechSupported ? 'Text-to-speech is not supported by this browser' : 'Play or pause text-to-speech'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition-colors ${
              audioPlaying && !audioPaused ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium' : ''
            }`}
            style={{ borderColor: 'var(--border-color)', opacity: speechSupported ? 1 : 0.5 }}
          >
            {audioPlaying && !audioPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{audioPlaying ? (audioPaused ? 'Resume' : 'Pause') : speechSupported ? 'Listen' : 'TTS unavailable'}</span>
          </button>

          <button
            onClick={() => setAudioControlsOpen((open) => !open)}
            aria-expanded={audioControlsOpen}
            aria-label="Audio controls"
            title="Audio controls"
            className="p-2 rounded border transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Chapter Drawer Toggle */}
          <button
            onClick={() => setChapterNavOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Ch. {currentChapter.number}</span>
          </button>

          {/* Settings Toolbar Toggle */}
          <button
            onClick={() => setToolbarOpen(!toolbarOpen)}
            className="p-2 rounded border transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
            title="Reader Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {audioControlsOpen && (
        <section
          aria-label="Text-to-speech controls"
          className="sticky top-14 z-20 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-xs shadow-md"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <span id="audio-speed-label">Speed</span>
            <div className="flex items-center rounded border" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                onClick={() => handleAudioRateChange(audioRate - AUDIO_RATE_STEP)}
                disabled={audioRate <= MIN_AUDIO_RATE}
                aria-label="Decrease text-to-speech speed"
                title="Decrease speed"
                className="p-1.5 transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span
                aria-live="polite"
                aria-labelledby="audio-speed-label"
                className="min-w-12 px-2 text-center font-medium"
              >
                {formatAudioRate(audioRate)}×
              </span>
              <button
                type="button"
                onClick={() => handleAudioRateChange(audioRate + AUDIO_RATE_STEP)}
                disabled={audioRate >= MAX_AUDIO_RATE}
                aria-label="Increase text-to-speech speed"
                title="Increase speed"
                className="p-1.5 transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <span className="opacity-70">
            {audioPlaying ? (audioPaused ? 'Paused' : 'Playing') : 'Stopped'} · paragraph {currentParagraphIndex + 1}
          </span>
          {audioError && (
            <div role="status" className="w-full text-rose-400">
              <p>{audioError}</p>
              {nativeSpeech && (
                <button onClick={handleOpenSpeechSetup} className="mt-1 underline">
                  Set up speech engine
                </button>
              )}
            </div>
          )}
          <button
            onClick={stopSpeech}
            disabled={!audioPlaying}
            className="flex items-center gap-1 rounded border px-2.5 py-1 disabled:opacity-40"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Square className="h-3 w-3" /> Stop
          </button>
        </section>
      )}

      {audioPlaying && (
        <section
          aria-label="Text-to-speech player"
          className="fixed inset-x-0 bottom-0 z-40 border-t px-4 pb-[calc(0.75rem+var(--safe-area-bottom))] pt-3 shadow-2xl backdrop-blur-md"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 94%, transparent)', borderColor: 'var(--border-color)' }}
        >
          <div className="mx-auto max-w-3xl space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <Timer className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="truncate font-medium">{work.title}</span>
                <span className="hidden shrink-0 opacity-60 sm:inline">· Ch. {currentChapter.number}</span>
              </div>
              <span className="shrink-0 opacity-75">
                {formatAudioTime(audioElapsedSeconds)} / {formatAudioTime(audioDurationSeconds)}
              </span>
            </div>

            <div
              className="h-1 overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Reading progress"
              aria-valuemin={0}
              aria-valuemax={audioDurationSeconds}
              aria-valuenow={Math.min(audioElapsedSeconds, audioDurationSeconds)}
              style={{ backgroundColor: 'var(--border-color)' }}
            >
              <div
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${audioDurationSeconds ? Math.min(100, (audioElapsedSeconds / audioDurationSeconds) * 100) : 0}%`,
                  backgroundColor: 'var(--accent)'
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="opacity-70">
                {formatAudioTime(Math.max(0, audioDurationSeconds - audioElapsedSeconds))} remaining
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded border" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => handleAudioRateChange(audioRate - AUDIO_RATE_STEP)}
                    disabled={audioRate <= MIN_AUDIO_RATE}
                    aria-label="Decrease text-to-speech speed"
                    className="p-1.5 disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-10 text-center">{formatAudioRate(audioRate)}×</span>
                  <button
                    type="button"
                    onClick={() => handleAudioRateChange(audioRate + AUDIO_RATE_STEP)}
                    disabled={audioRate >= MAX_AUDIO_RATE}
                    aria-label="Increase text-to-speech speed"
                    className="p-1.5 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePlayPause}
                  aria-label={audioPaused ? 'Resume text-to-speech' : 'Pause text-to-speech'}
                  className="flex items-center gap-1.5 rounded border px-3 py-1.5 font-medium"
                  style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--bg-main)' }}
                >
                  {audioPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  <span>{audioPaused ? 'Play' : 'Pause'}</span>
                </button>
                <button
                  type="button"
                  onClick={stopSpeech}
                  aria-label="Stop text-to-speech"
                  className="rounded border p-1.5"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reader Settings Toolbar Dropdown */}
      {toolbarOpen && (
        <div
          className="sticky top-16 z-30 max-w-xl mx-auto mt-2 p-4 rounded border shadow-xl space-y-4"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <span className="font-serif font-medium text-sm">Reader Appearance</span>
            <button onClick={() => setToolbarOpen(false)} className="p-1 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block mb-1 opacity-75">Font Size: {readerSettings.fontSize}px</label>
              <input
                type="range"
                min="14"
                max="26"
                value={readerSettings.fontSize}
                onChange={(e) => onUpdateSettings({ ...readerSettings, fontSize: Number(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block mb-1 opacity-75">Line Height: {readerSettings.lineHeight}</label>
              <input
                type="range"
                min="1.4"
                max="2.4"
                step="0.1"
                value={readerSettings.lineHeight}
                onChange={(e) => onUpdateSettings({ ...readerSettings, lineHeight: Number(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Content Area */}
      <main
        onMouseUp={handleSelectionEnd}
        onTouchEnd={handleSelectionEnd}
        className="mx-auto px-4 sm:px-8 py-12 pb-36 transition-all"
        style={{ maxWidth: readerSettings.contentWidth }}
      >
        <div className="space-y-6">
          <div className="text-center space-y-2 pb-8 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs uppercase tracking-widest opacity-60">Chapter {currentChapter.number} of {work.chapterCount}</p>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium">
              {currentChapter.title}
            </h1>
          </div>

          {/* Chapter Paragraphs */}
          <div
            className="space-y-6 leading-relaxed"
            style={{
              fontFamily,
              fontSize: `${readerSettings.fontSize}px`,
              lineHeight: readerSettings.lineHeight
            }}
          >
            {currentChapter.content.map((paragraph, idx) => (
              <ChapterParagraph
                key={idx}
                index={idx}
                text={paragraph}
                workId={work.id}
                chapterId={currentChapter.id}
                annotations={annotations}
                speakingCharacterIndex={
                  activeSpeechPosition?.paragraphIndex === idx
                    ? activeSpeechPosition.characterIndex
                    : -1
                }
                speakingEndCharacterIndex={
                  activeSpeechPosition?.paragraphIndex === idx
                    ? activeSpeechPosition.endCharacterIndex
                    : undefined
                }
              />
            ))}
          </div>
        {audioError && !audioControlsOpen && <p role="status" className="text-center text-xs text-rose-400">{audioError}</p>}
          {/* End of Chapter Navigation & AO3 Engagement */}
          <div className="pt-12 mt-12 border-t space-y-8" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevChapter}
                disabled={currentChapterIndex === 0}
                className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium border ${
                  currentChapterIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Chapter
              </button>

              <button
                onClick={handleNextChapter}
                disabled={currentChapterIndex === work.chapters.length - 1}
                className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium border ${
                  currentChapterIndex === work.chapters.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
              >
                Next Chapter
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* End-of-Chapter AO3 Engagement Section */}
            <div
              className="p-6 rounded border space-y-4 text-center"
              style={{ backgroundColor: readerSettings.readerBackground === 'match-theme' ? 'var(--bg-elevated)' : 'rgba(0,0,0,0.05)', borderColor: 'var(--border-color)' }}
            >
              <h3 className="font-serif text-base font-medium">
                {work.isSampleData ? 'Fictional sample work' : work.sourceUrl ? 'Return to the original work' : 'No source link available'}
              </h3>
              <p className="text-xs opacity-75 max-w-md mx-auto">
                {work.isSampleData
                  ? 'This example story is fictional and has no real AO3 page.'
                  : work.sourceUrl
                    ? 'This app does not post comments or kudos. Use the original work page to engage with the author.'
                    : 'The imported file did not contain a verified original work URL.'}
              </p>
              {!work.isSampleData && safeChapterUrl && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={safeChapterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium border transition-colors hover:opacity-90"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {openLabel}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Annotation Popup when text is selected */}
      {annotationPopupOpen && selectedText && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md p-4 rounded border shadow-2xl space-y-3 bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-main)]">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              <Highlighter className="w-3.5 h-3.5" /> Selected passage
            </span>
            <button onClick={() => setAnnotationPopupOpen(false)} className="p-1 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <blockquote className="text-xs italic opacity-85 line-clamp-2 pl-2 border-l-2" style={{ borderColor: 'var(--accent)' }}>
            "{selectedText}"
          </blockquote>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs opacity-70">Highlight:</span>
            {(['yellow', 'pink', 'blue', 'green', 'purple'] as const).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleHighlight(color)}
                aria-label={`Highlight ${color}`}
                title={`Highlight ${color}`}
                className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: `var(--highlight-${color})`,
                  borderColor: selectedHighlightColor === color ? 'var(--text-main)' : 'transparent'
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNoteMode((open) => !open)}
              className={`flex items-center gap-1 rounded border px-3 py-1.5 text-xs ${noteMode ? 'bg-[var(--highlight-bg)]' : ''}`}
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Bookmark className="h-3 w-3" /> Leave a note
            </button>
            {selectedParagraphIndex !== null && (
            <button
              onClick={handleReadFromSelection}
              className="flex items-center gap-1 rounded border px-3 py-1.5 text-xs"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Play className="h-3 w-3" /> Read from selected passage
            </button>
            )}
          </div>

          {noteMode && (
            <>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add private note..."
                rows={2}
                autoFocus
                className="w-full p-2 text-xs rounded border outline-none bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)]"
              />

              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Tags separated by comma (e.g. Romance, Worldbuilding)"
                className="w-full p-2 text-xs rounded border outline-none bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)]"
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setAnnotationPopupOpen(false)}
              className="px-3 py-1.5 rounded text-xs border border-[var(--border-color)]"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveAnnotation()}
              disabled={!noteMode || !noteInput.trim()}
              className="flex items-center gap-1 px-4 py-1.5 rounded text-xs font-medium bg-[var(--accent)] text-[var(--bg-main)]"
            >
              <Check className="w-3.5 h-3.5" /> Save note
            </button>
          </div>
        </div>
      )}

      {/* Chapter Navigator Drawer */}
      {chapterNavOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setChapterNavOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-80 p-6 shadow-2xl border-l flex flex-col space-y-4 bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-main)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="font-serif font-medium text-base">Table of Contents</h3>
              <button onClick={() => setChapterNavOpen(false)} className="p-1 opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {work.chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter(ch.id)}
                  className={`w-full text-left p-2.5 rounded text-xs transition-colors flex items-center justify-between ${
                    ch.id === currentChapterId ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium' : 'hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <span className="truncate">Ch. {ch.number}: {ch.title}</span>
                  <span className="text-[10px] opacity-75">{ch.wordCount}w</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
