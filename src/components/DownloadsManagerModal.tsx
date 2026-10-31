import React from 'react';
import { Work } from '../types';
import { X, HardDrive, Trash2, Download, CheckCircle2 } from 'lucide-react';

interface DownloadsManagerModalProps {
  works: Work[];
  onClose: () => void;
}

export const DownloadsManagerModal: React.FC<DownloadsManagerModalProps> = ({
  works,
  onClose,
}) => {
  const downloadedWorks = works.filter((w) => w.isDownloaded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded border shadow-2xl p-6 space-y-6 max-h-[85vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)'
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h2 className="font-serif text-lg font-medium">Offline Storage Manager</h2>
          </div>
          <button onClick={onClose} className="p-1 opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1">
          <p className="text-xs opacity-75">
            These imported files are stored in this browser with the library. Remote downloading and removing only the local chapter content are not implemented yet; removing a work from the library is a separate action.
          </p>

          {downloadedWorks.length === 0 ? (
            <div className="text-center py-12 rounded border border-dashed border-[var(--border-color)]">
              <p className="text-xs opacity-70">No imported local files are currently in your library.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {downloadedWorks.map((work) => (
                <div
                  key={work.id}
                  className="p-3 rounded border flex items-center justify-between gap-4"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                >
                  <div className="space-y-0.5 overflow-hidden">
                    <h3 className="font-serif text-sm font-medium truncate">{work.title}</h3>
                    <p className="text-[11px] opacity-75">by {work.author} • Storage size not measured</p>
                  </div>
                    <span className="text-[11px] opacity-70">Available locally</span>
                  </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
