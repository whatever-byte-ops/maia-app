import React from 'react';
import type { Work } from '../types';
import { SourceIndicator } from './SharedComponents';
import { X, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface ImportPreviewModalProps {
  previewWork: Work;
  onClose: () => void;
  onConfirmSave: (work: Work) => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  previewWork,
  onClose,
  onConfirmSave
}) => {
  const handleConfirm = () => {
    onConfirmSave(previewWork);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-2xl rounded border shadow-2xl p-6 space-y-6 max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)'
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded border border-[#514852] bg-[#242126] text-[var(--accent)] font-medium">
              Import Preview
            </span>
            <SourceIndicator sourceType={previewWork.sourceType || 'Live AO3'} snapshotDate={previewWork.snapshotDate} />
          </div>
          <button onClick={onClose} className="p-1 opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <h1 className="font-serif text-2xl font-medium mb-1">{previewWork.title}</h1>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>by {previewWork.author}</p>
          </div>

          <p className="text-xs leading-relaxed opacity-90" style={{ color: 'var(--text-secondary)' }}>
            {previewWork.summary}
          </p>

          <div className="grid grid-cols-3 gap-3 p-3 rounded border text-xs" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
            <div>
              <span className="opacity-60 block">Word Count</span>
              <span className="font-medium">{previewWork.wordCount.toLocaleString()} words (parsed)</span>
            </div>
            <div>
              <span className="opacity-60 block">Chapters</span>
              <span className="font-medium">{previewWork.chapterCount}</span>
            </div>
            <div>
              <span className="opacity-60 block">Rating</span>
              <span className="font-medium">{previewWork.rating}</span>
            </div>
          </div>

          <div className="space-y-3">
            {([
              ['Fandoms', previewWork.fandoms],
              ['Relationships', previewWork.pairings],
              ['Characters', previewWork.characters],
              ['Additional tags', previewWork.tags],
              ['Warnings', previewWork.warnings]
            ] as const).map(([label, values]) => values.length > 0 && (
              <div key={label} className="space-y-1">
                <span className="text-xs font-medium opacity-75">{label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {values.map((value, index) => (
                    <span key={`${label}-${index}`} className="text-[11px] px-2 py-0.5 rounded border border-[#514852] opacity-90">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-xs opacity-75">Imported text will be stored on this device.</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-xs border border-[var(--border-color)]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 rounded text-xs font-medium"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}
            >
              <Check className="w-3.5 h-3.5" />
              Save to Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
