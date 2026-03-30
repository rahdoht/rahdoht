"use client";

import { useRef, useEffect } from "react";
import { createNoise2D } from "simplex-noise";
import { bezierPoint } from "@/lib/smokeGeometry";

interface SmokeTextProps {
  text: string;
}

const FONT_SIZE = 20;
const FONT = `${FONT_SIZE}px 'EB Garamond', Georgia, serif`;
const EMIT_RATE = 0.065;  // seconds between char emissions
const RISE_SPEED = 0.075; // t-units per second at base
const WISP_RATE = 0.1;
const PARTICLE_RATE = 0.04;

interface Char {
  ch: string;
  t: number;
  seed: number;
  xOff: number;
  sizeJitter: number;
}

interface Wisp {
  t: number;
  seed: number;
  size: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  size: number;
  seed: number;
}

export function SmokeText({ text }: SmokeTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef(text);

  useEffect(() => { textRef.current = text; }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom — no canvas support
    const noise2D = createNoise2D();

    let W = 0, H = 0, dpr = 1;
    let animId = 0, lastTime = 0;
    let emitAccum = 0, emitIndex = 0;
    let wispAccum = 0, particleAcc = 0;

    const chars: Char[] = [];
    const wisps: Wisp[] = [];
    const particles: Particle[] = [];

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const tx = () => W * 0.5;
    const ty = () => H * 0.75;

    function smokeSpline(time: number) {
      const x = tx(), y = ty();
      return {
        p0: { x, y },
        p1: { x: x + noise2D(time * 0.12, 0.0) * 55,   y: y - H * 0.20 },
        p2: { x: x + noise2D(time * 0.09, 3.7) * 110,  y: y - H * 0.45 },
        p3: { x: x + noise2D(time * 0.07, 7.3) * 150,  y: y - H * 0.75 },
      };
    }

    function wispSpline(time: number) {
      const x = tx(), y = ty();
      return {
        p0: { x: x + 2, y },
        p1: { x: x - noise2D(time * 0.14 + 50, 1.2) * 40,  y: y - H * 0.15 },
        p2: { x: x - noise2D(time * 0.10 + 50, 5.5) * 80,  y: y - H * 0.38 },
        p3: { x: x - noise2D(time * 0.08 + 50, 9.1) * 120, y: y - H * 0.68 },
      };
    }

    function emitChar() {
      const t = textRef.current;
      if (!t.length) return;
      chars.push({
        ch: t[emitIndex++ % t.length],
        t: 0,
        seed: Math.random() * 1000,
        xOff: (Math.random() - 0.5) * 3,
        sizeJitter: 0.9 + Math.random() * 0.2,
      });
    }

    function drawCigarette(time: number) {
      const x = tx(), y = ty();
      const len = 110, w = 8, filterLen = 28;

      const pulse = 0.15 + 0.06 * Math.sin(time * 1.8);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 35);
      glow.addColorStop(0,   `rgba(210, 90, 30, ${pulse})`);
      glow.addColorStop(0.5, `rgba(180, 60, 20, ${pulse * 0.3})`);
      glow.addColorStop(1,   "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 50, y - 50, 100, 100);

      ctx.fillStyle = "#e8e0d0";
      ctx.fillRect(x - w / 2, y, w, len - filterLen);

      ctx.fillStyle = "#c4a46a";
      ctx.fillRect(x - w / 2, y + len - filterLen, w, filterLen);
      ctx.fillStyle = "#b8944e";
      ctx.fillRect(x - w / 2, y + len - filterLen, w, 2);

      ctx.fillStyle = "#5a5550";
      ctx.fillRect(x - w / 2 - 0.5, y - 3, w + 1, 5);

      const cg = ctx.createLinearGradient(x, y - 3, x, y + 2);
      cg.addColorStop(0,   "#c44a20");
      cg.addColorStop(0.5, "#e86830");
      cg.addColorStop(1,   "#5a5550");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(x, y - 1, w / 2 + 1, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(ts: number) {
      const time = ts * 0.001;
      const dt = lastTime ? Math.min(time - lastTime, 0.05) : 0.016;
      lastTime = time;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0807";
      ctx.fillRect(0, 0, W, H);

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.15, W / 2, H * 0.45, H * 0.85);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // Ambient particles
      particleAcc += dt;
      while (particleAcc > PARTICLE_RATE) { particleAcc -= PARTICLE_RATE; particles.push({
        x: tx() + (Math.random() - 0.5) * 6, y: ty() - 2,
        vx: (Math.random() - 0.5) * 0.4, vy: -(0.2 + Math.random() * 0.6),
        life: 1.0, size: 0.5 + Math.random() * 2, seed: Math.random() * 100,
      }); }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 0.12;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx + noise2D(p.y * 0.008, p.seed) * 0.9;
        p.y += p.vy;
        p.vy *= 0.998;
        p.size += dt * 0.25;
        const a = p.life * p.life * 0.08;
        if (a < 0.002) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170,162,148,${a})`;
        ctx.fill();
      }

      // Wisps
      const wSp = wispSpline(time);
      wispAccum += dt;
      while (wispAccum > WISP_RATE) { wispAccum -= WISP_RATE; wisps.push({ t: 0, seed: Math.random() * 1000, size: 1 + Math.random() * 1.5 }); }
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i];
        w.t += 0.06 * (1 + w.t * 0.4) * dt;
        if (w.t >= 1) { wisps.splice(i, 1); continue; }
        const t = Math.min(w.t, 0.999);
        const pos = bezierPoint(wSp.p0, wSp.p1, wSp.p2, wSp.p3, t);
        const nx = noise2D(time * 0.3 + w.seed, w.seed * 0.2) * 25 * t * t;
        const ny = noise2D(w.seed * 0.4, time * 0.25) * 12 * t * t;
        const opacity = (1 - t) * (1 - t) * 0.12;
        if (opacity < 0.002) continue;
        ctx.beginPath();
        ctx.arc(pos.x + nx, pos.y + ny, w.size * (1 + t * 3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,155,145,${opacity})`;
        ctx.fill();
      }

      // Character stream
      const sp = smokeSpline(time);
      if (textRef.current.length) {
        emitAccum += dt;
        while (emitAccum > EMIT_RATE) { emitAccum -= EMIT_RATE; emitChar(); }
      }
      ctx.font = FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = chars.length - 1; i >= 0; i--) {
        const c = chars[i];
        c.t += RISE_SPEED * (1.0 + c.t * 0.6) * dt;
        if (c.t >= 1.0) { chars.splice(i, 1); continue; }
        const t = Math.min(c.t, 0.999);
        const pos = bezierPoint(sp.p0, sp.p1, sp.p2, sp.p3, t);
        const turb = t * t;
        const fx = pos.x + noise2D(time * 0.4 + c.seed, c.seed * 0.1) * 40 * turb + c.xOff * (1 + t * 12);
        const fy = pos.y + noise2D(c.seed * 0.3, time * 0.35 + c.seed) * 20 * turb;
        const fadeIn = Math.min(1, c.t / 0.04);
        const fadeOut = 1 - Math.pow(t, 1.5);
        const opacity = fadeIn * fadeOut;
        if (opacity < 0.005) continue;
        const warmth = 1 - t;
        const r = Math.round(220 * warmth + 140 * (1 - warmth));
        const g = Math.round(180 * warmth + 135 * (1 - warmth));
        const b = Math.round(130 * warmth + 130 * (1 - warmth));
        const blur = t * t * 18;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(noise2D(time * 0.5 + c.seed * 2, 0) * 0.3 * turb);
        ctx.scale(c.sizeJitter * (0.8 + t * 1.2), c.sizeJitter * (0.8 + t * 1.2));
        ctx.shadowColor = `rgba(${r},${g},${b},${opacity * 0.35})`;
        ctx.shadowBlur = 6 + blur;
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
        ctx.fillText(c.ch, 0, 0);
        ctx.restore();
      }

      drawCigarette(time);
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
