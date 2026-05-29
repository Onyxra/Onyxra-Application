'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ONYXRA — Landing Gate
 *
 * An epic full-screen entry overlay shown on the main page. The background
 * reacts to pointer movement (mouse hover on desktop, touch-drag on mobile):
 * a glow follows the pointer and the aurora/content shift with subtle parallax.
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
  const gateRef = useRef(null);
  const rafRef = useRef(0);
  const pendingRef = useRef(null);

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

    return () => {
      document.body.classList.remove('onyx-gate-lock');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // --- pointer-reactive background (mouse + touch), rAF-throttled ---
  function applyPointer() {
    rafRef.current = 0;
    const p = pendingRef.current;
    const el = gateRef.current;
    if (!el || !p) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    el.style.setProperty('--gx', p.x + 'px');
    el.style.setProperty('--gy', p.y + 'px');
    el.style.setProperty('--dx', ((p.x / w - 0.5) * 2).toFixed(3));
    el.style.setProperty('--dy', ((p.y / h - 0.5) * 2).toFixed(3));
  }

  function schedule(x, y) {
    pendingRef.current = { x, y };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(applyPointer);
  }

  function onPointerMove(e) {
    schedule(e.clientX, e.clientY);
    const el = gateRef.current;
    if (el && !el.classList.contains('is-pointing')) el.classList.add('is-pointing');
  }

  function onPointerLeave() {
    const el = gateRef.current;
    if (el) el.classList.remove('is-pointing');
  }

  function onPointerUp(e) {
    // For touch/pen, lifting ends the interaction; for mouse, keep glow on hover.
    if (e.pointerType !== 'mouse') {
      const el = gateRef.current;
      if (el) el.classList.remove('is-pointing');
    }
  }

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
      ref={gateRef}
      className={`onyx-gate${phase === 'leaving' ? ' onyx-gate--out' : ''}`}
      role="dialog"
      aria-label="Welcome to Onyxra"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="onyx-gate-bg" aria-hidden="true">
        <span className="onyx-aurora onyx-aurora--a" />
        <span className="onyx-aurora onyx-aurora--b" />
        <span className="onyx-aurora onyx-aurora--c" />
        <span className="onyx-grid" />
        <span className="onyx-cursor-glow" />
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
            <span className="onyx-gate-name">{name}</span>&rsquo;s&nbsp;OS
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
