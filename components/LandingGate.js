'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ONYXRA — Landing Gate
 *
 * A living, JARVIS-style AI orb is the hero. It idles like it's "speaking"
 * (organic blob wobble + a circular voice-waveform), and reacts to the
 * pointer — mouse hover on desktop, touch-drag on mobile: the orb leans
 * toward your pointer, bulges where you point, and ripples when you tap.
 *
 * PRIVACY NOTE: no owner name is rendered or kept in the source — the tagline is
 * a generic "A personal AI". Combined with the site-wide noindex (robots meta +
 * robots.txt + X-Robots-Tag), the workspace stays untied to any identity.
 */

// Frontend passcode gate. Set NEXT_PUBLIC_ONYXRA_PASSCODE in Vercel to change
// it; falls back to a default so the gate works out of the box.
const PASSCODE = (process.env.NEXT_PUBLIC_ONYXRA_PASSCODE || 'onyxra').trim();

export default function LandingGate() {
  const [phase, setPhase] = useState('boot'); // 'boot' | 'show' | 'leaving' | 'hidden'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const gateRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const pendingRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rippleRef = useRef(null); // set inside the canvas effect

  useEffect(() => {
    let unlocked = false;
    try {
      unlocked = localStorage.getItem('onyxra_unlocked') === '1';
    } catch {
      /* storage may be unavailable */
    }
    if (unlocked) {
      setPhase('hidden');
    } else {
      try { setEmail(localStorage.getItem('onyxra_email') || ''); } catch { /* storage may be unavailable */ }
      setPhase('show');
      document.body.classList.add('onyx-gate-lock');
    }
    return () => {
      document.body.classList.remove('onyx-gate-lock');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  // The living AI orb (canvas)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // not shown yet
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = 80; // blob resolution
    const BARS = 64; // voice waveform bars
    let w = 0, h = 0, cx = 0, cy = 0, baseR = 0, rect = null;
    let leanX = 0, leanY = 0, breath = 0;
    const ripples = [];

    rippleRef.current = () => ripples.push({ t: 0 });

    function resize() {
      rect = canvas.getBoundingClientRect();
      w = rect.width || 320;
      h = rect.height || 320;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      baseR = Math.min(w, h) * 0.27;
    }
    resize();
    window.addEventListener('resize', resize);

    const mix = (a, b, t) => Math.round(a + (b - a) * t);
    const C_CYAN = [255, 184, 60];
    const C_VIOL = [224, 123, 21];
    const C_MINT = [255, 96, 50];

    function blob(radius, amp, t, spin, pActive, pAngle, bulge, offX, offY) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = ((i % N) / N) * Math.PI * 2 + spin;
        let r = radius;
        r += Math.sin(a * 3 + t * 1.1) * amp;
        r += Math.sin(a * 5 - t * 1.7) * amp * 0.55;
        r += Math.sin(a * 2 + t * 0.6) * amp * 0.85;
        if (pActive) {
          const d = Math.cos(a - pAngle);
          if (d > 0) r += d * d * d * bulge;
        }
        const x = cx + offX + Math.cos(a) * r;
        const y = cy + offY + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    let startT = performance.now();
    let lastT = startT;

    function frame(now) {
      const t = (now - startT) / 1000;
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      ctx.clearRect(0, 0, w, h);

      // pointer (relative to orb center)
      const p = pointerRef.current;
      let pActive = false, pAngle = 0, relX = 0, relY = 0;
      if (p && p.active && rect) {
        relX = p.x - rect.left - cx;
        relY = p.y - rect.top - cy;
        pActive = true;
        pAngle = Math.atan2(relY, relX);
      }
      const leanTargetX = pActive ? relX * 0.12 : 0;
      const leanTargetY = pActive ? relY * 0.12 : 0;
      const ease = reduced ? 1 : 0.08;
      leanX += (leanTargetX - leanX) * ease;
      leanY += (leanTargetY - leanY) * ease;

      // "talking" envelope — layered noise so it reads like speech
      const talk = reduced
        ? 0.5
        : 0.45 +
          0.3 * (0.5 + 0.5 * Math.sin(t * 2.3)) +
          0.25 * (0.5 + 0.5 * Math.sin(t * 6.1 + 1.3)) * (0.5 + 0.5 * Math.sin(t * 1.7));
      breath += ((reduced ? 0.4 : talk) - breath) * 0.1;

      const amp = baseR * (reduced ? 0.05 : 0.09) * (0.6 + breath);
      const bulge = pActive ? baseR * 0.22 : 0;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 1 — outer halo
      blob(baseR * 1.45, amp * 0.7, t * 0.7, 0, pActive, pAngle, bulge * 0.6, leanX * 0.5, leanY * 0.5);
      let g = ctx.createRadialGradient(cx + leanX, cy + leanY, baseR * 0.2, cx, cy, baseR * 1.7);
      g.addColorStop(0, 'rgba(255,176,46,0.22)');
      g.addColorStop(0.5, 'rgba(224,123,21,0.16)');
      g.addColorStop(1, 'rgba(224,123,21,0)');
      ctx.fillStyle = g;
      ctx.shadowColor = 'rgba(224,123,21,0.55)';
      ctx.shadowBlur = reduced ? 0 : 38;
      ctx.fill();

      // 2 — main body
      blob(baseR, amp, t, 0, pActive, pAngle, bulge, leanX, leanY);
      g = ctx.createRadialGradient(
        cx + leanX - baseR * 0.25,
        cy + leanY - baseR * 0.25,
        baseR * 0.1,
        cx + leanX,
        cy + leanY,
        baseR * 1.25
      );
      g.addColorStop(0, 'rgba(255,228,175,0.95)');
      g.addColorStop(0.35, 'rgba(255,176,46,0.6)');
      g.addColorStop(0.75, 'rgba(224,123,21,0.45)');
      g.addColorStop(1, 'rgba(224,123,21,0.05)');
      ctx.fillStyle = g;
      ctx.shadowColor = 'rgba(255,176,46,0.7)';
      ctx.shadowBlur = reduced ? 0 : 30;
      ctx.fill();

      // 3 — inner counter-rotating layer for depth
      blob(baseR * 0.72, amp * 1.1, -t * 1.2, 0.6, pActive, pAngle, bulge * 0.5, leanX * 1.3, leanY * 1.3);
      g = ctx.createRadialGradient(cx + leanX, cy + leanY, 0, cx + leanX, cy + leanY, baseR);
      g.addColorStop(0, 'rgba(255,250,238,0.9)');
      g.addColorStop(0.5, 'rgba(255,190,90,0.35)');
      g.addColorStop(1, 'rgba(224,123,21,0)');
      ctx.fillStyle = g;
      ctx.shadowBlur = 0;
      ctx.fill();
      ctx.restore();

      // 4 — bright pulsing core
      const coreR = baseR * (0.16 + 0.05 * breath);
      g = ctx.createRadialGradient(cx + leanX, cy + leanY, 0, cx + leanX, cy + leanY, coreR * 2.4);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.4, 'rgba(255,222,165,0.6)');
      g.addColorStop(1, 'rgba(224,123,21,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx + leanX, cy + leanY, coreR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 5 — circular voice waveform ("talking")
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      const wcx = cx + leanX * 0.6;
      const wcy = cy + leanY * 0.6;
      for (let i = 0; i < BARS; i++) {
        const a = (i / BARS) * Math.PI * 2;
        const env =
          (0.5 + 0.5 * Math.sin(i * 0.7 + t * 4.2)) *
          (0.5 + 0.5 * Math.sin(i * 0.27 - t * 2.6));
        const len = baseR * (0.05 + 0.16 * env * (0.5 + breath));
        const r1 = baseR * 1.18;
        const x1 = wcx + Math.cos(a) * r1;
        const y1 = wcy + Math.sin(a) * r1;
        const x2 = wcx + Math.cos(a) * (r1 + len);
        const y2 = wcy + Math.sin(a) * (r1 + len);
        const tt = 0.5 + 0.5 * Math.sin(a * 1.5 + t * 0.8);
        const col = [
          mix(C_CYAN[0], C_VIOL[0], tt),
          mix(C_CYAN[1], C_VIOL[1], tt),
          mix(C_CYAN[2], C_VIOL[2], tt),
        ];
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.25 + 0.55 * env})`;
        ctx.lineWidth = baseR * 0.022;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 6 — HUD arcs (JARVIS rings)
      if (!reduced) {
        ctx.save();
        ctx.strokeStyle = `rgba(${C_MINT[0]},${C_MINT[1]},${C_MINT[2]},0.35)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 1.62, t * 0.5, t * 0.5 + 1.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 1.62, t * 0.5 + Math.PI, t * 0.5 + Math.PI + 0.8);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(224,123,21,0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 1.78, -t * 0.35, -t * 0.35 + 0.6);
        ctx.stroke();
        ctx.restore();
      }

      // 7 — tap ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += dt;
        const rr = baseR * 1.0 + rp.t * 260;
        const al = 0.5 - rp.t * 0.8;
        if (al <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(255,222,165,${al})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      rippleRef.current = null;
    };
  }, [phase]);

  // ── pointer-reactive background + orb (mouse + touch), rAF-throttled ──
  function applyVars() {
    pendingRef.current = null;
    const p = pointerRef.current;
    const el = gateRef.current;
    if (!el) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    el.style.setProperty('--gx', p.x + 'px');
    el.style.setProperty('--gy', p.y + 'px');
    el.style.setProperty('--dx', ((p.x / w - 0.5) * 2).toFixed(3));
    el.style.setProperty('--dy', ((p.y / h - 0.5) * 2).toFixed(3));
  }

  function onPointerMove(e) {
    pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    const el = gateRef.current;
    if (el && !el.classList.contains('is-pointing')) el.classList.add('is-pointing');
    if (!pendingRef.current) pendingRef.current = requestAnimationFrame(applyVars);
  }
  function onPointerDown(e) {
    pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    if (rippleRef.current) rippleRef.current();
    onPointerMove(e);
  }
  function onPointerLeave() {
    pointerRef.current = { ...pointerRef.current, active: false };
    const el = gateRef.current;
    if (el) el.classList.remove('is-pointing');
  }
  function onPointerUp(e) {
    if (e.pointerType !== 'mouse') {
      pointerRef.current = { ...pointerRef.current, active: false };
      const el = gateRef.current;
      if (el) el.classList.remove('is-pointing');
    }
  }

  const buzz = () => { try { if (navigator.vibrate) navigator.vibrate([0, 40, 30, 60]); } catch {} };

  function unlock() {
    try {
      localStorage.setItem('onyxra_email', email.trim());
      localStorage.setItem('onyxra_unlocked', '1');
    } catch {
      /* ignore */
    }
    document.body.classList.remove('onyx-gate-lock');
    setPhase('leaving');
    setTimeout(() => setPhase('hidden'), 750);
  }

  async function enter() {
    if (busy) return;
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setErrMsg('Enter a valid email.');
      buzz();
      return;
    }
    if (!pw) {
      setErrMsg('Enter your password.');
      buzz();
      return;
    }

    setBusy(true);
    setErrMsg('');
    try {
      // Sign in SERVER-SIDE — the Supabase credentials always exist there (the
      // Vercel↔Supabase sync), even if the browser never gets the NEXT_PUBLIC_ vars.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mail, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      setBusy(false);

      if (res.ok && data.ok) { unlock(); return; }

      // Supabase not configured on the server → accept the local passcode so the
      // workspace is never bricked.
      if (data.fallback) {
        if (pw.trim() === PASSCODE) { unlock(); return; }
        setErrMsg('Incorrect passcode — try again.');
        buzz();
        return;
      }

      setErrMsg(data.error || 'Sign-in failed — check your email and password.');
      buzz();
    } catch (e) {
      setBusy(false);
      // Network/route failure → don't lock the user out; allow the passcode.
      if (pw.trim() === PASSCODE) { unlock(); return; }
      setErrMsg('Could not reach the sign-in service.');
      buzz();
    }
  }

  if (phase === 'boot' || phase === 'hidden') return null;

  return (
    <div
      ref={gateRef}
      className={`onyx-gate${phase === 'leaving' ? ' onyx-gate--out' : ''}`}
      role="dialog"
      aria-label="Onyxra"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
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
        <div className="onyx-orb-wrap">
          <canvas ref={canvasRef} className="onyx-orb" aria-hidden="true" />
        </div>

        <h1 className="onyx-gate-word">ONYXRA</h1>

        <div className="onyx-gate-rule" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <p className="onyx-gate-for">
          <span className="onyx-gate-name">A&nbsp;personal&nbsp;AI</span>
        </p>

        <form
          noValidate
          className={`onyx-gate-auth${errMsg ? ' onyx-gate-auth--err' : ''}`}
          onSubmit={(e) => { e.preventDefault(); enter(); }}
        >
          <input
            type="email"
            className="onyx-gate-field"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errMsg) setErrMsg(''); }}
            autoComplete="email"
            inputMode="email"
            aria-label="Email"
            autoFocus
          />
          <input
            type="password"
            className="onyx-gate-field"
            placeholder="Password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); if (errMsg) setErrMsg(''); }}
            autoComplete="current-password"
            aria-label="Password"
          />
          <button type="submit" className="onyx-gate-enter" disabled={busy} aria-busy={busy}>
            <span>{busy ? 'Signing in' : 'Enter'}</span>
            {!busy && (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>

        <p className="onyx-gate-err" role="alert">{errMsg}</p>

        <p className="onyx-gate-foot">Private workspace · Not for public access</p>
      </div>
    </div>
  );
}
