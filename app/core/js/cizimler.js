// Çizimler: İngilizce Koyu's cartoon pictures, in a 64×64 box with thick dark outlines and bright colours, for the words
// an emoji shows poorly: places, school things, actions (a child in a pose) and parts of the body (the part ringed).
// They join kelimeResimleri (core/js/kelime-resimleri.js) and are written [[name]] like its own drawings.
(() => {
  const INK = '#2b2d42', SKIN = '#ffd3a8', HAIR = '#6b3e1f';
  const o = (w = 2.6) => ' stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"';
  const r = (x, y, w, h, fill, rx = 2, sw) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + fill + '"' + o(sw) + '/>';
  const c = (x, y, rad, fill, sw) => '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="' + fill + '"' + o(sw) + '/>';
  const p = (d, fill = 'none', sw) => '<path d="' + d + '" fill="' + fill + '"' + o(sw) + '/>';
  // a thick limb: a dark line under a coloured one
  const limb = (x1, y1, x2, y2, colour, w = 4.4) => '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + INK + '" stroke-width="' + (w + 2.6) + '" stroke-linecap="round"/>' +
    '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + colour + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  const lines = (d, colour = '#ff922b', w = 2.6) => '<path d="' + d + '" fill="none" stroke="' + colour + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  // a dashed ring over the part meant, lightly filled when the part is small
  const ring = (x, y, rx, ry = rx, fill = true) => (fill ? '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="#ffe066" opacity=".35"/>' : '') +
    '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="#f76707" stroke-width="2.8" stroke-dasharray="4 3"/>';

  // A cartoon child. pose: l, r = the hands ([x, y], shoulders at 25,33 and 39,33); legs: stand | walk | jump;
  // mouth: smile | open | o; eyes: dx to look aside. `over` is drawn on top (the ring of a part of the body).
  function kid(pose = {}, shirt = '#4dabf7', girl = false, over = '') {
    const L = pose.l || [21, 47], Rh = pose.r || [43, 47];
    const legs = { stand: [[28, 47, 27, 58], [36, 47, 37, 58]], walk: [[28, 47, 21, 57], [36, 47, 43, 57]], jump: [[28, 47, 21, 53], [36, 47, 43, 53]] }[pose.legs || 'stand'];
    let s = '';
    if (girl) s += p('M19 22q-4 10 2 16M45 22q4 10-2 16', 'none') + c(18, 33, 4, HAIR, 2) + c(46, 33, 4, HAIR, 2);
    for (const [x1, y1, x2, y2] of legs) s += limb(x1, y1, x2, y2, '#364fc7', 4.6) + '<ellipse cx="' + x2 + '" cy="' + (y2 + 1.5) + '" rx="4" ry="2.6" fill="#e5484d"' + o(2) + '/>';
    s += p('M22 48q-1-15 10-16q11 1 10 16z', shirt);
    if (girl) s += p('M22 48l-3 5h26l-3-5z', shirt);
    s += limb(25, 34, L[0], L[1], shirt) + c(L[0], L[1], 3.4, SKIN, 2);
    s += limb(39, 34, Rh[0], Rh[1], shirt) + c(Rh[0], Rh[1], 3.4, SKIN, 2);
    // head, ears, hair, face
    s += c(21, 19, 3.4, SKIN, 2) + c(43, 19, 3.4, SKIN, 2) + c(32, 18, 11, SKIN);
    s += girl ? p('M21 18q0-12 11-12t11 12q-5-6-11-6-6 0-11 6z', HAIR, 2) : p('M21 17q1-11 11-11t11 11q-3-4-6-4l-3 3-2-3q-6 0-11 4z', HAIR, 2);
    const dx = pose.eyes || 0;
    s += c(28 + dx, 18, 1.8, INK, 0) + c(36 + dx, 18, 1.8, INK, 0) + c(26, 22.5, 1.8, '#ffa8a8', 0) + c(38, 22.5, 1.8, '#ffa8a8', 0);
    s += pose.mouth === 'open' ? p('M28 23q4 6 8 0z', '#c92a2a', 2) : pose.mouth === 'o' ? c(32, 24.5, 2.2, '#c92a2a', 1.8) : p('M28.5 23.5q3.5 3 7 0', 'none', 2);
    return s + over;
  }
  const note = (x, y, colour) => c(x, y + 8, 2.6, colour, 1.6) + lines('M' + (x + 2.4) + ' ' + (y + 8) + 'V' + y + 'l4 1.5', INK, 1.8);
  // a picture on a wall: a room seen from inside (back wall, floor, side walls)
  const room = (wall = '#fff3bf', floor = '#e8b07a') => r(2, 2, 60, 60, wall, 6) + p('M2 44h60v12a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6z', floor);

  kelimeResimleri.ekle({
    /* places */
    school: p('M6 30L32 12l26 18', '#e5484d') + r(10, 28, 44, 30, '#ffd43b', 2) + r(26, 40, 12, 18, '#a9744f', 2) + c(32, 23, 5, '#fff') + lines('M32 20v3l2 1', INK, 1.6) +
      r(14, 33, 8, 7, '#a5d8ff', 1.5, 2) + r(42, 33, 8, 7, '#a5d8ff', 1.5, 2) + lines('M32 12V3', INK, 2.4) + p('M32 3h10l-3 3 3 3H32z', '#40c057', 2) + lines('M4 58h56', '#51cf66', 4),
    classroom: room('#d0ebff', '#c98a4a') + r(12, 8, 40, 20, '#2f9e44', 2) + lines('M17 14h14M17 20h20', '#fff', 2.2) + r(6, 40, 20, 5, '#ffa94d', 1.5) + r(38, 40, 20, 5, '#ffa94d', 1.5) +
      lines('M9 45v9M23 45v9M41 45v9M55 45v9', INK, 2.4) + c(16, 36, 4, SKIN, 2) + c(48, 36, 4, SKIN, 2),
    playground: lines('M4 58h56', '#51cf66', 5) + p('M8 58V20h10v38', 'none', 2.8) + lines('M8 26h10M8 34h10M8 42h10M8 50h10', INK, 2.2) + p('M18 20q20 6 26 38', 'none', 3) + p('M18 22q18 8 22 36', 'none', 0) +
      '<path d="M18 20q20 6 26 38" fill="none" stroke="#ff922b" stroke-width="6" stroke-linecap="round"/>' + p('M46 8v50M60 8v50M46 8h14', 'none', 2.8) + lines('M50 8v26M56 8v26', '#868e96', 1.8) + r(48, 34, 10, 3, '#e5484d', 1, 2),
    canteen: room('#ffe8cc', '#d9a066') + r(4, 32, 56, 14, '#4dabf7', 2) + r(4, 28, 56, 5, '#e7f5ff', 1.5) + p('M10 28l4-8h8l4 8', '#ffd8a8', 2) + p('M12 24h12', 'none', 1.6) +
      r(30, 16, 7, 12, '#ff922b', 2) + r(31, 13, 5, 3, '#fff', 1, 1.6) + r(42, 18, 7, 10, '#e5484d', 2) + c(52, 24, 4, '#ffd43b'),
    'sports-hall': room('#e7f5ff', '#e8a24a') + lines('M2 50h60', '#fff', 1.6) + r(36, 8, 22, 14, '#fff', 2) + r(42, 13, 10, 6, 'none', 0, 2) + p('M42 22h10l-2 10h-6z', 'none', 0) +
      lines('M43 22l2 9M47 22v9M51 22l-2 9M43 26h8', '#adb5bd', 1.6) + lines('M44 22h10', '#e8590c', 3) + c(18, 36, 9, '#ff922b') + lines('M9 36h18M18 27v18M12 29q6 7 0 14M24 29q-6 7 0 14', INK, 1.8),
    'teachers-room': room('#f3f0ff', '#c98a4a') + r(8, 8, 24, 16, '#fff', 2) + lines('M12 13h10M12 18h14', '#9775fa', 2) + r(4, 36, 56, 6, '#a9744f', 2) + lines('M10 42v12M54 42v12', INK, 2.6) +
      p('M38 27h9v6a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4z', '#fff', 2) + p('M47 29a3 3 0 0 1 0 5', 'none', 1.8) + lines('M40 23q1-2 0-4M44 23q1-2 0-4', '#adb5bd', 1.6) + r(14, 28, 14, 8, '#4dabf7', 1.5) + r(16, 26, 10, 3, '#ffd43b', 1, 1.6),
    /* school things */
    /* actions: a child */
    clap: kid({ l: [30, 30], r: [34, 30], mouth: 'open' }, '#ff922b') + lines('M22 22l-5-4M20 30h-6M42 22l5-4M44 30h6', '#f76707'),
    sing: kid({ l: [22, 46], r: [40, 27], mouth: 'open' }, '#9775fa', true) + r(39, 22, 4, 9, '#495057', 2, 1.8) + note(48, 6, '#e64980') + note(54, 18, '#4dabf7') + note(6, 10, '#40c057'),
    'stand-up': kid({}, '#40c057') + lines('M56 52V14M51 20l5-6 5 6', '#f76707', 4) + r(2, 40, 12, 4, '#ffa94d', 1.5) + lines('M4 44v12M12 44v12M12 40V24', INK, 2.4),
    read: kid({ l: [24, 40], r: [40, 40] }, '#f783ac', true) + p('M18 32l14 4 14-4v14l-14 4-14-4z', '#fff', 2.2) + p('M32 36v14', 'none', 2) + lines('M22 38l6 2M22 42l6 2M36 40l6-2M36 44l6-2', '#4dabf7', 1.4),
    write: kid({ l: [24, 48], r: [40, 48] }, '#4dabf7', true) + r(16, 46, 32, 14, '#fff', 2) + lines('M20 51h18M20 55h12', '#adb5bd', 1.6) + '<g transform="rotate(30 42 46)">' + r(40, 38, 4, 12, '#e5484d', 1, 1.8) + '</g>',
    /* the body: the part meant is ringed */
  });
})();
