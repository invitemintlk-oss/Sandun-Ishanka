import React, { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Link2, Copy, MessageSquareText, Heart, ExternalLink } from 'lucide-react';
import {
  WEDDING,
  PREFIXES,
  PrefixKey,
  buildDisplayName,
  buildGreeting,
  buildInviteLink,
  buildInviteMessage,
  normalizeName,
} from '../lib/wedding';

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers / non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export const AdminPage: React.FC = () => {
  const [prefix, setPrefix] = useState<PrefixKey>('mr');
  const [guestName, setGuestName] = useState('');
  const [generated, setGenerated] = useState<{ link: string; displayName: string } | null>(null);

  const baseUrl = window.location.origin;
  const message = useMemo(
    () => (generated ? buildInviteMessage(generated.displayName, generated.link) : ''),
    [generated]
  );

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = normalizeName(guestName);
    if (!name) {
      toast.error('Please enter a guest name');
      return;
    }
    setGenerated({
      link: buildInviteLink(baseUrl, prefix, name),
      displayName: buildDisplayName(prefix, name),
    });
  };

  const handleCopyLink = async () => {
    if (!generated) return;
    await copyText(generated.link);
    toast.success('Link copied!');
  };

  const handleCopyMessage = async () => {
    if (!generated) return;
    await copyText(message);
    toast.success('Message copied!');
  };

  const inputCls =
    'w-full bg-white px-5 py-3.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-mocha/40 outline-none transition text-brand-mocha text-base';
  const labelCls = 'block text-[10px] uppercase tracking-[0.2em] font-bold text-brand-sand mb-2';
  const btnBase =
    'flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[11px] uppercase tracking-[0.2em] font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';

  return (
    <div className="min-h-screen bg-brand-champagne font-sans text-brand-mocha px-4 py-10 sm:py-16">
      <Toaster position="top-center" />

      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <Heart className="w-6 h-6 mx-auto mb-4 text-brand-gold fill-brand-gold/20" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            {WEDDING.groomName} & {WEDDING.brideName}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-brand-sand">Invitation Link Generator</p>
        </header>

        <form
          onSubmit={handleGenerate}
          className="bg-white/80 rounded-2xl border border-brand-gold/20 shadow-[0_20px_40px_rgba(197,160,89,0.12)] p-6 sm:p-8 space-y-5"
        >
          <div className="grid sm:grid-cols-[180px_1fr] gap-4">
            <div>
              <label htmlFor="prefix" className={labelCls}>Prefix</label>
              <select
                id="prefix"
                className={`${inputCls} cursor-pointer`}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value as PrefixKey)}
              >
                {PREFIXES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="guestName" className={labelCls}>Guest Name</label>
              <input
                id="guestName"
                type="text"
                placeholder="e.g. Sanjaya"
                autoComplete="off"
                maxLength={80}
                className={inputCls}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 pt-1">
            <button type="submit" className={`${btnBase} bg-brand-mocha text-brand-champagne hover:bg-brand-mocha/90 shadow-md`}>
              <Link2 className="w-4 h-4" /> Generate Link
            </button>
            <button
              type="button"
              disabled={!generated}
              onClick={handleCopyLink}
              className={`${btnBase} bg-white border border-brand-gold/40 hover:bg-brand-gold/10`}
            >
              <Copy className="w-4 h-4" /> Copy Link Only
            </button>
            <button
              type="button"
              disabled={!generated}
              onClick={handleCopyMessage}
              className={`${btnBase} bg-white border border-brand-gold/40 hover:bg-brand-gold/10`}
            >
              <MessageSquareText className="w-4 h-4" /> Copy Full Message
            </button>
          </div>
        </form>

        {generated && (
          <section className="mt-8 space-y-6">
            <div className="bg-white/80 rounded-2xl border border-brand-gold/20 p-6">
              <p className={labelCls}>Greeting</p>
              <p className="font-serif text-2xl">{buildGreeting(generated.displayName)}</p>
              <p className="mt-3 text-sm text-brand-sand font-serif italic">
                On the invitation: “We cordially invite <span className="not-italic font-semibold text-brand-mocha">{generated.displayName}</span> to celebrate our special day with us.”
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl border border-brand-gold/20 p-6">
              <p className={labelCls}>Generated Link</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 min-w-0 break-all text-sm bg-brand-champagne/60 rounded-lg px-4 py-3 border border-brand-gold/20">
                  {generated.link}
                </code>
                <a
                  href={generated.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open invitation"
                  className="flex-none p-3 rounded-lg border border-brand-gold/30 hover:bg-brand-gold/10"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl border border-brand-gold/20 p-6">
              <p className={labelCls}>Full Message Preview</p>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-brand-mocha">{message}</pre>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
