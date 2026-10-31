import React, { useState } from 'react';
import { ThemePreset, ReaderSettings, Work } from '../types';
import { Palette, Type, Volume2, HardDrive, RefreshCw, Shield, Download, User, Check, RotateCcw, Lock, FileJson, FileText, Trash2, Smartphone } from 'lucide-react';

interface SettingsTabProps {
  currentTheme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
  readerSettings: ReaderSettings;
  setReaderSettings: React.Dispatch<React.SetStateAction<ReaderSettings>>;
  authEmail: string | null;
  works: Work[];
  onOpenDownloads: () => void;
  onOpenSync: () => void;
  onOpenAccount: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentTheme,
  setTheme,
  readerSettings,
  setReaderSettings,
  authEmail,
  works,
  onOpenDownloads,
  onOpenSync,
  onOpenAccount
}) => {
  const [activeSection, setActiveSection] = useState<'appearance' | 'typography' | 'downloads' | 'sync' | 'account'>('appearance');


  const themes: { id: ThemePreset; name: string; description: string; colors: string[] }[] = [
    { id: 'rose-noir', name: 'Rose Noir', description: 'Charcoal & dusty pink (default theme)', colors: ['#0A0A0C', '#161619', '#D49AB5', '#F1E8EF'] },
    { id: 'midnight-blue', name: 'Midnight Blue', description: 'Cool dark blue-gray for low-glare reading', colors: ['#080A0E', '#131720', '#91B9E8', '#E8EDF5'] },
    { id: 'soft-light', name: 'Soft Light', description: 'Warm alabaster parchment for daytime reading', colors: ['#F7F4F0', '#FFFFFF', '#C27D99', '#332B30'] },
    { id: 'warm-sepia', name: 'Warm Sepia', description: 'Paper and ink warmth for prolonged sessions', colors: ['#1C1A19', '#2C2725', '#C8B8A6', '#F0E7DC'] }
  ];

  const downloadedCount = works.filter((w) => w.isDownloaded && !w.isSampleData).length;
  const totalWordsRead = works.reduce((acc, w) => acc + Math.round((w.wordCount * w.readingProgress) / 100), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-24">
      {/* Header */}
      <div className="pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h1 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-main)' }}>
          Settings & Reading Preferences
        </h1>
        <p className="text-xs opacity-75" style={{ color: 'var(--text-secondary)' }}>
          Configure appearance, reading typography, accessibility, storage, and reader account management.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation Sidebar */}
        <div className="space-y-1 lg:col-span-1">
          <button
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-left transition-colors ${
              activeSection === 'appearance' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'hover:opacity-80'
            }`}
            style={{ backgroundColor: activeSection === 'appearance' ? 'var(--accent)' : 'var(--bg-elevated)', color: activeSection === 'appearance' ? 'var(--bg-main)' : 'var(--text-main)' }}
          >
            <Palette className="w-4 h-4" />
            Appearance & Themes
          </button>
          <button
            onClick={() => setActiveSection('typography')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-left transition-colors ${
              activeSection === 'typography' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'hover:opacity-80'
            }`}
            style={{ backgroundColor: activeSection === 'typography' ? 'var(--accent)' : 'var(--bg-elevated)', color: activeSection === 'typography' ? 'var(--bg-main)' : 'var(--text-main)' }}
          >
            <Type className="w-4 h-4" />
            Reader Typography & Accessibility
          </button>
          <button
            onClick={() => setActiveSection('downloads')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-left transition-colors ${
              activeSection === 'downloads' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'hover:opacity-80'
            }`}
            style={{ backgroundColor: activeSection === 'downloads' ? 'var(--accent)' : 'var(--bg-elevated)', color: activeSection === 'downloads' ? 'var(--bg-main)' : 'var(--text-main)' }}
          >
            <HardDrive className="w-4 h-4" />
            Downloads & Offline Storage
          </button>
          <button
            onClick={() => setActiveSection('sync')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-left transition-colors ${
              activeSection === 'sync' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'hover:opacity-80'
            }`}
            style={{ backgroundColor: activeSection === 'sync' ? 'var(--accent)' : 'var(--bg-elevated)', color: activeSection === 'sync' ? 'var(--bg-main)' : 'var(--text-main)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Synchronization & Backup
          </button>
          <button
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-left transition-colors ${
              activeSection === 'account' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'hover:opacity-80'
            }`}
            style={{ backgroundColor: activeSection === 'account' ? 'var(--accent)' : 'var(--bg-elevated)', color: activeSection === 'account' ? 'var(--bg-main)' : 'var(--text-main)' }}
          >
            <User className="w-4 h-4" />
            Reader Account Management
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'appearance' && (
            <div className="space-y-6 rounded border p-6" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="font-serif text-lg font-medium mb-1">Theme Presets</h2>
                <p className="text-xs opacity-75">Select a calibrated theme preset. Theme updates apply instantly across the entire application.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`rounded border p-4 cursor-pointer transition-all ${
                      currentTheme === t.id ? 'ring-2 ring-[var(--accent)] border-transparent' : 'hover:border-[var(--accent)]'
                    }`}
                    style={{ backgroundColor: t.colors[0], color: t.colors[3], borderColor: t.colors[1] }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif font-medium text-base">{t.name}</h3>
                      {currentTheme === t.id && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--accent)] text-[var(--bg-main)]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-80 mb-4">{t.description}</p>
                    <div className="flex items-center gap-2">
                      {t.colors.map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded border border-white/20 shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Independent Reader Background */}
              <div className="pt-6 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-serif text-base font-medium">Independent Reader Background</h3>
                <p className="text-xs opacity-75">Customize the story reading surface independently from the main interface.</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'match-theme', label: 'Match Theme' },
                    { id: 'dark', label: 'Dark Charcoal' },
                    { id: 'light', label: 'Alabaster' },
                    { id: 'sepia', label: 'Sepia Parchment' },
                    { id: 'cream', label: 'Warm Cream' },
                    { id: 'navy', label: 'Twilight Navy' }
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setReaderSettings((prev) => ({ ...prev, readerBackground: bg.id as any }))}
                      className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                        readerSettings.readerBackground === bg.id
                          ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium border-transparent'
                          : 'border-[var(--border-color)] opacity-80'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'typography' && (
            <div className="space-y-6 rounded border p-6" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="font-serif text-lg font-medium mb-1">Reader Typography & Dyslexia Support</h2>
                <p className="text-xs opacity-75">Tailor font families, spacing, line height, and content width for prolonged reading comfort.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2">Font Family</label>
                  <select
                    value={readerSettings.fontFamily}
                    onChange={(e) => setReaderSettings((prev) => ({ ...prev, fontFamily: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded text-xs border outline-none"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="System">System default</option>
                    <option value="Merriweather">Merriweather (Classic Serif)</option>
                    <option value="Georgia">Georgia (Traditional Screen Serif)</option>
                    <option value="Inter">Inter (Clean Sans-Serif)</option>
                    <option value="OpenDyslexic">OpenDyslexic (if installed; otherwise system sans-serif)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2">Font Size: {readerSettings.fontSize}px</label>
                    <input
                      type="range"
                      min="14"
                      max="26"
                      value={readerSettings.fontSize}
                      onChange={(e) => setReaderSettings((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2">Line Height: {readerSettings.lineHeight}</label>
                    <input
                      type="range"
                      min="1.4"
                      max="2.4"
                      step="0.1"
                      value={readerSettings.lineHeight}
                      onChange={(e) => setReaderSettings((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))}
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">Content Max Width</label>
                  <div className="flex flex-wrap gap-2">
                    {['600px', '700px', '800px', '950px'].map((w) => (
                      <button
                        key={w}
                        onClick={() => setReaderSettings((prev) => ({ ...prev, contentWidth: w as any }))}
                        className={`px-3 py-1.5 rounded text-xs border ${
                          readerSettings.contentWidth === w ? 'bg-[var(--accent)] text-[var(--bg-main)] font-medium border-transparent' : 'border-[var(--border-color)]'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setReaderSettings({ fontFamily: 'Merriweather', fontSize: 18, lineHeight: 1.75, letterSpacing: 0, paragraphSpacing: 16, contentWidth: '700px', alignment: 'left', readerBackground: 'match-theme' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-[var(--border-color)] hover:opacity-80"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Typography Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'downloads' && (
            <div className="space-y-6 rounded border p-6" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="font-serif text-lg font-medium mb-1">Downloads & Offline Storage</h2>
                <p className="text-xs opacity-75">Manage works imported from local HTML files. Remote downloads are not available yet.</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="font-medium text-sm">Offline Storage Status</p>
                  <p className="text-xs opacity-75">{downloadedCount} imported works stored locally (storage size not measured)</p>
                </div>
                <button
                  onClick={onOpenDownloads}
                  className="px-4 py-2 rounded text-xs font-medium border"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                >
                  Manage Downloads
                </button>
              </div>
            </div>
          )}

          {activeSection === 'sync' && (
            <div className="space-y-6 rounded border p-6" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="font-serif text-lg font-medium mb-1">Synchronization & Backup</h2>
                <p className="text-xs opacity-75">Manually merge your works and annotations with your Supabase account.</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="font-medium text-sm">{authEmail ? 'Manual cloud sync is available' : 'Sign in to sync your library'}</p>
                  <p className="text-xs opacity-75">{authEmail ? `Signed in as ${authEmail}. Sync changes from this device when you choose Sync now.` : 'Your library stays on this device until you sign in and sync.'}</p>
                </div>
                <button
                  onClick={onOpenSync}
                  className="px-4 py-2 rounded text-xs font-medium border"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                >
                  {authEmail ? 'Sync now' : 'Sync settings'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-6 rounded border p-6" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="font-serif text-lg font-medium mb-1">Reader Account Management</h2>
                <p className="text-xs opacity-75">Manage your reader account. This account is separate from your AO3 account.</p>
              </div>

              <div className="space-y-3 border p-4" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                <p className="text-sm font-medium">{authEmail ?? 'No account is signed in'}</p>
                <p className="text-xs opacity-75">
                  {authEmail
                    ? 'Your Supabase account is authenticated. Library data remains on this device until you manually sync. Local data may be visible to anyone using this browser profile.'
                    : 'Local data is not linked to an account. Sign-in alone does not upload or merge your library.'}
                </p>
                <button onClick={onOpenAccount} className="px-4 py-2 text-xs font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}>
                  {authEmail ? 'Manage Account' : 'Sign in or Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
