() => {
  const toRGB = (c) => {
    const m = (c || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((s) => parseFloat(s));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const key = (c) => `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}`;

  // Background stack for an element: every ancestor paints underneath, and a gradient
  // paints over its own background-color, so each stop becomes a live candidate.
  const candidatesFor = (el, ownGradientIsText) => {
    const nodes = [];
    for (let n = el; n; n = n.parentElement) nodes.unshift(n);
    // For bg-clip-text the element's own gradient paints the glyphs, not a surface behind them.
    if (ownGradientIsText) nodes.pop();
    let acc = [{ r: 255, g: 255, b: 255, a: 1 }];
    for (const n of nodes) {
      const s = getComputedStyle(n);
      const c = toRGB(s.backgroundColor);
      if (c && c.a > 0) acc = acc.map((b) => over(c, b));
      const bi = s.backgroundImage;
      if (bi && /gradient\(/.test(bi)) {
        const stops = (bi.match(/rgba?\([^)]+\)/g) || []).map(toRGB).filter(Boolean);
        if (stops.length) {
          const next = [];
          for (const st of stops) for (const b of acc) next.push(over(st, b));
          acc = next;
        }
      }
      const seenC = new Set();
      acc = acc.filter((x) => { const k = key(x); if (seenC.has(k)) return false; seenC.add(k); return true; });
      if (acc.length > 12) acc = acc.slice(0, 12);
    }
    return acc;
  };

  const failures = [];
  const dedupe = new Set();
  const clippedSeen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || el.closest('[hidden]') || el.closest('[aria-hidden="true"]')) continue;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE'].includes(el.tagName)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || parseFloat(s.opacity) < 0.5) continue;
    // Hover overlays start hidden as `opacity-0` on an ancestor and only show on group-hover.
    // (Checked by class, not computed opacity: framer-motion entrance animations sit at
    // opacity 0 while the tab is hidden, which would silence the whole page.)
    let faded = false;
    for (let n = el; n && !faded; n = n.parentElement) {
      const cls = typeof n.className === 'string' ? n.className : '';
      if (/(^|\s)opacity-0(\s|$)/.test(cls)) faded = true;
    }
    if (faded) continue;

    const fg = toRGB(s.color);
    if (!fg) continue;

    const cands = candidatesFor(el, fg.a < 0.05);

    // bg-clip-text: the glyphs take the colour of their own gradient, not `color`.
    if (fg.a < 0.05) {
      const stops = ((s.backgroundImage || '').match(/rgba?\([^)]+\)/g) || []).map(toRGB).filter(Boolean);
      if (!stops.length) continue;
      let pair = null;
      for (const st of stops) for (const bg of cands) {
        const cr = ratio(st, bg);
        if (!pair || cr < pair.cr) pair = { cr, st, bg };
      }
      const px = parseFloat(s.fontSize);
      const bold = parseInt(s.fontWeight || '400', 10) >= 700;
      const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;
      clippedSeen.add(`${text.slice(0, 22)} ${Math.round(pair.cr * 100) / 100}/${need}`);
      if (pair.cr >= need) continue;
      failures.push({
        text: text.slice(0, 40), gradientText: true,
        sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''),
        px: Math.round(px * 10) / 10, wt: s.fontWeight,
        fg: `gradient ${stops.map(key).join(' | ')}`,
        bg: `rgb(${Math.round(pair.bg.r)} ${Math.round(pair.bg.g)} ${Math.round(pair.bg.b)})`,
        cr: Math.round(pair.cr * 100) / 100, need,
      });
      continue;
    }

    const worst = cands.reduce((a, b) => (ratio(fg, a) < ratio(fg, b) ? a : b));
    const cr = ratio(fg.a >= 0.999 ? fg : over(fg, worst), worst);
    const px = parseFloat(s.fontSize);
    const bold = parseInt(s.fontWeight || '400', 10) >= 700;
    const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;
    if (cr >= need) continue;

    const id = el.tagName + '|' + text.slice(0, 32) + '|' + s.color + '|' + px;
    if (dedupe.has(id)) continue;
    dedupe.add(id);
    failures.push({
      text: text.slice(0, 40),
      sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : ''),
      px: Math.round(px * 10) / 10, wt: s.fontWeight, fg: s.color,
      bg: `rgb(${Math.round(worst.r)} ${Math.round(worst.g)} ${Math.round(worst.b)})`,
      cr: Math.round(cr * 100) / 100, need,
    });
  }
  return {
    page: location.pathname,
    failures: failures.length,
    gradientText: [...clippedSeen].slice(0, 10),
    samples: failures.slice(0, 40),
  };
}
