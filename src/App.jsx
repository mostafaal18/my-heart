import { useEffect, useRef, useState } from "react";
import "./App.css";

export default function App() {
  const canvasRef = useRef(null);
  const [showName, setShowName] = useState(false);

  // اسمی که می‌خوای وسط قلب نشون داده بشه
  // اگه نمی‌خوای، مقدارش رو خالی بذار: ""
  const name = "لادن";

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let width = 0, height = 0, dpr = 1;

    /* ---------- معادله پارامتریک قلب ---------- */
    const heartPoint = (t) => {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );
      return { x, y };
    };

    /* ---------- ساخت ذرات ---------- */
    const PARTICLE_COUNT = 750;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      const out = heartPoint(t);
      const r = Math.pow(Math.random(), 0.35);
      const tx = out.x * r;
      const ty = out.y * r;

      const angle = Math.random() * Math.PI * 2;
      const dist = 1500 + Math.random() * 1500;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;

      particles.push({
        tx, ty, sx, sy,
        delay: Math.random() * 1.8,
        duration: 1.6 + Math.random() * 1.2,
        size: 0.8 + Math.random() * 1.6,
        hue: 335 + Math.random() * 25,
        sat: 90 + Math.random() * 10,
        driftPhase: Math.random() * Math.PI * 2,
        driftAmp: 0.5 + Math.random() * 1.5,
        driftSpeed: 0.5 + Math.random() * 1,
      });
    }

    /* ---------- ریسایز ---------- */
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();
    const FORM_TIME = 3.4;

    // بعد از تشکیل قلب، اسم رو نشون بده
    const nameTimer = setTimeout(() => setShowName(true), FORM_TIME * 1000 + 200);

    /* ---------- حلقه انیمیشن ---------- */
    const animate = (now) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) / 48;

      /* --- ضربان قلب --- */
      let beat = 0;
      if (elapsed > FORM_TIME) {
        const t = elapsed - FORM_TIME;
        const main = Math.max(0, Math.sin(t * Math.PI * 1.6));
        const sub = Math.max(0, Math.sin((t - 0.22) * Math.PI * 1.6)) * 0.55;
        beat = (main + sub) * 0.07;
      }
      const s = scale * (1 + beat);

      /* --- هاله پس‌زمینه --- */
      if (elapsed > FORM_TIME - 1) {
        const gs = Math.min(1, (elapsed - (FORM_TIME - 1)) / 1.2);
        const gr = Math.max(width, height) * 0.65;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
        const intensity = 0.28 * gs * (1 + beat * 6);
        grad.addColorStop(0, `hsla(340, 100%, 60%, ${intensity})`);
        grad.addColorStop(0.35, `hsla(340, 100%, 55%, ${intensity * 0.4})`);
        grad.addColorStop(1, "hsla(340, 100%, 50%, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      /* --- موج شوک --- */
      if (elapsed > FORM_TIME && elapsed < FORM_TIME + 1.6) {
        const p = (elapsed - FORM_TIME) / 1.6;
        const ringR = p * Math.min(width, height) * 0.6;
        const alpha = (1 - p) * 0.6;
        ctx.strokeStyle = `hsla(340, 100%, 70%, ${alpha})`;
        ctx.lineWidth = 2 * (1 - p);
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";

      /* --- رسم ذرات --- */
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pe = elapsed - p.delay;
        if (pe <= 0) continue;

        const t = Math.min(1, pe / p.duration);
        const ease = 1 - Math.pow(1 - t, 4);

        const targetX = cx + p.tx * s;
        const targetY = cy + p.ty * s;

        let px = p.sx + (targetX - p.sx) * ease;
        let py = p.sy + (targetY - p.sy) * ease;

        if (t >= 1 && elapsed > FORM_TIME) {
          const dt = elapsed - FORM_TIME;
          px += Math.sin(dt * p.driftSpeed + p.driftPhase) * p.driftAmp;
          py += Math.cos(dt * p.driftSpeed + p.driftPhase * 1.3) * p.driftAmp;
        }

        if (beat > 0) {
          const dx = px - cx;
          const dy = py - cy;
          px += dx * beat * 0.6;
          py += dy * beat * 0.6;
        }

        const alpha = ease * (0.85 + beat * 2);
        const light = 55 + beat * 35;

        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${light}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + beat * 1.5), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(nameTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="stage">
      <canvas ref={canvasRef} className="canvas" />

      {/* اسم وسط قلب */}
      {name && (
        <p className={`heart-name ${showName ? "show" : ""}`}>{name}</p>
      )}

      <div className="vignette" />
    </div>
  );
}