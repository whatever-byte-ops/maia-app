import React, { useState } from 'react';
import { Home, BookOpen, Bookmark, Settings as SettingsIcon, User, Plus, RefreshCw, Smartphone, CheckCircle } from 'lucide-react';

interface NavigationProps {
  activeTab: 'home' | 'reading' | 'notebook' | 'settings';
  setActiveTab: (tab: 'home' | 'reading' | 'notebook' | 'settings') => void;
  accountEmail: string | null;
  onOpenAccount: () => void;
  onOpenImport: () => void;
  onOpenSync: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  accountEmail,
  onOpenAccount,
  onOpenImport,
  onOpenSync
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Header Bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 border-b transition-colors"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-serif font-bold text-lg border transition-transform group-hover:scale-105"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-main)',
                borderColor: 'var(--border-color)'
              }}
            >
              M
            </div>
            <div>
              <span className="font-serif text-lg tracking-wide font-medium">Maia</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                AO3 Reading Companion
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenImport}
            aria-label="Import a work"
            className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-all hover:opacity-90 sm:min-w-0"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg-main)',
              borderColor: 'var(--border-color)'
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Work</span>
          </button>

          {/* Profile Button & Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label={accountEmail ? `Account menu for ${accountEmail}` : 'Open account menu'}
              aria-expanded={profileMenuOpen}
              className="flex items-center gap-2 p-1 rounded border transition-colors hover:opacity-90"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-color)'
              }}
            >
              <span className="flex h-7 w-7 items-center justify-center border text-xs font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}>
                {accountEmail?.slice(0, 1).toUpperCase() ?? <User />}
              </span>
              <span className="hidden md:inline text-xs font-medium pr-1" style={{ color: 'var(--text-main)' }}>
                {accountEmail?.split('@')[0] ?? 'Local profile'}
              </span>
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-72 rounded border shadow-xl z-50 p-3 space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                >
                  <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="flex h-10 w-10 items-center justify-center border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}>
                      {accountEmail?.slice(0, 1).toUpperCase() ?? <User />}
                    </span>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">{accountEmail ? 'Signed in' : 'Local profile'}</p>
                      <p className="text-xs truncate opacity-80">{accountEmail ?? 'Data stored on this device'}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between py-1.5 px-2 rounded" style={{ backgroundColor: 'var(--bg-main)' }}>
                      <span className="flex items-center gap-1.5 opacity-90">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Account
                      </span>
                      <span className="font-medium">{accountEmail ? 'Connected' : 'Local only'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded" style={{ backgroundColor: 'var(--bg-main)' }}>
                      <span className="flex items-center gap-1.5 opacity-90">
                        <Smartphone className="w-3.5 h-3.5" />
                        Connected Devices
                      </span>
                      <span className="font-medium">Cloud sync off</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-1" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenAccount();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-main)' }}
                    >
                      <User className="w-3.5 h-3.5" />
                      {accountEmail ? 'Manage Account' : 'Sign in or Create Account'}
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenSync();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-main)' }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync Information
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setActiveTab('settings');
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-main)' }}
                    >
                      <SettingsIcon className="w-3.5 h-3.5" />
                      App Settings & Themes
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar (EXACTLY 4 tabs in required order) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-2 shadow-lg transition-colors sm:px-8"
        style={{
          height: 'calc(4rem + var(--safe-area-bottom))',
          paddingBottom: 'var(--safe-area-bottom)',
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)'
        }}
      >
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'home' ? 'font-semibold' : 'opacity-70 hover:opacity-100'
          }`}
          style={{ color: activeTab === 'home' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('reading')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'reading' ? 'font-semibold' : 'opacity-70 hover:opacity-100'
          }`}
          style={{ color: activeTab === 'reading' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide">Reading</span>
        </button>

        <button
          onClick={() => setActiveTab('notebook')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'notebook' ? 'font-semibold' : 'opacity-70 hover:opacity-100'
          }`}
          style={{ color: activeTab === 'notebook' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <Bookmark className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide">Notebook</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'settings' ? 'font-semibold' : 'opacity-70 hover:opacity-100'
          }`}
          style={{ color: activeTab === 'settings' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <SettingsIcon className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide">Settings</span>
        </button>
      </nav>
    </>
  );
};
