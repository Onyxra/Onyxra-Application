'use client';

import { useEffect, useState } from 'react';

/**
 * ONYXRA — Landing Gate
 *
 * An epic full-screen entry overlay shown on the main page.
 *
 * PRIVACY NOTE: the owner's name is injected CLIENT-SIDE ONLY (after mount),
 * so it is never present in the server-rendered HTML, the page source, or
 * anything a non-JS scraper/crawler could read. Combined with the site-wide
 * noindex (robots meta + robots.txt + X-Robots-Tag), the name stays untied
 * to this site for search engines and simple scrapers.
 */
const OWNER_NAME = 'Koltyn Parsons';

export default function LandingGate() {
  // boot = nothing rendered yet (also the SSR state, so no name in source)
  const [phase, setPhase] = useState('boot'); // 'boot' | 'show' | 'leaving' | 'hidden'
  const [name, setName] = useState('');

  useEffect(() => {
    let entered = false;
    try {
      entered = sessionStorage.getItem('onyxra_entered') === '1';
    } catch {
      /* sessionStorage may be unavailable */
    }

    if (entered) {
      setPhase('hidden');
    } else {
      setName(OWNER_NAME); // client-only injection
      setPhase('show');
      document.body.classList.add('onyx-gate-lock');
    }

    return () => document.body.classList.remove('onyx-gate-lock');
  }, []);

  function enter() {
    try {
      sessionStorage.setItem('onyxra_entered', '1');
    } catch {
      /* ignore */
    }
    document.body.classList.remove('onyx-gate-lock');
    setPhase('leaving');
    setTimeout(() => setPhase('hidden'), 750); // match CSS transition
  }

  if (phase === 'boot' || phase === 'hidden') return null;

  return (
    <div
      className={`onyx-gate${phase === 'leaving' ? ' onyx-gate--out' : ''}`}
      role="dialog"
      aria-label="Welcome to Onyxra"
    >
      <div className="onyx-gate-bg" aria-hidden="true">
        <span className="onyx-aurora onyx-aurora--a" />
        <span className="onyx-aurora onyx-aurora--b" />
        <span className="onyx-aurora onyx-aurora--c" />
        <span className="onyx-grid" />
        <span className="onyx-vignette" />
      </div>

      <div className="onyx-gate-content">
        <div className="onyx-gate-mark">
          <span className="onyx-mark-glow" aria-hidden="true" />
          <svg viewBox="0 0 64 64" width="78" height="78" className="onyx-mark-svg" aria-hidden="true">
            <defs>
              <linearGradient id="onyxGateGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4fc3f7" />
                <stop offset="100%" stopColor="#7c6af7" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="58" height="58" rx="16" fill="none" stroke="url(#onyxGateGrad)" strokeWidth="2.5" opacity="0.55" />
            <text x="32" y="44" textAnchor="middle" fill="url(#onyxGateGrad)" fontSize="38" fontWeight="700" fontFamily="Rajdhani, sans-serif">O</text>
          </svg>
        </div>

        <h1 className="onyx-gate-word">ONYXRA</h1>

        <div className="onyx-gate-rule" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <p className="onyx-gate-tag">
          An incredible life operating system
          <br />
          &amp; personal AI assistant
        </p>

        {name && (
          <p className="onyx-gate-for">
            crafted for <span className="onyx-gate-name">{name}</span>
          </p>
        )}

        <button type="button" className="onyx-gate-enter" onClick={enter}>
          <span>Enter Onyxra</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        <p className="onyx-gate-foot">Private workspace · Not for public access</p>
      </div>
    </div>
  );
}
