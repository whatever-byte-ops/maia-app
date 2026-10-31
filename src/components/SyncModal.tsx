import React from 'react';
import { X, RefreshCw, Smartphone, CloudOff, Cloud } from 'lucide-react';

interface SyncModalProps {
  accountEmail: string | null;
  syncing: boolean;
  syncError: string;
  syncMessage: string;
  onSyncNow: () => void;
  onOpenAccount: () => void;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  accountEmail,
  syncing,
  syncError,
  syncMessage,
  onSyncNow,
  onOpenAccount,
  onClose
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
      className="w-full max-w-lg space-y-6 border p-5 shadow-xl"
      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
    >
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <h2 id="sync-modal-title" className="font-serif text-lg">Accounts & synchronization</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close synchronization dialog" className="p-2">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 border p-4" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
          <CloudOff className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--text-secondary)' }} />
          <div className="space-y-1">
            <p className="text-sm font-medium">{accountEmail ? 'Signed in; sync your library to your account' : 'Local storage only'}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {accountEmail
                ? `Authenticated as ${accountEmail}. Sync combines works and notes from this device and your cloud library. If the same item exists in both, this device's copy wins.`
                : 'Your library and notes are stored in this browser on this device. Sign in to sync them with your account.'}
            </p>
          </div>
        </div>

        {syncError && <p role="alert" className="border border-rose-700/50 bg-rose-900/20 px-3 py-2 text-xs text-rose-200">{syncError}</p>}
        {syncMessage && <p role="status" className="border border-emerald-700/50 bg-emerald-900/20 px-3 py-2 text-xs text-emerald-200">{syncMessage}</p>}

        <div className="border p-4" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Smartphone className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            How sync works
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Sync is manual. Press Sync now on each device after making changes. Works and notes from both copies are kept; this device wins when IDs match. Reader preferences use this device's values. Deletions do not sync yet and may reappear from another device.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
        {!accountEmail && (
          <button type="button" onClick={onOpenAccount} className="border px-4 py-2 text-xs" style={{ borderColor: 'var(--border-color)' }}>
            Sign in or create account
          </button>
        )}
        {accountEmail && (
          <button type="button" disabled={syncing} onClick={onSyncNow} className="flex items-center gap-2 px-4 py-2 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}>
            <Cloud className="h-4 w-4" />
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        )}
        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}>
          Close
        </button>
      </div>
    </section>
  </div>
);
