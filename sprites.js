/* ============================================================
   Masonite — Sprite engine (Blueprint Workshop)
   Procedural pixel-art on canvas. Every sprite is drawn from
   rectangles on a virtual cell grid, so it's pixel-crisp at any
   DPR, re-themeable from the active palette's CSS variables, and
   it degrades to a clean still frame when motion is frozen
   (reduced-motion / offscreen capture).
   ============================================================ */
(function () {
  "use strict";

  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function theme() {
    var cs = getComputedStyle(document.documentElement);
    var v = function (n) { return cs.getPropertyValue(n).trim(); };
    return {
      ink: v("--ink") || "#0B1220",
      accent: v("--accent") || "#1F5BFF",
      accentH: v("--accent-hover") || "#1742D6",
      tint: v("--accent-tint") || "#E7EEFF",
      surface: v("--surface") || "#fff",
      paper: v("--paper") || "#F4F6FA",
      muted: v("--muted") || "#5B6472",
      grid: v("--grid") || "#E2E7F0",
      brandVl: v("--brand-vl") || "#9C82F2",
      brandVd: v("--brand-vd") || "#4A33A6",
      brandRidge: v("--brand-ridge") || "#C9BBFF"
    };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ── Sprite wrapper ──────────────────────────────────────────
  var registry = [];
  function Sprite(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.draw = opts.draw;
    this.GW = opts.GW; this.GH = opts.GH;
    this.fps = opts.fps || 12;
    this.loop = !!opts.loop;
    this.t0 = performance.now();
    this.playing = false;
    this.progress = opts.progress != null ? opts.progress : 0; // for scroll/hover one-shots
    this.hovered = false;
    this.resize();
    registry.push(this);
    this.render();
  }
  Sprite.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.canvas.clientWidth || 200, h = this.canvas.clientHeight || 200;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.imageSmoothingEnabled = false;
    var s = Math.floor(Math.min(this.canvas.width / this.GW, this.canvas.height / this.GH));
    if (s < 1) s = 1;
    this.s = s;
    this.ox = Math.floor((this.canvas.width - s * this.GW) / 2);
    this.oy = Math.floor((this.canvas.height - s * this.GH) / 2);
  };
  Sprite.prototype.geo = function () {
    var self = this, ctx = this.ctx, s = this.s, ox = this.ox, oy = this.oy;
    return {
      s: s, ox: ox, oy: oy, GW: this.GW, GH: this.GH,
      W: this.canvas.width, H: this.canvas.height,
      // fill cells: gx,gy,gw,gh in grid units
      f: function (gx, gy, gw, gh, color) {
        ctx.fillStyle = color;
        ctx.fillRect(ox + Math.round(gx * s), oy + Math.round(gy * s),
                     Math.ceil(gw * s), Math.ceil(gh * s));
      }
    };
  };
  Sprite.prototype.render = function (tMs) {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.draw(ctx, (tMs == null ? (REDUCE ? 1400 : 0) : tMs), theme(), this.geo(), this);
  };
  Sprite.prototype.start = function () {
    if (REDUCE || !this.loop) return;
    this.playing = true;
  };
  Sprite.prototype.stop = function () { this.playing = false; };

  // shared ticker
  var ticking = false;
  function tick(now) {
    for (var i = 0; i < registry.length; i++) {
      var sp = registry[i];
      if (sp.playing || sp._anim) sp.render(now - sp.t0);
    }
    requestAnimationFrame(tick);
  }
  function ensureTick() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }

  // ════════════════════════════════════════════════════════════
  //  A. HERO BUILDER — a mason laying bricks onto a rising wall
  // ════════════════════════════════════════════════════════════
  // grid 60 x 46
  var WALL = (function () {
    var slots = [], rows = 5, perRow = 3, bw = 6, bh = 3, gap = 1, x0 = 33, yBase = 38;
    for (var r = 0; r < rows; r++) {
      var off = (r % 2) ? -3 : 0;
      for (var c = 0; c < perRow; c++) {
        slots.push({ x: x0 + off + c * (bw + gap), y: yBase - r * (bh + gap), w: bw, h: bh });
      }
    }
    return slots;
  })();

  function drawBuilder(ctx, tMs, C, g) {
    var f = g.f;
    var cycle = 520, total = WALL.length, cycles = total + 3; // +pause
    var idx = Math.floor(tMs / cycle) % cycles;
    var phase = (tMs % cycle) / cycle;
    var placed = Math.min(idx, total);

    // ground shadow line
    f(6, 41, 48, 1, C.grid);

    // settled bricks
    for (var i = 0; i < placed; i++) drawBrick(g, C, WALL[i]);

    // mason bob
    var bob = REDUCE ? 0 : Math.round(Math.sin(tMs / 320) * 0.5);
    var handX = 24, handY = 26 + bob; // rest hand pos (grid)

    // in-progress brick + reaching arm
    if (idx < total) {
      var slot = WALL[idx];
      var p = Math.min(phase / 0.72, 1);
      var e = easeInOut(p);
      var bx = Math.round(lerp(handX, slot.x, e));
      var by = Math.round(lerp(handY, slot.y, e));
      if (phase < 0.72) {
        drawBrick(g, C, { x: bx, y: by, w: slot.w, h: slot.h });
        handX = bx; handY = by;
      } else {
        drawBrick(g, C, slot); // just placed
        var rp = (phase - 0.72) / 0.28;
        handX = Math.round(lerp(slot.x, 24, easeOut(rp)));
        handY = Math.round(lerp(slot.y, 26 + bob, easeOut(rp)));
      }
    }

    drawMason(g, C, bob, handX, handY);
  }

  function drawBrick(g, C, b) {
    var f = g.f;
    f(b.x, b.y, b.w, b.h, C.accent);
    // bevel highlight + mortar
    f(b.x, b.y, b.w, 1, mix(C.accent, "#ffffff", 0.28));
    f(b.x, b.y + b.h - 1, b.w, 1, C.accentH);
    f(b.x + Math.floor(b.w / 2), b.y, 1, b.h, mix(C.accent, C.accentH, 0.6));
  }

  function drawMason(g, C, bob, hx, hy) {
    var f = g.f, y = bob;
    // legs
    f(13, 34 + y, 3, 6, C.ink); f(18, 34 + y, 3, 6, C.ink);
    f(13, 39 + y, 3, 1, C.accentH); f(18, 39 + y, 3, 1, C.accentH); // boots
    // body / overalls
    f(11, 25 + y, 12, 10, C.ink);
    f(15, 26 + y, 4, 6, C.accent); // bib
    f(16, 28 + y, 2, 1, mix(C.accent, "#fff", 0.3)); // bib detail
    // back arm (resting)
    f(9, 26 + y, 2, 7, C.ink);
    // head
    f(13, 17 + y, 8, 8, C.surface);
    f(13, 17 + y, 8, 8, C.surface);
    f(15, 20 + y, 2, 2, C.ink); // eye
    f(18, 20 + y, 2, 2, C.ink); // eye
    f(14, 23 + y, 6, 1, C.muted); // mouth/jaw
    // outline-ish shade on face right
    f(20, 17 + y, 1, 8, C.grid);
    // hard hat
    f(11, 14 + y, 12, 2, C.accent); // brim
    f(14, 11 + y, 6, 3, C.accent);  // dome
    f(14, 11 + y, 6, 1, mix(C.accent, "#fff", 0.3));
    f(16, 13 + y, 2, 1, C.accentH); // ridge
    // front arm reaching toward hand (hx,hy)
    drawArm(g, C, 22, 26 + y, hx + 1, hy + 1);
  }

  function drawArm(g, C, sx, sy, hx, hy) {
    // simple 2-segment arm drawn as small blocks along the line
    var steps = 6;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var x = Math.round(lerp(sx, hx, t));
      var yy = Math.round(lerp(sy, hy, t));
      g.f(x, yy, 2, 2, C.ink);
    }
    g.f(hx - 1, hy - 1, 3, 3, C.accentH); // glove
  }

  // ════════════════════════════════════════════════════════════
  //  B. SCROLL BUILD — a structure assembles by scroll progress
  // ════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════
  //  B. SCROLL BUILD — the Great Pyramid assembles by scroll
  // ════════════════════════════════════════════════════════════
  // grid 86 x 56. A clean two-tone SOLID pyramid (the brand mark)
  // rises from its base as scroll progresses; drafting scaffold
  // fades out as it completes. Final state matches the logo mark.
  var PY = { cx: 43, apexY: 9, baseY: 48, halfW: 33 };

  function drawScrollBuild(ctx, tMs, C, g, sp) {
    var f = g.f, P = PY;
    var prog = Math.max(0, Math.min(1, sp.progress));
    var e = easeInOut(prog);
    var revealY = P.baseY - e * (P.baseY - P.apexY);
    var topY = Math.max(Math.floor(revealY), P.apexY);

    // ground line
    f(P.cx - P.halfW - 2, P.baseY + 1, (P.halfW + 2) * 2, 1, C.grid);

    // drafting scaffold (target outline + dimensions) fades as it completes
    var sa = 1 - Math.min(prog * 1.35, 1);
    if (sa > 0.02) {
      ctx.globalAlpha = sa;
      pyOutline(g, C.grid);
      drawDimLine(g, C, P.cx - P.halfW, P.baseY + 4, P.cx + P.halfW, "horiz");
      drawDimLine(g, C, P.cx - P.halfW - 5, P.apexY, P.baseY, "vert");
      ctx.globalAlpha = 1;
    }

    // solid two-tone fill, scanline by row from base up to revealY
    for (var y = P.baseY; y >= topY; y--) {
      var t = (P.baseY - y) / (P.baseY - P.apexY);
      if (t > 1) t = 1;
      var w = P.halfW * (1 - t);
      f(P.cx - w, y, w, 1, C.brandVl);     // lit face (left)
      f(P.cx, y, w, 1, C.brandVd);         // shadow face (right)
    }
    // subtle stone-course lines in the revealed area
    for (var cy = P.baseY - 4; cy >= topY; cy -= 4) {
      var tt = (P.baseY - cy) / (P.baseY - P.apexY);
      var ww = P.halfW * (1 - tt);
      ctx.globalAlpha = 0.16;
      f(P.cx - ww, cy, ww * 2, 0.5, C.brandRidge);
      ctx.globalAlpha = 1;
    }
    // front ridge highlight (revealed portion only)
    f(P.cx, topY, 0.8, P.baseY - topY, C.brandRidge);
    if (prog > 0.9) f(P.cx - 1, P.apexY, 2, 2, C.brandRidge); // apex cap
  }

  function pyOutline(g, col) {
    var P = PY, steps = 44;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, y = lerp(P.baseY, P.apexY, t);
      g.f(Math.round(lerp(P.cx - P.halfW, P.cx, t)), Math.round(y), 0.7, 0.7, col);
      g.f(Math.round(lerp(P.cx + P.halfW, P.cx, t)), Math.round(y), 0.7, 0.7, col);
    }
    g.f(P.cx - P.halfW, P.baseY, P.halfW * 2, 0.7, col);
  }

  function drawDimLine(g, C, a, b, c, dir) {
    // dimension line with end ticks
    if (dir === "horiz") {
      g.f(a, b, c - a, 0.4, C.muted);
      g.f(a, b - 1, 0.4, 3, C.muted); g.f(c, b - 1, 0.4, 3, C.muted);
    } else {
      g.f(a, b, 0.4, c - b, C.muted);
      g.f(a - 1, b, 3, 0.4, C.muted); g.f(a - 1, c, 3, 0.4, C.muted);
    }
  }

  // ════════════════════════════════════════════════════════════
  //  C. FEATURE MICRO-SPRITES — 16x16 glyphs that animate on hover
  // ════════════════════════════════════════════════════════════
  function GD(name) { return GLYPHS[name] || GLYPHS._brick; }
  var GLYPHS = {
    // each: function(g, C, t, hov)  — t ms while hovered, else 0 (static)
    orm: function (g, C, t, hov) {
      var f = g.f, pulse = hov ? (Math.sin(t / 120) * 0.5 + 0.5) : 0;
      // database cylinder
      f(3, 3, 10, 2, C.accent);
      f(3, 5, 10, 6, mix(C.accent, C.accentH, 0.4));
      f(3, 11, 10, 2, C.accentH);
      f(3, 7, 10, 1, mix(C.accent, "#fff", 0.3 + pulse * 0.4));
      f(3, 9, 10, 1, mix(C.accent, "#fff", 0.3 + (1 - pulse) * 0.4));
    },
    routing: function (g, C, t, hov) {
      var f = g.f;
      f(2, 3, 3, 3, C.accent); f(11, 10, 3, 3, C.accent);
      f(4, 4, 8, 1, C.ink); f(11, 4, 1, 7, C.ink);
      var p = hov ? ((t / 700) % 1) : 0.5;
      var dx = Math.round(lerp(4, 11, p < 0.5 ? p * 2 : 1));
      var dy = p < 0.5 ? 4 : Math.round(lerp(4, 11, (p - 0.5) * 2));
      f(dx, dy, 2, 2, C.accentH);
    },
    controllers: function (g, C, t, hov) {
      var f = g.f, o = hov ? Math.round(Math.sin(t / 140) * 2) : 0;
      f(3, 4, 1, 8, C.ink); f(8, 4, 1, 8, C.ink); f(13, 4, 1, 8, C.ink);
      f(2, 5 + o, 3, 2, C.accent);
      f(7, 8 - o, 3, 2, C.accent);
      f(12, 6 + o, 3, 2, C.accent);
    },
    auth: function (g, C, t, hov) {
      var f = g.f, open = hov ? Math.min(t / 300, 1) : 0;
      f(4, 8, 8, 6, C.accent); f(4, 8, 8, 1, mix(C.accent, "#fff", 0.3));
      f(7, 10, 2, 2, C.ink); // keyhole
      var sh = Math.round(lerp(0, -2, open));
      f(5, 5 + sh, 1, 3, C.ink); f(10, 5 + sh, 1, 3, C.ink); f(5, 4 + sh, 6, 1, C.ink);
    },
    queues: function (g, C, t, hov) {
      var f = g.f, shift = hov ? Math.round((t / 160) % 4) : 0;
      for (var i = 0; i < 3; i++) {
        var x = 2 + ((i * 5 + shift) % 14);
        f(x, 6, 4, 4, C.accent); f(x, 6, 4, 1, mix(C.accent, "#fff", 0.3));
      }
      f(1, 11, 14, 1, C.ink); // belt
    },
    scheduling: function (g, C, t, hov) {
      var f = g.f;
      ring(g, C, 8, 8, 6, C.ink);
      f(7, 7, 2, 2, C.accent);
      var ang = hov ? (t / 500) : -Math.PI / 4;
      var hx = Math.round(8 + Math.cos(ang) * 3), hy = Math.round(8 + Math.sin(ang) * 3);
      g.f(8, 8, 1, 1, C.accentH);
      line(g, C.accentH, 8, 8, hx, hy);
    },
    mail: function (g, C, t, hov) {
      var f = g.f, open = hov ? (Math.sin(t / 220) * 0.5 + 0.5) : 0;
      f(2, 5, 12, 8, C.accent); f(2, 5, 12, 1, mix(C.accent, "#fff", 0.3));
      var fy = Math.round(lerp(5, 3, open));
      f(2, 5, 6, 4, C.accentH); f(8, 5, 6, 4, C.accentH); // flap halves base
      // moving flap (triangle-ish)
      f(2, fy, 12, 1, C.ink);
      f(7, fy + 2, 2, 2, mix(C.accent, "#fff", 0.4));
    },
    notifications: function (g, C, t, hov) {
      var f = g.f, sw = hov ? Math.round(Math.sin(t / 110) * 1.5) : 0;
      f(6 + sw, 3, 4, 2, C.accent);
      f(5 + sw, 5, 6, 5, C.accent); f(5 + sw, 5, 6, 1, mix(C.accent, "#fff", 0.3));
      f(4 + sw, 10, 8, 1, C.ink);
      f(7 + sw, 12, 2, 2, C.accentH); // clapper
    },
    events: function (g, C, t, hov) {
      var f = g.f, on = hov ? (Math.floor(t / 120) % 2) : 1;
      var col = on ? C.accent : C.accentH;
      f(8, 2, 3, 6, col); f(5, 7, 6, 2, col); f(6, 8, 4, 6, col);
      if (on) f(7, 6, 2, 2, mix(C.accent, "#fff", 0.5));
    },
    validation: function (g, C, t, hov) {
      var f = g.f, p = hov ? Math.min(t / 350, 1) : 1;
      ring(g, C, 8, 8, 6, C.ink);
      // checkmark draws in
      if (p > 0.2) line(g, C.accent, 5, 8, 7, 10);
      if (p > 0.6) line(g, C.accent, 7, 10, 11, 5);
    },
    facades: function (g, C, t, hov) {
      var f = g.f, o = hov ? Math.round(Math.sin(t / 160) * 1.5) : 0;
      f(2, 2, 5, 5, C.accent); f(9, 2, 5, 5, mix(C.accent, C.accentH, 0.4));
      f(2 + o, 9, 5, 5, C.accentH); f(9, 9 + o, 5, 5, C.accent);
    },
    tinker: function (g, C, t, hov) {
      var f = g.f, blink = hov ? (Math.floor(t / 250) % 2) : 1;
      f(2, 3, 12, 10, C.ink); f(2, 3, 12, 1, C.muted);
      line(g, C.accent, 4, 7, 6, 9); line(g, C.accent, 6, 9, 4, 11);
      if (blink) f(8, 10, 4, 1, C.accent); // cursor line
    },
    api: function (g, C, t, hov) {
      var f = g.f, o = hov ? Math.round(Math.sin(t / 150) * 1) : 0;
      // < >
      line(g, C.accent, 6 - o, 4, 3 - o, 8); line(g, C.accent, 3 - o, 8, 6 - o, 12);
      line(g, C.accent, 10 + o, 4, 13 + o, 8); line(g, C.accentH, 13 + o, 8, 10 + o, 12);
    },
    caching: function (g, C, t, hov) {
      var f = g.f, on = hov ? (Math.floor(t / 130) % 2) : 1;
      var col = on ? C.accent : C.accentH;
      f(8, 2, 3, 6, col); f(5, 8, 6, 2, col); f(6, 8, 3, 6, col); // bolt
    },
    logging: function (g, C, t, hov) {
      var f = g.f;
      f(3, 2, 10, 12, C.surface); f(3, 2, 10, 12, C.surface);
      g.f(3, 2, 10, 1, C.ink); g.f(3, 13, 10, 1, C.ink); g.f(3, 2, 1, 12, C.ink); g.f(12, 2, 1, 12, C.ink);
      var lines = hov ? (Math.floor(t / 200) % 4) + 1 : 4;
      for (var i = 0; i < lines; i++) g.f(5, 4 + i * 2, (i % 2 ? 5 : 6), 1, i === 0 ? C.accent : C.muted);
    },
    _brick: function (g, C, t, hov) {
      var f = g.f, r = hov ? Math.min(t / 300, 1) : 1;
      drawBrick(g, C, { x: 3, y: 6, w: 10, h: 4 });
    }
  };
  function ring(g, C, cx, cy, r, col) {
    // crude pixel ring
    for (var a = 0; a < 360; a += 18) {
      var x = Math.round(cx + Math.cos(a * Math.PI / 180) * r) - 1;
      var y = Math.round(cy + Math.sin(a * Math.PI / 180) * r) - 1;
      g.f(x, y, 1.4, 1.4, col);
    }
  }
  function line(g, col, x0, y0, x1, y1) {
    var steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      g.f(Math.round(lerp(x0, x1, t)), Math.round(lerp(y0, y1, t)), 1.6, 1.6, col);
    }
  }

  // ════════════════════════════════════════════════════════════
  //  D. LOADER — tumbling brick (loop)
  // ════════════════════════════════════════════════════════════
  function drawLoader(ctx, tMs, C, g) {
    var f = g.f;
    var phase = (tMs / 700) % 1;
    var x = Math.round(lerp(1, g.GW - 7, phase));
    var hop = Math.abs(Math.sin(phase * Math.PI * 2)) * 3;
    var y = Math.round(g.GH - 6 - hop);
    var rot = Math.floor(phase * 4) % 2; // fake tumble
    drawBrick(g, C, { x: x, y: y, w: 6, h: 3 });
    if (rot) f(x + 1, y + 1, 1, 1, C.surface);
    f(1, g.GH - 1, g.GW - 2, 1, C.grid); // ground
  }

  // ════════════════════════════════════════════════════════════
  //  E. HERO SCENE — the mason builds the Great Pyramid (big, loops)
  // ════════════════════════════════════════════════════════════
  // grid 128 x 100
  var HPY = { cx: 80, apexY: 16, baseY: 88, halfW: 42 };
  function drawHeroScene(ctx, tMs, C, g) {
    var f = g.f, P = HPY;
    var total = 9000, buildDur = 6200;
    var tt = REDUCE ? buildDur : ((tMs + 3400) % total);
    var p = Math.min(tt / buildDur, 1);
    var e = easeInOut(p);
    var fillTop = P.baseY - e * (P.baseY - P.apexY);
    var topY = Math.max(Math.floor(fillTop), P.apexY);

    f(10, P.baseY + 1, 112, 1, C.grid); // ground line

    // target scaffold outline (fades as it completes)
    ctx.globalAlpha = 0.55 * (1 - p * 0.65);
    pyOutlineAt(g, P, C.grid);
    ctx.globalAlpha = 1;

    // two-tone solid fill, scanline base -> fillTop
    for (var y = P.baseY; y >= topY; y--) {
      var t = (P.baseY - y) / (P.baseY - P.apexY); if (t > 1) t = 1;
      var w = P.halfW * (1 - t);
      f(P.cx - w, y, w, 1, C.brandVl);
      f(P.cx, y, w, 1, C.brandVd);
    }
    // stone courses
    for (var cy = P.baseY - 5; cy >= topY; cy -= 5) {
      var tt2 = (P.baseY - cy) / (P.baseY - P.apexY);
      var ww = P.halfW * (1 - tt2);
      ctx.globalAlpha = 0.15; f(P.cx - ww, cy, ww * 2, 0.5, C.brandRidge); ctx.globalAlpha = 1;
    }
    f(P.cx, topY, 0.9, P.baseY - topY, C.brandRidge); // front ridge
    if (p > 0.95) f(P.cx - 1, P.apexY, 2, 2, C.brandRidge); // apex cap

    // a brick carried up to the current course
    if (p < 1 && !REDUCE) {
      var sub = (tMs % 760) / 760;
      var bx = lerp(34, P.cx - 9, easeOut(sub));
      var by = lerp(P.baseY - 6, fillTop + 1, easeOut(sub));
      drawBrick(g, C, { x: Math.round(bx), y: Math.round(by), w: 6, h: 3 });
    }

    // mason at base-left (reuse builder mason, translated into place)
    ctx.save();
    ctx.translate(8 * g.s, (P.baseY - 40) * g.s);
    var bob = REDUCE ? 0 : Math.round(Math.sin(tMs / 320) * 0.5);
    var up = (tMs % 760) / 760 < 0.5;
    drawMason(g, C, bob, up ? 24 : 26, up ? 24 : 20);
    ctx.restore();
  }
  function pyOutlineAt(g, P, col) {
    var steps = 46;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, y = lerp(P.baseY, P.apexY, t);
      g.f(Math.round(lerp(P.cx - P.halfW, P.cx, t)), Math.round(y), 0.7, 0.7, col);
      g.f(Math.round(lerp(P.cx + P.halfW, P.cx, t)), Math.round(y), 0.7, 0.7, col);
    }
    g.f(P.cx - P.halfW, P.baseY, P.halfW * 2, 0.7, col);
  }

  function mix(a, b, t) {
    function p(h) { h = h.replace("#", ""); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; }); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    try {
      var A = p(a), B = p(b);
      return "rgb(" + Math.round(lerp(A[0], B[0], t)) + "," + Math.round(lerp(A[1], B[1], t)) + "," + Math.round(lerp(A[2], B[2], t)) + ")";
    } catch (e) { return a; }
  }

  // ── init / wiring ───────────────────────────────────────────
  var scrollSprites = [];
  function init() {
    document.querySelectorAll("canvas[data-sprite]").forEach(function (cv) {
      var kind = cv.getAttribute("data-sprite");
      if (kind === "builder") {
        var sp = new Sprite(cv, { GW: 60, GH: 46, loop: true, draw: drawBuilder });
        sp.start(); ensureTick();
      } else if (kind === "heroscene") {
        var spH = new Sprite(cv, { GW: 128, GH: 100, loop: true, draw: drawHeroScene });
        spH.start(); ensureTick();
      } else if (kind === "scrollbuild") {
        var sp2 = new Sprite(cv, { GW: 86, GH: 56, draw: drawScrollBuild, progress: 0 });
        sp2._section = cv.closest("[data-build-section]") || cv.parentElement;
        scrollSprites.push(sp2);
      } else if (kind === "loader") {
        var sp3 = new Sprite(cv, { GW: 28, GH: 16, loop: true, draw: drawLoader });
        sp3.start(); ensureTick();
      } else {
        // feature micro-sprite
        var fn = GD(kind);
        var sp4 = new Sprite(cv, { GW: 16, GH: 16, loop: false, draw: function (ctx, tMs, C, g, self) {
          fn(g, C, self.hovered ? (performance.now() - self._hoverT0) : 0, self.hovered);
        }});
        var host = cv.closest(".feature") || cv;
        if (!REDUCE) {
          host.addEventListener("mouseenter", function () { sp4.hovered = true; sp4._hoverT0 = performance.now(); sp4._anim = true; ensureTick(); });
          host.addEventListener("mouseleave", function () { sp4.hovered = false; setTimeout(function () { sp4._anim = false; sp4.render(0); }, 60); });
        }
      }
    });
    updateScrollSprites();
    if (!REDUCE) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      registry.forEach(function (s) { s.resize(); s.render(s.playing ? performance.now() - s.t0 : (s.progress != null && !s.loop ? null : 0)); });
      updateScrollSprites();
    });
  }

  var scrollQueued = false;
  function onScroll() { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(function () { scrollQueued = false; updateScrollSprites(); }); } }
  function updateScrollSprites() {
    scrollSprites.forEach(function (sp) {
      var sec = sp._section;
      var r = sec.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      // progress: 0 when section top enters bottom, 1 when section bottom passes ~60% up
      var span = r.height + vh * 0.5;
      var p = (vh - r.top) / span;
      p = Math.max(0, Math.min(1, p));
      if (REDUCE) p = 1;
      sp.progress = p;
      sp.render();
    });
  }

  // re-theme on palette change
  function redrawAll() { registry.forEach(function (s) { s.render(s.playing ? performance.now() - s.t0 : null); }); }
  window.addEventListener("tweakchange", redrawAll);
  new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.MasoniteSprites = { redrawAll: redrawAll };
})();
