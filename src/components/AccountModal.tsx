import React, { useState } from 'react';
import { LockKeyhole, Trash2, X } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured, supabaseConfigurationError } from '../services/supabase';

interface AccountModalProps {
  email: string | null;
  deletionRequest: boolean;
  onClose: () => void;
  onSignedOut: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ email, deletionRequest, onClose, onSignedOut }) => {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [formEmail, setFormEmail] = useState(email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error('Account service is not configured.');

      if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: formEmail.trim(),
          password
        });
        if (authError) throw authError;
        if (!data.session) {
          setMessage('Check your email to confirm your account, then return here to sign in.');
        } else {
          if (!deletionRequest) onClose();
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: formEmail.trim(),
          password
        });
        if (authError) throw authError;
        if (!deletionRequest) onClose();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Account request failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setError('');
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error('Account service is not configured.');

      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      onSignedOut();
      onClose();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Sign out failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error('Account service is not configured.');

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (authError) throw new Error('Password confirmation failed. Check your password and try again.');

      const { error: deletionError } = await supabase.functions.invoke('delete-account');
      if (deletionError) {
        let detail = deletionError.message;
        if (deletionError.context instanceof Response) {
          const responseBody: unknown = await deletionError.context.json();
          if (responseBody && typeof responseBody === 'object'
            && 'error' in responseBody && typeof responseBody.error === 'string') {
            detail = responseBody.error;
          }
        }
        throw new Error(detail);
      }

      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      onSignedOut();
      onClose();
    } catch (deletionError) {
      setError(deletionError instanceof Error ? deletionError.message : 'Account deletion failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        className="w-full max-w-md space-y-5 border p-5 shadow-xl"
        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
          <h2 id="account-modal-title" className="font-serif text-lg">
            {email ? 'Account' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close account dialog" className="p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium">Account service is unavailable.</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {supabaseConfigurationError} Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment after creating a Supabase project.
              Local library data remains on this device; no account or cloud sync is active yet.
            </p>
          </div>
        ) : email ? (
          <div className="space-y-4">
            <p className="text-sm">{email}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Your library stays on this device unless you sync it. Open Settings → Synchronization & Backup → Sync now to copy your works and notes to your account. Anyone with access to this device profile can access local library data.
            </p>
            <button type="button" disabled={busy} onClick={signOut} className="border px-4 py-2 text-sm disabled:opacity-50" style={{ borderColor: 'var(--border-color)' }}>
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
            {!confirmingDeletion ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => { setConfirmingDeletion(true); setError(''); setPassword(''); }}
                className="flex items-center gap-2 border px-4 py-2 text-sm text-rose-400 disabled:opacity-50"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Trash2 className="h-4 w-4" />
                Delete account
              </button>
            ) : (
              <form onSubmit={deleteAccount} className="space-y-3 border p-4" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm font-medium">Permanently delete this account?</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Your account and cloud-synced library data will be deleted. Works and notes stored only on this device will remain.
                </p>
                <label className="block space-y-1 text-xs">
                  <span>Confirm your password</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </label>
                {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
                <div className="flex flex-wrap gap-3">
                  <button type="button" disabled={busy} onClick={() => setConfirmingDeletion(false)} className="border px-4 py-2 text-sm disabled:opacity-50" style={{ borderColor: 'var(--border-color)' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={busy} className="px-4 py-2 text-sm text-white disabled:opacity-50" style={{ backgroundColor: '#b42335' }}>
                    {busy ? 'Deleting…' : 'Permanently delete account'}
                  </button>
                </div>
              </form>
            )}
            {error && !confirmingDeletion && <p role="alert" className="text-xs text-rose-400">{error}</p>}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1 text-xs">
              <span>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                className="w-full border px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              />
              <span className="block opacity-70">Use at least 8 characters.</span>
            </label>

            {message && <p role="status" className="text-xs text-emerald-500">{message}</p>}
            {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setError(''); setMessage(''); }} className="text-xs underline">
                {mode === 'sign-up' ? 'Already have an account? Sign in' : 'Create an account'}
              </button>
              <button type="submit" disabled={busy} className="flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-main)' }}>
                <LockKeyhole className="h-4 w-4" />
                {busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
