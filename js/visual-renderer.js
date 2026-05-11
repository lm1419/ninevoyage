/* ============================================================
   visual-renderer.js — Canvas 场景渲染器
   为 visualFrame 提供动态山水画面、云雾、圣光和敌人剪影。
   ============================================================ */

const VisualRenderer = (() => {
  let canvas, ctx, animId;
  let particles = [];
  let clouds = [];
  let currentScene = null;
  let transition = 0;
  let prevScene = null;

  /* ── 种子随机 ── */
  function seeded(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    return () => { h = (h * 1103515245 + 12345) | 0; return (h >>> 0) / 0xffffffff; };
  }

  /* ── 颜色工具 ── */
  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128];
  }

  function rgba(r, g, b, a) { return `rgba(${r},${g},${b},${a})`; }

  function lerpC(c1, c2, t) {
    return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
  }

  /* ── 性能降级 ── */
  function isMobile() { return (canvas && canvas.width / (window.devicePixelRatio || 1)) < 980; }

  /* ── 天空预设 ── */
  function getSkyStops(mood) {
    const presets = window.SKY_PRESETS || {};
    return presets[mood] || presets.mountain || [
      { pos: 0, rgb: [16, 23, 22] },
      { pos: 0.45, rgb: [57, 65, 57] },
      { pos: 1, rgb: [162, 131, 77] }
    ];
  }

  /* ── 场景解析 ── */
  function detectLandscape(region) {
    const kw = {
      gateway: ["门", "光"],
      temple: ["莲", "宗", "佛", "寺", "庙"],
      ocean: ["海", "龙", "潮"],
      snow: ["雪", "骨"],
      valley: ["谷", "药", "春"],
      palace: ["凤", "宫", "神", "栖"],
      road: ["灯", "火", "流"],
      wasteland: ["魔", "戟", "裂"],
      ruins: ["墟", "遗", "残", "折", "旧"],
      formation: ["阵", "封"],
      well: ["井", "脉"],
    };
    for (const [type, keys] of Object.entries(kw)) {
      if (keys.some(k => region.includes(k))) return type;
    }
    return "mountain";
  }

  /* ── 云雾系统 ── */
  function spawnClouds(w, h, density) {
    const list = [];
    const counts = { heavy: 18, high: 14, mist: 10, low: 7, none: 3 };
    const count = counts[density] || 8;
    for (let i = 0; i < count; i++) {
      const seed = Math.random();
      const yMin = density === "high" ? 0.12 : density === "low" ? 0.42 : 0.2;
      const yMax = density === "high" ? 0.38 : density === "low" ? 0.58 : 0.48;
      list.push({
        x: Math.random() * w * 1.6 - w * 0.3,
        y: h * yMin + Math.random() * h * (yMax - yMin),
        w: 60 + Math.random() * 200,
        h: 10 + Math.random() * 40,
        speed: 0.06 + Math.random() * 0.3,
        opacity: 0.03 + Math.random() * 0.1,
        seed: seed,
        lobes: 3 + Math.floor(seed * 4)
      });
    }
    return list.sort((a, b) => a.y - b.y);
  }

  function drawClouds(w, h, cloudList, timeSec) {
    ctx.save();
    cloudList.forEach(c => {
      const x = ((c.x + timeSec * c.speed * 12) % (w + c.w * 2.4)) - c.w * 1.2;
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = "rgba(245, 242, 230, 1)";
      for (let i = 0; i < c.lobes; i++) {
        const ox = (c.seed * 7 + i * 1.7) % 1 * c.w * 0.45 - c.w * 0.22;
        const oy = Math.sin(i * 2.1 + c.seed * 6) * c.h * 0.25;
        const rw = c.w * (0.35 + ((c.seed * (i + 1) * 100) % 60) / 100);
        const rh = c.h * (0.45 + ((c.seed * (i + 2) * 100) % 55) / 100);
        ctx.beginPath();
        ctx.ellipse(x + ox, c.y + oy, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  /* ── 圣光 ── */
  function drawGodRays(w, h, accent, rng, timeSec) {
    const cx = w * 0.32 + rng() * w * 0.36;
    const cy = h * 0.04;
    const rayCount = 5 + Math.floor(rng() * 6);
    ctx.save();
    for (let i = 0; i < rayCount; i++) {
      const angle = -0.45 + rng() * 0.9;
      const rayLen = h * (0.55 + rng() * 0.4);
      const rayW = 20 + rng() * 70;
      const x2 = cx + Math.sin(angle) * rayLen;
      const y2 = cy + Math.cos(angle) * rayLen;
      const grad = ctx.createLinearGradient(cx, cy, x2, y2);
      grad.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.1 + rng() * 0.06));
      grad.addColorStop(0.45, rgba(accent[0], accent[1], accent[2], 0.03));
      grad.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx - rayW * 0.08, cy);
      ctx.lineTo(x2 + rayW, y2);
      ctx.lineTo(x2 - rayW, y2);
      ctx.lineTo(cx + rayW * 0.08, cy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* ── 灵气粒子系统 ── */
  function spawnParticles(w, h, kind, accentRgb) {
    const list = [];
    const count = kind === "battle" ? 80 : 50;
    const palettes = [
      [255, 245, 200],
      [180, 230, 210],
      [200, 180, 240],
      [220, 200, 180],
      accentRgb,
    ];
    for (let i = 0; i < count; i++) {
      const color = palettes[Math.floor(Math.random() * palettes.length)];
      list.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.3 + Math.random() * 2.8,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(Math.random() * 0.7 + 0.12),
        life: Math.random(),
        maxLife: 0.7 + Math.random() * 1.8,
        alpha: 0.1 + Math.random() * 0.45,
        color: color,
        clusterId: Math.floor(Math.random() * 5),
        wobbleAmp: Math.random() * 0.25,
        wobbleFreq: 1 + Math.random() * 2.5,
      });
    }
    return list;
  }

  function updateParticles(w, h, dt) {
    const timeSec = performance.now() / 1000;
    for (const p of particles) {
      p.x += p.vx * dt * 60 + Math.sin(timeSec * p.wobbleFreq + p.clusterId) * p.wobbleAmp;
      p.y += p.vy * dt * 60;
      p.life += dt;
      if (p.life >= p.maxLife || p.y < -15 || p.x < -15 || p.x > w + 15) {
        p.x = Math.random() * w;
        p.y = h + 10;
        p.life = 0;
        p.maxLife = 0.7 + Math.random() * 1.8;
      }
    }
  }

  function drawParticles() {
    const useGlow = !isMobile();
    for (const p of particles) {
      const fade = p.life < 0.18 ? p.life / 0.18 : p.life > p.maxLife - 0.3 ? (p.maxLife - p.life) / 0.3 : 1;
      const alpha = p.alpha * fade;
      if (useGlow) {
        ctx.shadowColor = rgba(p.color[0], p.color[1], p.color[2], 0.55);
        ctx.shadowBlur = p.r * 3.5;
        ctx.fillStyle = rgba(255, 255, 250, alpha * 0.85);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = rgba(p.color[0], p.color[1], p.color[2], alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (!useGlow) {
        ctx.fillStyle = rgba(255, 255, 250, alpha * 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ── 绘制工具 ── */
  function drawSky(w, h, mood) {
    const stops = getSkyStops(mood);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach(s => grad.addColorStop(s.pos, rgba(s.rgb[0], s.rgb[1], s.rgb[2], 1)));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawMountains(w, h, baseY, count, color, rng, opts = {}) {
    const { minH = 30, rangeH = 90, sharpness = 0, ridgeDetail = false } = opts;
    for (let layer = 0; layer < (ridgeDetail ? 2 : 1); layer++) {
      ctx.beginPath();
      ctx.moveTo(-10, h);
      const segW = w / count;
      for (let i = 0; i <= count; i++) {
        const x = i * segW + (rng() - 0.5) * segW * 0.6;
        const peakH = baseY - minH - rng() * rangeH;
        if (i === 0 || i === count) {
          ctx.lineTo(x, peakH);
        } else if (sharpness > 0.55) {
          const pw = segW * (0.08 + sharpness * 0.06);
          ctx.lineTo(x - pw, peakH + rng() * 12);
          ctx.lineTo(x, peakH);
          ctx.lineTo(x + pw, peakH + rng() * 12);
        } else {
          const cp1x = x - segW * 0.3;
          const cp1y = peakH - rng() * 50 * (1 + sharpness);
          const cp2x = x + segW * 0.15;
          const cp2y = peakH + rng() * 25 * (1 - sharpness * 0.5);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, peakH);
        }
      }
      ctx.lineTo(w + 10, h);
      ctx.closePath();
      if (layer === 0) {
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.strokeStyle = rgba(255, 255, 255, 0.03);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  function drawGround(w, h, groundY, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, groundY, w, h - groundY);
  }

  function drawFog(w, h, groundY, accent, rng) {
    for (let i = 0; i < 6; i++) {
      const y = groundY - 60 + i * 22 + rng() * 28;
      const alpha = 0.025 + rng() * 0.045;
      const grad = ctx.createLinearGradient(0, y - 40, 0, y + 20);
      grad.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0));
      grad.addColorStop(0.5, rgba(accent[0], accent[1], accent[2], alpha));
      grad.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 40, w, 60);
    }
  }

  function drawMistLayer(w, h, baseY, accent, rng, intensity) {
    const bands = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < bands; i++) {
      const y = baseY - 8 + i * 12 + rng() * 6;
      const grad = ctx.createLinearGradient(0, y - 18, 0, y + 8);
      const alpha = 0.03 + (intensity || 0.4) * 0.07;
      grad.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0));
      grad.addColorStop(0.5, rgba(accent[0], accent[1], accent[2], alpha));
      grad.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 18, w, 26);
    }
  }

  /* ── 地貌绘制 ── */
  function drawGateway(w, h, accent, rng) {
    const my = h * 0.62;
    drawMountains(w, h, my + 20, 8, rgba(18, 24, 20, 0.5), rng, { minH: 50, rangeH: 120, sharpness: 0.8, ridgeDetail: true });
    drawMistLayer(w, h, my - 20, accent, rng, 0.4);
    drawMountains(w, h, my + 55, 6, rgba(10, 14, 12, 0.8), rng, { minH: 20, rangeH: 55, sharpness: 0.7 });
    const gw = w * 0.16, gh = h * 0.22, gx = w * 0.42, gy = my - gh + 15;
    ctx.fillStyle = rgba(8, 10, 9, 0.82);
    ctx.fillRect(gx - gw * 0.08, gy, gw * 0.16, gh);
    ctx.fillRect(gx + gw - gw * 0.08, gy, gw * 0.16, gh);
    ctx.fillRect(gx - gw * 0.1, gy - gh * 0.18, gw + gw * 0.2, gh * 0.18);
    const lg = ctx.createRadialGradient(gx + gw * 0.4, gy + gh * 0.5, gh * 0.05, gx + gw * 0.4, gy + gh * 0.5, gh * 1.1);
    lg.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.32));
    lg.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = lg;
    ctx.fillRect(gx + gw * 0.08, gy, gw * 0.84, gh);
  }

  function drawTemple(w, h, accent, rng) {
    const my = h * 0.6;
    drawMountains(w, h, my + 15, 9, rgba(16, 28, 22, 0.45), rng, { minH: 50, rangeH: 130, sharpness: 0.85, ridgeDetail: true });
    drawMistLayer(w, h, my - 25, accent, rng, 0.5);
    ctx.fillStyle = rgba(accent[0], accent[1], accent[2], 0.08);
    ctx.beginPath();
    ctx.ellipse(w * 0.35, h * 0.72, w * 0.18, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(accent[0], accent[1], accent[2], 0.04);
    ctx.beginPath();
    ctx.ellipse(w * 0.35, h * 0.73, w * 0.13, h * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    const floors = 3, fh = h * 0.08, fw = w * 0.05;
    const tx = w * 0.32, ty = my - fh * floors + 5;
    for (let i = 0; i < floors; i++) {
      const levelW = fw * (1.2 - i * 0.2);
      ctx.fillStyle = rgba(6, 12, 9, 0.8 + i * 0.05);
      ctx.fillRect(tx - levelW / 2, ty + i * fh, levelW, fh);
      ctx.beginPath();
      ctx.moveTo(tx - levelW / 2 - 6, ty + i * fh - 3);
      ctx.lineTo(tx + levelW / 2 + 6, ty + i * fh - 3);
      ctx.lineTo(tx + levelW / 2 + 3, ty + i * fh + 4);
      ctx.lineTo(tx - levelW / 2 - 3, ty + i * fh + 4);
      ctx.fillStyle = rgba(8, 14, 11, 0.88);
      ctx.fill();
    }
    drawFog(w, h, my + 30, accent, rng);
  }

  function drawOcean(w, h, accent, rng, timeSec) {
    const horizon = h * 0.48;
    drawMountains(w, h, horizon + 10, 5, rgba(14, 22, 26, 0.4), rng, { minH: 20, rangeH: 65, sharpness: 0.7 });
    const sg = ctx.createLinearGradient(0, horizon, 0, h);
    sg.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.2));
    sg.addColorStop(0.3, rgba(accent[0], accent[1], accent[2], 0.08));
    sg.addColorStop(1, rgba(6, 12, 14, 0.92));
    ctx.fillStyle = sg;
    ctx.fillRect(0, horizon, w, h - horizon);
    for (let i = 0; i < 22; i++) {
      const wy = horizon + 8 + i * (h - horizon) / 22;
      const alpha = 0.02 + (1 - i / 22) * 0.06;
      ctx.strokeStyle = rgba(accent[0], accent[1], accent[2], alpha);
      ctx.lineWidth = 0.5 + rng() * 0.8;
      ctx.beginPath();
      for (let x = 0; x < w; x += 8) {
        const yy = wy + Math.sin(x * 0.02 + i * 1.4 + timeSec * 0.5 + rng() * 6) * 4;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    const lg = ctx.createLinearGradient(0, horizon - 30, 0, h);
    lg.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.1));
    lg.addColorStop(0.8, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = lg;
    ctx.fillRect(w * 0.4, horizon - 30, w * 0.2, h - horizon + 30);
  }

  function drawSnow(w, h, accent, rng) {
    const my = h * 0.58;
    for (let i = 0; i < 6; i++) {
      const px = i * w * 0.2 + rng() * w * 0.06;
      const ph = my - 50 - rng() * 120;
      const pw = 55 + rng() * 45;
      ctx.fillStyle = rgba(195 + rng() * 45, 210 + rng() * 30, 225, 0.65 + rng() * 0.25);
      ctx.beginPath();
      ctx.moveTo(px - pw, my);
      ctx.lineTo(px, ph);
      ctx.lineTo(px + pw, my);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(235, 240, 248, 0.9);
      ctx.beginPath();
      ctx.moveTo(px - pw * 0.35, ph + pw * 0.25);
      ctx.lineTo(px, ph);
      ctx.lineTo(px + pw * 0.35, ph + pw * 0.25);
      ctx.closePath();
      ctx.fill();
    }
    drawMountains(w, h, my + 30, 5, rgba(20, 25, 30, 0.85), rng, { minH: 15, rangeH: 40, sharpness: 0.6 });
  }

  function drawValley(w, h, accent, rng) {
    const my = h * 0.56;
    drawMountains(w, h, my + 8, 8, rgba(16, 28, 14, 0.4), rng, { minH: 45, rangeH: 120, sharpness: 0.75, ridgeDetail: true });
    drawMistLayer(w, h, my - 10, accent, rng, 0.45);
    for (let i = 0; i < 14; i++) {
      const tx = rng() * w;
      const th = 22 + rng() * 45;
      const ty = my + 20 - th;
      const tw = 5 + rng() * 11;
      ctx.fillStyle = rgba(8 + rng() * 10, 18 + rng() * 12, 5, 0.7 + rng() * 0.2);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - tw, ty + th);
      ctx.lineTo(tx + tw, ty + th);
      ctx.closePath();
      ctx.fill();
    }
    drawFog(w, h, my + 15, accent, rng);
  }

  function drawPalace(w, h, accent, rng) {
    const my = h * 0.55;
    drawMountains(w, h, my + 35, 6, rgba(20, 14, 18, 0.45), rng, { minH: 35, rangeH: 90, sharpness: 0.8, ridgeDetail: true });
    drawMistLayer(w, h, my - 5, accent, rng, 0.5);
    const pw = w * 0.28, ph = h * 0.18, px = w * 0.36, py = my - ph + 10;
    ctx.fillStyle = rgba(10, 6, 10, 0.88);
    ctx.fillRect(px, py, pw, ph);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = rgba(16, 10, 14, 0.9);
      ctx.fillRect(px + pw * 0.05 + i * pw * 0.22, py + ph * 0.1, pw * 0.04, ph * 0.9);
    }
    ctx.fillStyle = rgba(6, 3, 8, 0.92);
    ctx.fillRect(px - pw * 0.07, py - ph * 0.15, pw + pw * 0.14, ph * 0.2);
    ctx.fillRect(px - pw * 0.04, py - ph * 0.28, pw + pw * 0.08, ph * 0.15);
    ctx.beginPath();
    ctx.moveTo(px + pw * 0.3, py - ph * 0.28);
    ctx.lineTo(px + pw * 0.5, py - ph * 0.62);
    ctx.lineTo(px + pw * 0.7, py - ph * 0.28);
    ctx.fillStyle = rgba(8, 4, 8, 0.94);
    ctx.fill();
    const lg = ctx.createRadialGradient(px + pw * 0.5, py - ph * 0.2, pw * 0.05, px + pw * 0.5, py, pw * 1.3);
    lg.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.16));
    lg.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);
  }

  function drawRoad(w, h, accent, rng) {
    const my = h * 0.58;
    drawMountains(w, h, my + 18, 7, rgba(20, 16, 10, 0.5), rng, { minH: 30, rangeH: 85, sharpness: 0.65, ridgeDetail: true });
    ctx.fillStyle = rgba(25, 20, 10, 0.7);
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h);
    ctx.lineTo(w * 0.5, my + 20);
    ctx.lineTo(w * 0.7, h);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 10; i++) {
      const lx = w * 0.31 + i * w * 0.045;
      const ly = my + 10 - (i % 3) * 18;
      const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, 14);
      glow.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.55));
      glow.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
      ctx.fillStyle = glow;
      ctx.fillRect(lx - 16, ly - 16, 32, 32);
      ctx.fillStyle = rgba(accent[0], accent[1], accent[2], 0.75);
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWasteland(w, h, accent, rng) {
    const my = h * 0.62;
    ctx.fillStyle = rgba(22, 8, 10, 0.35);
    ctx.fillRect(0, 0, w, h);
    drawMountains(w, h, my + 25, 6, rgba(18, 8, 8, 0.75), rng, { minH: 30, rangeH: 70, sharpness: 0.7 });
    ctx.strokeStyle = rgba(accent[0], accent[1], accent[2], 0.22);
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const sx = rng() * w, sy = my - 20 + rng() * 40;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (rng() - 0.3) * 60, sy + 30 + rng() * 50);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const bx = w * 0.2 + i * w * 0.25;
      const by = my + 10 + rng() * 30;
      ctx.strokeStyle = rgba(30, 15, 12, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - 10, by + 8);
      ctx.lineTo(bx, by - 22);
      ctx.lineTo(bx + 7, by + 4);
      ctx.stroke();
    }
  }

  function drawRuins(w, h, accent, rng) {
    const my = h * 0.58;
    drawMountains(w, h, my + 15, 7, rgba(15, 12, 20, 0.5), rng, { minH: 30, rangeH: 95, sharpness: 0.7, ridgeDetail: true });
    drawMistLayer(w, h, my - 5, accent, rng, 0.35);
    for (let i = 0; i < 5; i++) {
      const cx = w * 0.12 + i * w * 0.2;
      const ch = 28 + rng() * 45;
      const cw = 5 + rng() * 4;
      ctx.fillStyle = rgba(16, 12, 18, 0.78);
      ctx.fillRect(cx, my - ch, cw, ch);
      ctx.fillStyle = rgba(accent[0], accent[1], accent[2], 0.06);
      ctx.fillRect(cx - 2, my - ch - 4, cw + 4, 6);
    }
    const mg = ctx.createRadialGradient(w * 0.6, h * 0.22, 8, w * 0.6, h * 0.22, 40);
    mg.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.38));
    mg.addColorStop(0.4, rgba(accent[0], accent[1], accent[2], 0.08));
    mg.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = mg;
    ctx.fillRect(w * 0.35, 0, w * 0.5, h * 0.5);
  }

  function drawFormation(w, h, accent, rng, timeSec) {
    const my = h * 0.55;
    drawMountains(w, h, my + 20, 6, rgba(14, 18, 16, 0.5), rng, { minH: 25, rangeH: 75, sharpness: 0.75, ridgeDetail: true });
    const cx = w * 0.5, cy = my - 10, cr = w * 0.18;
    for (let ring = 3; ring >= 0; ring--) {
      const r = cr * (1.6 - ring * 0.4);
      const pulse = 1 + Math.sin(timeSec * 1.2 + ring) * 0.08;
      ctx.strokeStyle = rgba(accent[0], accent[1], accent[2], (0.14 - ring * 0.03) * pulse);
      ctx.lineWidth = 1 + ring * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(accent[0], accent[1], accent[2], 0.18);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + timeSec * 0.15;
      const sx = cx + Math.cos(angle) * cr * 0.6;
      const sy = cy + Math.sin(angle) * cr * 0.6;
      ctx.moveTo(sx - 4, sy - 4);
      ctx.lineTo(sx + 4, sy + 4);
      ctx.moveTo(sx + 4, sy - 4);
      ctx.lineTo(sx - 4, sy + 4);
    }
    ctx.stroke();
    const lg = ctx.createLinearGradient(cx - cr, 0, cx + cr, 0);
    lg.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0));
    lg.addColorStop(0.5, rgba(accent[0], accent[1], accent[2], 0.1));
    lg.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = lg;
    ctx.fillRect(cx - cr, 0, cr * 2, h);
  }

  function drawWell(w, h, accent, rng) {
    const my = h * 0.56;
    drawMountains(w, h, my + 22, 6, rgba(10, 14, 16, 0.55), rng, { minH: 28, rangeH: 85, sharpness: 0.7, ridgeDetail: true });
    drawMistLayer(w, h, my - 5, accent, rng, 0.5);
    const cx = w * 0.45, cy = my + 8, wr = w * 0.08;
    ctx.fillStyle = rgba(4, 8, 10, 0.92);
    ctx.beginPath();
    ctx.ellipse(cx, cy, wr, wr * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    const lg = ctx.createRadialGradient(cx, cy, wr * 0.1, cx, cy, wr * 2.2);
    lg.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.4));
    lg.addColorStop(0.5, rgba(accent[0], accent[1], accent[2], 0.1));
    lg.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = lg;
    ctx.fillRect(cx - wr * 2, cy - wr, wr * 4, wr * 3);
    ctx.strokeStyle = rgba(20, 10, 8, 0.6);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const sx = cx - wr + rng() * wr * 2;
      ctx.moveTo(sx, cy - wr * 0.2);
      ctx.quadraticCurveTo(sx + (rng() - 0.5) * 30, cy + 20 + rng() * 20, sx + (rng() - 0.5) * 50, cy + 40 + rng() * 30);
      ctx.stroke();
    }
  }

  function drawMountain(w, h, accent, rng) {
    const my = h * 0.6;
    drawMountains(w, h, my + 5, 10, rgba(14, 22, 16, 0.3), rng, { minH: 70, rangeH: 150, sharpness: 0.9, ridgeDetail: true });
    drawMistLayer(w, h, my - 20, accent, rng, 0.35);
    drawMountains(w, h, my + 35, 8, rgba(10, 16, 12, 0.5), rng, { minH: 35, rangeH: 85, sharpness: 0.7, ridgeDetail: true });
    drawMistLayer(w, h, my + 8, accent, rng, 0.5);
    drawMountains(w, h, my + 60, 6, rgba(6, 10, 7, 0.85), rng, { minH: 12, rangeH: 38, sharpness: 0.85 });
    drawFog(w, h, my + 45, accent, rng);
  }

  /* ── 敌人剪影 ── */
  function drawEnemySilhouette(cx, cy, accent, name, rng, timeSec) {
    const shapeType = name.includes("神") || name.includes("佛") ? "divine"
      : name.includes("龙") ? "serpent"
      : name.includes("炉") || name.includes("井") ? "massive"
      : name.includes("邪") || name.includes("魔") ? "demon"
      : name.includes("沉") || name.includes("影") ? "wraith"
      : "humanoid";

    // 外层扩散光环
    const outerAura = ctx.createRadialGradient(cx, cy - 10, 10, cx, cy - 10, 130);
    outerAura.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.16));
    outerAura.addColorStop(0.5, rgba(accent[0], accent[1], accent[2], 0.05));
    outerAura.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = outerAura;
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 130, 0, Math.PI * 2);
    ctx.fill();

    // 内层脉动光环
    const pulse = 1 + Math.sin(timeSec * 1.5) * 0.12;
    const innerAura = ctx.createRadialGradient(cx, cy - 10, 4, cx, cy - 10, 55 * pulse);
    innerAura.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.32));
    innerAura.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = innerAura;
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 55 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    const scale = 0.9 + rng() * 0.2;
    ctx.scale(scale, scale);

    const dark = "rgba(8,4,6,0.9)";

    if (shapeType === "divine") {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(0, 10, 50, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -45, 28, 0, Math.PI * 2);
      ctx.fill();
      const halo = ctx.createRadialGradient(0, -30, 5, 0, -30, 75);
      halo.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.3));
      halo.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -30, 75, 0, Math.PI * 2);
      ctx.fill();
    } else if (shapeType === "serpent") {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-20, 60);
      ctx.bezierCurveTo(-40, 10, -10, -30, 0, -50);
      ctx.bezierCurveTo(15, -30, 35, 10, 20, 60);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -50, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (shapeType === "massive") {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-55, 50);
      ctx.bezierCurveTo(-65, -10, -30, -55, 10, -60);
      ctx.bezierCurveTo(50, -65, 65, -15, 55, 50);
      ctx.closePath();
      ctx.fill();
    } else if (shapeType === "demon") {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-35, 55);
      ctx.lineTo(-45, -15);
      ctx.lineTo(-20, -45);
      ctx.lineTo(-8, -30);
      ctx.lineTo(8, -48);
      ctx.lineTo(20, -30);
      ctx.lineTo(45, -15);
      ctx.lineTo(35, 55);
      ctx.closePath();
      ctx.fill();
    } else if (shapeType === "wraith") {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-30, 60);
      ctx.bezierCurveTo(-45, 20, -20, -20, -5, -55);
      ctx.bezierCurveTo(10, -20, 45, 20, 30, 60);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(0, -40, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-14, -24);
      ctx.lineTo(-22, 40);
      ctx.lineTo(22, 40);
      ctx.lineTo(14, -24);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // 眼瞳发光（非人形）
    if (shapeType !== "humanoid") {
      ctx.fillStyle = rgba(accent[0], accent[1], accent[2], 0.8);
      ctx.shadowColor = rgba(accent[0], accent[1], accent[2], 0.85);
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 42, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy - 42, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /* ── 场景绘制 ── */
  function drawScene(info, timeSec) {
    if (!info) return;
    const w = canvas.width, h = canvas.height;
    const rng = seeded(info.region || "default");
    const accent = hexToRgb(info.accent || "#d7a84c");
    const mood = info.mood || "mountain";

    ctx.clearRect(0, 0, w, h);
    drawSky(w, h, mood);

    if (info.rays) {
      drawGodRays(w, h, accent, rng, timeSec);
    }

    if (info.clouds && info.clouds !== "none") {
      drawClouds(w, h, clouds, timeSec);
    }

    const landscapeType = info.landscape || detectLandscape(info.region || "");
    switch (landscapeType) {
      case "gateway": drawGateway(w, h, accent, rng); break;
      case "temple": drawTemple(w, h, accent, rng); break;
      case "ocean": drawOcean(w, h, accent, rng, timeSec); break;
      case "snow": drawSnow(w, h, accent, rng); break;
      case "valley": drawValley(w, h, accent, rng); break;
      case "palace": drawPalace(w, h, accent, rng); break;
      case "road": drawRoad(w, h, accent, rng); break;
      case "wasteland": drawWasteland(w, h, accent, rng); break;
      case "ruins": drawRuins(w, h, accent, rng); break;
      case "formation": drawFormation(w, h, accent, rng, timeSec); break;
      case "well": drawWell(w, h, accent, rng); break;
      default: drawMountain(w, h, accent, rng);
    }

    const groundY = h * 0.68;
    const gg = ctx.createLinearGradient(0, groundY, 0, h);
    gg.addColorStop(0, rgba(4, 6, 5, 0.82));
    gg.addColorStop(1, rgba(2, 3, 2, 0.96));
    ctx.fillStyle = gg;
    ctx.fillRect(0, groundY, w, h - groundY);

    drawFog(w, h, groundY, accent, rng);
  }

  function drawBattle(info, timeSec) {
    if (!info) return;
    const w = canvas.width, h = canvas.height;
    const rng = seeded(info.enemy || "unknown");
    const accent = hexToRgb(info.accent || "#ff9d9d");
    const mood = info.mood || "crimson";

    ctx.clearRect(0, 0, w, h);
    drawSky(w, h, mood);

    if (info.clouds && info.clouds !== "none") {
      drawClouds(w, h, clouds, timeSec);
    }

    const my = h * 0.72;
    ctx.fillStyle = rgba(6, 2, 4, 0.75);
    ctx.beginPath();
    ctx.moveTo(-10, h);
    for (let i = 0; i <= 8; i++) {
      const x = i * w / 8;
      const peak = my - 15 - rng() * 45;
      ctx.lineTo(x + (rng() - 0.5) * 30, peak);
    }
    ctx.lineTo(w + 10, h);
    ctx.closePath();
    ctx.fill();

    const gg = ctx.createLinearGradient(0, my, 0, h);
    gg.addColorStop(0, rgba(2, 1, 2, 0.78));
    gg.addColorStop(1, rgba(1, 0, 1, 0.97));
    ctx.fillStyle = gg;
    ctx.fillRect(0, my, w, h - my);

    drawEnemySilhouette(w * 0.5, h * 0.45, accent, info.enemy, rng, timeSec);

    const ag = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.45, w * 0.6);
    ag.addColorStop(0, rgba(accent[0], accent[1], accent[2], 0.1));
    ag.addColorStop(1, rgba(accent[0], accent[1], accent[2], 0));
    ctx.fillStyle = ag;
    ctx.fillRect(0, 0, w, h);
  }

  /* ── 主循环 ── */
  let lastTime = 0;
  function loop(time) {
    if (!canvas || !ctx) return;
    const dt = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;
    const timeSec = time / 1000;
    const w = canvas.width, h = canvas.height;

    if (transition < 1) {
      transition = Math.min(1, transition + dt * 2.5);
    }

    if (currentScene) {
      if (currentScene.kind === "battle") {
        drawBattle(currentScene, timeSec);
      } else {
        drawScene(currentScene, timeSec);
      }
    }

    if (transition < 1 && prevScene) {
      ctx.fillStyle = rgba(0, 0, 0, 1 - transition);
      ctx.fillRect(0, 0, w, h);
    }

    const accentRgb = currentScene ? hexToRgb(currentScene.accent || "#d7a84c") : [215, 168, 76];
    if (!particles.length) particles = spawnParticles(w, h, currentScene?.kind || "scene", accentRgb);
    updateParticles(w, h, dt);
    drawParticles();

    animId = requestAnimationFrame(loop);
  }

  /* ── 公开 API ── */
  function setup(frame) {
    if (!frame) return;
    const old = frame.querySelector("canvas");
    if (old) old.remove();

    canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;z-index:2;pointer-events:none;";
    frame.insertBefore(canvas, frame.firstChild);
    resize(frame);
    startLoop();
  }

  function resize(frame) {
    if (!canvas) return;
    const f = frame || canvas.parentElement;
    if (!f) return;
    const rect = f.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    particles = [];
    clouds = [];
  }

  function startLoop() {
    stopLoop();
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  function render(sceneInfo) {
    if (!canvas || !ctx) return;
    prevScene = currentScene;
    currentScene = sceneInfo;
    transition = 0;
    particles = [];
    clouds = [];
    if (sceneInfo && sceneInfo.clouds && sceneInfo.clouds !== "none") {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      clouds = spawnClouds(w, h, sceneInfo.clouds);
    }
    if (!animId) startLoop();
  }

  return { setup, resize, render, stopLoop };
})();

window.VisualRenderer = VisualRenderer;
