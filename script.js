(() => {
  const canvas = document.querySelector("#ritual-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const scenes = [...document.querySelectorAll(".scene")];
  const navButtons = [...document.querySelectorAll(".scene-nav button")];
  const budButton = document.querySelector(".hotspot--bud");
  const seedButton = document.querySelector(".seed-button");
  const replayButton = document.querySelector(".replay-button");
  const advanceCue = document.querySelector(".advance-cue");
  const finalScene = document.querySelector(".scene-4");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    scene: 0,
    previousScene: 0,
    width: 0,
    height: 0,
    dpr: 1,
    sceneStartedAt: performance.now(),
    transitionStartedAt: performance.now(),
    openingAt: 0,
    finalBloomAt: 0,
    finalBloomed: false,
    wheelLockedUntil: 0,
    pearls: [],
    finale: [],
    dust: [],
    ripples: [],
    pointer: {
      x: 0.5,
      y: 0.5,
      tx: 0.5,
      ty: 0.5,
      down: false,
      startX: 0,
      startY: 0,
    },
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(1, Math.round(rect.width));
    state.height = Math.max(1, Math.round(rect.height));
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    seedDust();
    seedPearls();
    seedFinale();
  }

  function seedDust() {
    const count = state.width < 520 ? 58 : 92;
    state.dust = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      r: 0.45 + Math.random() * 1.45,
      a: 0.18 + Math.random() * 0.52,
      s: 0.18 + Math.random() * 0.55,
      phase: i * 0.37 + Math.random() * Math.PI,
    }));
  }

  function seedPearls() {
    const count = state.width < 520 ? 760 : 1180;
    const cx = state.width * 0.5;
    const cy = state.height * 0.48;
    const scale = Math.min(state.width, state.height) * 0.42;
    const palette = [
      [255, 246, 211],
      [255, 153, 190],
      [255, 132, 116],
      [255, 205, 98],
      [155, 186, 255],
      [170, 232, 173],
      [219, 168, 255],
    ];

    state.pearls = Array.from({ length: count }, (_, i) => {
      let heartX = 0;
      let heartY = 0;
      for (let tries = 0; tries < 80; tries += 1) {
        const px = Math.random() * 2.8 - 1.4;
        const py = Math.random() * 2.6 - 1.25;
        const shape = (px * px + py * py - 1) ** 3 - px * px * py ** 3;
        if (shape <= 0) {
          heartX = px;
          heartY = py;
          break;
        }
      }

      const x = cx + heartX * scale * 0.58;
      const y = cy - heartY * scale * 0.58;
      const color = palette[(i + Math.floor(Math.random() * 2)) % palette.length];
      const balloonAngle = Math.random() * Math.PI * 2;
      const balloonFill = Math.sqrt(Math.random());
      const balloonTaper = Math.sin(balloonAngle) > 0 ? 1 - Math.sin(balloonAngle) * 0.36 : 1;
      const balloonX = Math.cos(balloonAngle) * balloonFill * balloonTaper;
      const balloonY = Math.sin(balloonAngle) * balloonFill * (Math.sin(balloonAngle) > 0 ? 1.14 : 0.92) - 0.07;
      const knot = Math.random() < 0.045;

      return {
        x: Math.random() * state.width,
        y: Math.random() * state.height,
        tx: x,
        ty: y,
        r: 0.9 + Math.random() * 1.1,
        a: 0.78 + Math.random() * 0.22,
        delay: Math.random() * 0.95,
        phase: Math.random() * Math.PI * 2,
        color,
        balloonX: knot ? (Math.random() - 0.5) * 0.18 : balloonX,
        balloonY: knot ? 1.02 + Math.random() * 0.18 : balloonY,
      };
    });
  }

  function seedFinale() {
    const count = state.width < 520 ? 138 : 230;
    const cx = state.width * 0.5;
    const cy = state.height * 0.49;
    const bloomRadius = Math.min(state.width, state.height) * 0.42;

    state.finale = Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.55) * bloomRadius;
      const petal = i % 5 === 0;
      return {
        x: cx,
        y: cy,
        angle,
        radius,
        r: petal ? 3.5 + Math.random() * 6 : 1.1 + Math.random() * 2.8,
        petal,
        spin: Math.random() * Math.PI,
        hue: petal ? "petal" : Math.random() > 0.46 ? "gold" : "pearl",
        delay: Math.random() * 0.58,
      };
    });
  }

  function setScene(index) {
    const next = Math.max(0, Math.min(scenes.length - 1, index));
    if (next === state.scene && next !== 4) return;

    state.previousScene = state.scene;
    state.scene = next;
    state.sceneStartedAt = performance.now();
    state.transitionStartedAt = state.sceneStartedAt;
    state.openingAt = 0;
    scenes.forEach((scene, i) => scene.classList.toggle("is-active", i === next));
    navButtons.forEach((button, i) => button.classList.toggle("is-active", i === next));

    if (next === 3) {
      seedPearls();
    }

    if (next === 4) {
      state.finalBloomed = false;
      state.finalBloomAt = 0;
      finalScene.classList.remove("is-bloomed");
      finalScene.classList.toggle("is-from-heart", state.previousScene === 3);
      seedFinale();
    } else {
      state.finalBloomed = false;
      finalScene.classList.remove("is-bloomed", "is-from-heart");
    }
  }

  function advance() {
    if (state.scene === 4) {
      if (!state.finalBloomed) bloomFinale();
      return;
    }
    setScene(state.scene + 1);
  }

  function retreat() {
    if (state.scene > 0) setScene(state.scene - 1);
  }

  function openBud() {
    if (state.scene !== 0 || state.openingAt) return;
    state.openingAt = performance.now();
    window.setTimeout(() => setScene(1), reducedMotion ? 120 : 820);
  }

  function bloomFinale() {
    if (state.scene !== 4 || state.finalBloomed) return;
    if (state.previousScene === 3 && performance.now() - state.transitionStartedAt < 2100) return;
    state.finalBloomed = true;
    state.finalBloomAt = performance.now();
    finalScene.classList.add("is-bloomed");
  }

  function addRipple(x, y) {
    state.ripples.push({ x, y, startedAt: performance.now() });
    if (state.ripples.length > 8) state.ripples.shift();
  }

  function addRippleFromClient(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    addRipple(clientX - rect.left, clientY - rect.top);
  }

  function sceneAge(now) {
    return (now - state.sceneStartedAt) / 1000;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  }

  function easeInOut(x) {
    const v = clamp(x, 0, 1);
    return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  }

  function drawBackdrop(now) {
    const { width: w, height: h } = state;
    const t = now * 0.00012;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#11060d");
    gradient.addColorStop(0.42, state.scene === 2 ? "#08111e" : "#2a0a19");
    gradient.addColorStop(1, "#060509");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 8; i += 1) {
      const y = h * (0.08 + i * 0.13) + Math.sin(t * 7 + i) * 14;
      const grad = ctx.createLinearGradient(-w * 0.15, y, w * 1.15, y + h * 0.12);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.45, i % 2 ? "rgba(241,134,162,0.035)" : "rgba(245,201,107,0.03)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 34 + i * 4;
      ctx.beginPath();
      ctx.moveTo(-w * 0.16, y);
      ctx.bezierCurveTo(w * 0.25, y - 80, w * 0.62, y + 96, w * 1.16, y - 24);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDust(now, intensity = 1) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    state.dust.forEach((p) => {
      const drift = now * 0.00022 * p.s;
      const x = (p.x + Math.sin(drift + p.phase) * 12 + state.width) % state.width;
      const y = (p.y - (drift * 48) % state.height + state.height) % state.height;
      const alpha = (0.18 + Math.sin(now * 0.001 + p.phase) * 0.14 + p.a) * 0.42 * intensity;
      ctx.fillStyle = `rgba(245, 201, 107, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawCover(now) {
    const { width: w, height: h } = state;
    const age = sceneAge(now);
    const cx = w * 0.5;
    const cy = h * 0.52;
    const pulse = 1 + Math.sin(now * 0.002) * 0.04;
    const opening = state.openingAt ? easeOutCubic((now - state.openingAt) / 780) : 0;
    const size = Math.min(w, h);
    drawDust(now, 1.28);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.16 * pulse + opening * 0.35, 1.16 * pulse + opening * 0.35);
    ctx.globalCompositeOperation = "screen";
    const aura = ctx.createRadialGradient(0, -8, 2, 0, 0, size * (0.28 + opening * 0.48));
    aura.addColorStop(0, `rgba(255, 252, 226, ${0.92 + opening * 0.08})`);
    aura.addColorStop(0.2, "rgba(245, 201, 107, .48)");
    aura.addColorStop(0.52, "rgba(255, 169, 190, .2)");
    aura.addColorStop(1, "rgba(241, 134, 162, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, size * (0.32 + opening * 0.42), 0, Math.PI * 2);
    ctx.fill();

    const layers = [
      { count: 10, spread: 48, width: 26, height: 82, alpha: 0.34, speed: 0.08 },
      { count: 9, spread: 30, width: 24, height: 68, alpha: 0.44, speed: -0.06 },
      { count: 7, spread: 13, width: 18, height: 50, alpha: 0.58, speed: 0.04 },
    ];

    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i += 1) {
        const angle = (Math.PI * 2 * i) / layer.count + age * layer.speed + layerIndex * 0.18;
        const spread = layer.spread + opening * (48 + layerIndex * 18);
        const breathe = 1 + Math.sin(age * 1.5 + i + layerIndex) * 0.045;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -spread);
        ctx.rotate(Math.sin(age + i) * 0.12);
        drawPetalShape(
          0,
          0,
          layer.width * breathe + opening * 14,
          layer.height * breathe + opening * 34,
          `rgba(255, ${186 + layerIndex * 20}, ${205 + layerIndex * 12}, ${layer.alpha + opening * 0.18})`,
          `rgba(255, 246, 229, ${0.18 + layerIndex * 0.05})`,
        );
        ctx.restore();
      }
    });

    const core = ctx.createRadialGradient(0, -4, 1, 0, -4, 64 + opening * 28);
    core.addColorStop(0, "rgba(255, 255, 244, 1)");
    core.addColorStop(0.18, "rgba(255, 226, 126, .9)");
    core.addColorStop(0.44, "rgba(245, 201, 107, .42)");
    core.addColorStop(1, "rgba(245, 201, 107, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, -4, 64 + opening * 28, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 22; i += 1) {
      const angle = (Math.PI * 2 * i) / 22 + age * 0.42;
      const radius = 76 + Math.sin(age * 1.8 + i) * 16 + opening * 74;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.68;
      const r = 1.2 + (i % 4) * 0.35;
      ctx.fillStyle = `rgba(245, 201, 107, ${0.34 + Math.sin(age * 2 + i) * 0.16})`;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = i === 0 ? "rgba(245, 201, 107, .82)" : "rgba(255, 211, 220, .48)";
      ctx.lineWidth = i === 0 ? 1.55 : 1;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        104 + i * 18 + opening * 130,
        55 + i * 16 + opening * 74,
        age * (0.54 + i * 0.1) + i * 1.35,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPetalShape(x, y, width, height, fillStyle, strokeStyle) {
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.48);
    ctx.bezierCurveTo(x - width * 0.72, y + height * 0.08, x - width * 0.44, y - height * 0.45, x, y - height * 0.5);
    ctx.bezierCurveTo(x + width * 0.5, y - height * 0.38, x + width * 0.76, y + height * 0.04, x, y + height * 0.48);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  function drawCarnation(now) {
    const { width: w, height: h, pointer } = state;
    const age = sceneAge(now);
    const bloom = reducedMotion ? 1 : easeInOut(age / 5);
    const parallaxX = (pointer.x - 0.5) * 24;
    const parallaxY = (pointer.y - 0.5) * 16;
    drawDust(now, 0.72);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const breeze = now * 0.0012;
    for (let i = 0; i < 22; i += 1) {
      const x = (i / 21) * w;
      const y = h * (0.24 + (i % 5) * 0.06) + Math.sin(breeze + i) * 28;
      const line = ctx.createLinearGradient(x - 80, y, x + 170, y + 50);
      line.addColorStop(0, "rgba(255,255,255,0)");
      line.addColorStop(0.5, "rgba(255,211,220,.075)");
      line.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 110, y);
      ctx.quadraticCurveTo(x + 30, y - 34, x + 180, y + 20);
      ctx.stroke();
    }
    ctx.restore();

    const baseX = w * 0.5;
    const baseY = h * 0.52;
    const scale = Math.min(w, h) * 0.0104;

    ctx.save();
    ctx.translate(baseX + parallaxX * 0.5, baseY + parallaxY * 0.2);
    ctx.scale(scale, scale);
    ctx.globalCompositeOperation = "screen";

    const layers = [
      { count: 18, radius: 72, length: 150, width: 36, color: [255, 170, 190, 0.23] },
      { count: 16, radius: 50, length: 128, width: 34, color: [241, 134, 162, 0.34] },
      { count: 13, radius: 30, length: 104, width: 28, color: [255, 211, 220, 0.42] },
      { count: 9, radius: 14, length: 74, width: 22, color: [255, 238, 228, 0.48] },
    ];

    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i += 1) {
        const part = easeInOut((bloom - layerIndex * 0.1) / 0.86);
        if (part <= 0) continue;
        const angle = (Math.PI * 2 * i) / layer.count + layerIndex * 0.42 + Math.sin(age + i) * 0.025;
        const curl = Math.sin(age * 0.8 + i * 0.7) * 7;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(parallaxX * layerIndex * 0.08, -layer.radius * part);
        ctx.rotate(curl * Math.PI / 180);
        const [r, g, b, a] = layer.color;
        drawPetalShape(
          0,
          0,
          layer.width * part,
          layer.length * part,
          `rgba(${r}, ${g}, ${b}, ${a})`,
          "rgba(255, 244, 223, .13)",
        );
        ctx.restore();
      }
    });

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const quietCore = ctx.createRadialGradient(0, 0, 2, 0, 0, 48);
    quietCore.addColorStop(0, "rgba(104, 34, 52, .3)");
    quietCore.addColorStop(0.58, "rgba(92, 24, 44, .2)");
    quietCore.addColorStop(1, "rgba(92, 24, 44, 0)");
    ctx.fillStyle = quietCore;
    ctx.beginPath();
    ctx.arc(0, 0, 50 * bloom, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18 + age * 0.08;
      const start = 10 * bloom;
      const end = (28 + Math.sin(age * 1.2 + i) * 4) * bloom;
      ctx.strokeStyle = "rgba(245, 201, 107, .28)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start);
      ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 231, 177, .5)";
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * end, Math.sin(angle) * end, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255, 211, 220, .22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 34 * bloom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawMoonGarden(now) {
    const { width: w, height: h, pointer } = state;
    const age = sceneAge(now);
    const breeze = Math.sin(age * 0.55) * 0.035 + Math.sin(age * 0.23 + 1.7) * 0.025;
    const lightX = w * (0.58 + breeze + (pointer.x - 0.5) * 0.1);

    if (state.previousScene === 1) {
      const warmth = 1 - easeInOut((now - state.transitionStartedAt) / 2800);
      if (warmth > 0) {
        ctx.save();
        ctx.globalAlpha = warmth;
        const veil = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.48, Math.max(w, h) * 0.72);
        veil.addColorStop(0, "rgba(255, 213, 220, .34)");
        veil.addColorStop(0.48, "rgba(126, 48, 70, .3)");
        veil.addColorStop(1, "rgba(18, 6, 13, 0)");
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 15; i += 1) {
      const y = h * (0.16 + i * 0.045) + Math.sin(age * 0.9 + i) * 10;
      const xShift = Math.sin(age * 0.42 + i * 0.7) * w * 0.035;
      const wind = ctx.createLinearGradient(-w * 0.1 + xShift, y, w * 1.1 + xShift, y + 26);
      wind.addColorStop(0, "rgba(217,231,255,0)");
      wind.addColorStop(0.5, "rgba(217,231,255,.045)");
      wind.addColorStop(1, "rgba(217,231,255,0)");
      ctx.strokeStyle = wind;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(-w * 0.12 + xShift, y);
      ctx.bezierCurveTo(w * 0.22 + xShift, y - 24, w * 0.64 - xShift * 0.4, y + 32, w * 1.12 - xShift, y);
      ctx.stroke();
    }

    for (let i = 0; i < 6; i += 1) {
      const offset = (i - 2.5) * w * 0.055;
      const sway = Math.sin(age * 0.72 + i * 0.86) * 22 + Math.sin(age * 0.31 + i) * 12;
      const topX = lightX + offset * 0.42 + sway * 0.25;
      const midX = lightX + offset + sway + (pointer.x - 0.5) * 46;
      const lowX = lightX + offset * 1.25 + sway * 0.7 + (pointer.x - 0.5) * 72;
      const beam = ctx.createLinearGradient(topX, h * 0.22, lowX, h * 0.92);
      beam.addColorStop(0, "rgba(217,231,255,.13)");
      beam.addColorStop(0.48, "rgba(255,244,223,.055)");
      beam.addColorStop(1, "rgba(217,231,255,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(topX - 10, h * 0.2);
      ctx.bezierCurveTo(midX - 42, h * 0.42, lowX - 58, h * 0.68, lowX - 74, h);
      ctx.bezierCurveTo(lowX - 22, h * 0.94, lowX + 18, h * 0.94, lowX + 72, h);
      ctx.bezierCurveTo(midX + 42, h * 0.68, midX + 34, h * 0.42, topX + 10, h * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 244, 223, .045)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(topX, h * 0.22);
      ctx.bezierCurveTo(midX + Math.sin(i) * 12, h * 0.46, lowX - Math.cos(i) * 18, h * 0.74, lowX, h);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(0, h * 0.78);
    for (let i = 0; i < 32; i += 1) {
      const x = (i / 31) * w;
      const stem = 46 + (i % 7) * 11 + Math.sin(age + i) * 5;
      const lit = Math.max(0, 1 - Math.abs(x - lightX) / (w * 0.28));
      ctx.strokeStyle = `rgba(${95 + lit * 110}, ${144 + lit * 80}, ${112 + lit * 90}, ${0.23 + lit * 0.35})`;
      ctx.lineWidth = 1.1 + lit * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.2);
      ctx.bezierCurveTo(x - 12, h * 0.1, x + Math.sin(i) * 16, 22, x + Math.sin(i * 2) * 11, -stem);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 211, 220, ${0.08 + lit * 0.42})`;
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(i * 2) * 11, -stem, 8 + lit * 5, 4 + lit * 3, Math.sin(i), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPearlGather(now) {
    const { width: w, height: h } = state;
    const age = sceneAge(now);
    const gather = reducedMotion ? 1 : easeInOut(age / 6);
    drawDust(now, 0.58);

    if (state.previousScene === 2) {
      const night = 1 - easeInOut((now - state.transitionStartedAt) / 3200);
      if (night > 0) {
        ctx.save();
        ctx.globalAlpha = night;
        const veil = ctx.createLinearGradient(0, 0, w, h);
        veil.addColorStop(0, "rgba(8, 17, 30, .78)");
        veil.addColorStop(0.5, "rgba(18, 25, 45, .5)");
        veil.addColorStop(1, "rgba(42, 12, 24, 0)");
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    state.pearls.forEach((p) => {
      const local = easeInOut((gather - p.delay * 0.14) / 0.9);
      const wave = Math.sin(now * 0.0012 + p.phase) * 2.2;
      const x = p.x + (p.tx - p.x) * local + Math.sin(now * 0.0008 + p.phase) * 8 * (1 - local);
      const y = p.y + (p.ty - p.y) * local + wave;
      const twinkle = 0.72 + Math.sin(now * 0.0024 + p.phase) * 0.24;
      const [r, g, b] = p.color;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.a * twinkle})`;
      const dot = p.r * (0.95 + local * 0.42);
      ctx.fillRect(x - dot * 0.5, y - dot * 0.5, dot, dot);

      if (local > 0.68 && p.r > 1.35) {
        ctx.fillStyle = `rgba(255, 250, 230, ${(local - 0.68) * 0.78})`;
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    });

    state.ripples = state.ripples.filter((ripple) => {
      const life = (now - ripple.startedAt) / 900;
      if (life > 1) return false;
      ctx.strokeStyle = `rgba(255, 244, 223, ${(1 - life) * 0.34})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, 16 + life * 88, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });
    ctx.restore();
  }

  function drawHeartIntoBalloon(now) {
    if (state.finalBloomed) return 1;

    const { width: w, height: h } = state;
    const cx = w * 0.5;
    const cy = h * 0.49;
    const fromHeart = state.previousScene === 3;
    const progress = fromHeart ? easeInOut((now - state.transitionStartedAt) / 2300) : 1;
    const heartScale = 1 - progress * 0.76;
    const driftUp = Math.sin(progress * Math.PI) * -18;
    const balloonScale = Math.min(w, h) * 0.16;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    state.pearls.forEach((p) => {
      const [r, g, b] = p.color;
      const startX = cx + (p.tx - cx) * heartScale;
      const startY = cy + (p.ty - cy) * heartScale + driftUp;
      const endX = cx + p.balloonX * balloonScale * 0.92;
      const endY = cy - 4 + p.balloonY * balloonScale;
      const x = fromHeart ? startX + (endX - startX) * progress : endX;
      const y = (fromHeart ? startY + (endY - startY) * progress : endY) + Math.sin(now * 0.002 + p.phase) * (1.8 - progress);
      const alpha = (0.55 + progress * 0.38) * p.a;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      const dot = p.r * (0.92 + progress * 0.28);
      ctx.fillRect(x - dot * 0.5, y - dot * 0.5, dot, dot);
    });

    ctx.restore();
    return progress;
  }

  function drawFinale(now) {
    const { width: w, height: h } = state;
    const cx = w * 0.5;
    const cy = h * 0.49;
    drawDust(now, state.finalBloomed ? 1.2 : 0.46);

    if (!state.finalBloomed) {
      drawHeartIntoBalloon(now);
      return;
    }

    const bloom = easeOutCubic((now - state.finalBloomAt) / 3200);
    const settle = easeInOut((now - state.finalBloomAt - 1700) / 2700);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const aura = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.min(w, h) * 0.56);
    aura.addColorStop(0, `rgba(255, 244, 223, ${0.3 * (1 - settle)})`);
    aura.addColorStop(0.34, "rgba(241, 134, 162, .2)");
    aura.addColorStop(0.7, "rgba(245, 201, 107, .08)");
    aura.addColorStop(1, "rgba(245, 201, 107, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.58, 0, Math.PI * 2);
    ctx.fill();

    state.finale.forEach((p) => {
      const local = easeOutCubic((bloom - p.delay * 0.12) / 0.92);
      const outward = p.radius * local;
      const orbit = (now - state.finalBloomAt) * 0.00028;
      const x = cx + Math.cos(p.angle + orbit) * outward * (1 - settle * 0.28);
      const y = cy + Math.sin(p.angle + orbit) * outward * (1 - settle * 0.55) - settle * Math.min(h * 0.08, 58);
      const alpha = (1 - Math.max(0, settle - 0.3) * 0.8) * (0.42 + local * 0.58);

      if (p.petal) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.angle + p.spin + settle * 1.2);
        const color = p.hue === "petal" ? `rgba(255, 174, 194, ${alpha * 0.58})` : `rgba(245, 201, 107, ${alpha})`;
        drawPetalShape(0, 0, p.r * 1.3, p.r * 4.7, color, `rgba(255, 244, 223, ${alpha * 0.12})`);
        ctx.restore();
      } else {
        const fill = p.hue === "gold"
          ? `rgba(245, 201, 107, ${alpha})`
          : `rgba(255, 248, 232, ${alpha * 0.84})`;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x, y, p.r * (0.8 + local * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    for (let i = 0; i < 11; i += 1) {
      const a = (Math.PI * 2 * i) / 11 + bloom * 1.4;
      const r = Math.min(w, h) * (0.12 + bloom * 0.36);
      ctx.strokeStyle = `rgba(245, 201, 107, ${(1 - settle * 0.7) * 0.2})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a, a + 0.65);
      ctx.stroke();
    }
    ctx.restore();
  }

  function frame(now) {
    state.pointer.x += (state.pointer.tx - state.pointer.x) * 0.08;
    state.pointer.y += (state.pointer.ty - state.pointer.y) * 0.08;
    ctx.clearRect(0, 0, state.width, state.height);
    drawBackdrop(now);

    if (state.scene === 0) drawCover(now);
    if (state.scene === 1) drawCarnation(now);
    if (state.scene === 2) drawMoonGarden(now);
    if (state.scene === 3) drawPearlGather(now);
    if (state.scene === 4) drawFinale(now);

    requestAnimationFrame(frame);
  }

  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    state.pointer.tx = clamp((clientX - rect.left) / rect.width, 0, 1);
    state.pointer.ty = clamp((clientY - rect.top) / rect.height, 0, 1);
  }

  budButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openBud();
  });

  seedButton.addEventListener("click", (event) => {
    event.stopPropagation();
    bloomFinale();
  });

  replayButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setScene(0);
  });

  advanceCue.addEventListener("click", (event) => {
    event.stopPropagation();
    advance();
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setScene(Number(button.dataset.target));
    });
  });

  window.addEventListener("pointerdown", (event) => {
    state.pointer.down = true;
    state.pointer.startX = event.clientX;
    state.pointer.startY = event.clientY;
    updatePointer(event.clientX, event.clientY);
  });

  window.addEventListener("pointermove", (event) => {
    updatePointer(event.clientX, event.clientY);
  });

  window.addEventListener("pointerup", (event) => {
    if (!state.pointer.down) return;
    state.pointer.down = false;
    updatePointer(event.clientX, event.clientY);
    const dx = event.clientX - state.pointer.startX;
    const dy = event.clientY - state.pointer.startY;

    if (state.scene === 3 && Math.abs(dx) < 16 && Math.abs(dy) < 16) {
      addRippleFromClient(event.clientX, event.clientY);
      return;
    }

    if (Math.abs(dy) > 44 && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) advance();
      else retreat();
    }
  });

  window.addEventListener("wheel", (event) => {
    const now = performance.now();
    if (now < state.wheelLockedUntil || Math.abs(event.deltaY) < 16) return;
    state.wheelLockedUntil = now + 850;
    if (event.deltaY > 0) advance();
    else retreat();
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") advance();
    if (event.key === "ArrowUp" || event.key === "PageUp") retreat();
    if (event.key === "Enter" && state.scene === 4) bloomFinale();
  });

  window.addEventListener("resize", resize);
  resize();

  const rawParams = window.location.search.slice(1) || window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(rawParams);
  const debugScene = Number(params.get("scene"));
  if (Number.isInteger(debugScene) && debugScene >= 0 && debugScene < scenes.length) {
    setScene(debugScene);
    if (debugScene === 4 && params.get("bloom") === "1") {
      window.setTimeout(bloomFinale, 140);
    }
  }

  requestAnimationFrame(frame);
})();
