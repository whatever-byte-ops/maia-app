import React, { useState } from 'react';
import { X, AlertCircle, ExternalLink, FileUp, LoaderCircle, Link2 } from 'lucide-react';
import type { Work } from '../types';
import { parseAo3Html } from '../services/htmlImport';
import { importAo3Url } from '../services/remoteImport';

interface ImportModalProps {
  onClose: () => void;
  onPreviewImport: (work: Work) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onPreviewImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [workUrl, setWorkUrl] = useState('');

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage('');

    const isEpub = /\.epub$/i.test(file.name) || file.type === 'application/epub+zip';
    const isHtml = /\.(html?|xhtml)$/i.test(file.name) || ['text/html', 'application/xhtml+xml'].includes(file.type);
    if (!isEpub && !isHtml) {
      setErrorMessage('Choose an EPUB file or an AO3 work page saved as HTML.');
      event.target.value = '';
      return;
    }

    setIsLoading(true);
    try {
      const work = isEpub
        ? await import('../services/epubImport').then(({ parseEpubFile }) => parseEpubFile(file))
        : parseAo3Html(await file.text());
      onPreviewImport(work);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The selected file could not be imported.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleUrlImport = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      onPreviewImport(await importAo3Url(workUrl));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The work could not be imported.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        className="w-full max-w-lg space-y-5 border p-5 shadow-xl"
        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
          <h2 id="import-modal-title" className="font-serif text-lg font-medium">Import a work</h2>
          <button type="button" onClick={onClose} aria-label="Close import dialog" className="p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleUrlImport} className="space-y-3 border p-4" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            Import from AO3 or Wayback Machine
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Paste a public AO3 work/chapter URL or a Wayback snapshot URL. You must be signed in, and restricted works still require an accessible saved file.
          </p>
          <label className="sr-only" htmlFor="work-import-url">AO3 or Wayback URL</label>
          <input
            id="work-import-url"
            type="url"
            value={workUrl}
            onChange={(event) => setWorkUrl(event.target.value)}
            placeholder="https://archiveofourown.org/works/…"
            required
            disabled={isLoading}
            className="w-full border px-3 py-2 text-sm"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          />
          <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {isLoading ? 'Fetching work…' : 'Import URL'}
          </button>
        </form>

        <div className="space-y-2 border p-4" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileUp className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            Import a file from this device
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            EPUB files and AO3 work pages saved as HTML are read on this device and are not uploaded.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-xs font-medium" style={{ borderColor: 'var(--border-color)' }}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {isLoading ? 'Reading file…' : 'Choose EPUB or HTML file'}
            <input
              type="file"
              accept=".epub,.html,.htm,.xhtml,application/epub+zip,text/html,application/xhtml+xml"
              onChange={(event) => { void handleFile(event); }}
              disabled={isLoading}
              className="sr-only"
            />
          </label>
        </div>

        <div className="flex items-start gap-3 border p-4 text-xs" style={{ borderColor: 'var(--border-color)' }}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p style={{ color: 'var(--text-secondary)' }}>
            Imported text is saved in this browser. Very large works may exceed browser storage limits.
          </p>
        </div>

        {errorMessage && (
          <p role="alert" className="flex items-start gap-2 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMessage}
          </p>
        )}

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
          <a href="https://archiveofourown.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs underline" style={{ color: 'var(--accent)' }}>
            Open AO3 <ExternalLink className="h-3 w-3" />
          </a>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
};
