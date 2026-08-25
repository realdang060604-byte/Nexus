'use client';

import { FormEvent, useState } from 'react';
import { login } from '@/lib/api';

export default function OwnerLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    try { await login(password); onSuccess(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể đăng nhập'); }
    finally { setLoading(false); }
  };

  return <main className="grid min-h-screen place-items-center px-4 text-white">
    <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950/80 p-7 shadow-2xl">
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-emerald-400 font-black text-zinc-950">N</div>
      <h1 className="text-2xl font-semibold">Mở NEXUS</h1>
      <p className="mt-2 text-sm text-zinc-500">Dashboard cá nhân được bảo vệ bằng mật khẩu chủ sở hữu.</p>
      <input type="password" autoFocus required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-400" />
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button disabled={loading} className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-zinc-950 disabled:opacity-50">{loading ? 'Đang mở...' : 'Đăng nhập'}</button>
    </form>
  </main>;
}
