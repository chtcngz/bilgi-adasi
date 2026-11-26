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
    library: room('#fff3bf', '#c98a4a') + [6, 34].map(x => r(x, 6, 24, 38, '#a9744f', 2) + r(x + 2, 9, 20, 9, '#5c3d2e', 0, 0) + r(x + 2, 21, 20, 9, '#5c3d2e', 0, 0) + r(x + 2, 33, 20, 9, '#5c3d2e', 0, 0) +
      ['#e5484d', '#4dabf7', '#ffd43b', '#51cf66', '#9775fa'].map((col, i) => '<rect x="' + (x + 3 + i * 4) + '" y="' + (10 + (i % 2)) + '" width="3.2" height="' + (8 - (i % 2)) + '" fill="' + col + '"/><rect x="' + (x + 3 + i * 4) + '" y="' + (22 + ((i + 1) % 2)) + '" width="3.2" height="' + (8 - ((i + 1) % 2)) + '" fill="' + col + '"/><rect x="' + (x + 3 + i * 4) + '" y="34" width="3.2" height="8" fill="' + col + '"/>').join('')).join('') +
      r(20, 48, 24, 6, '#ffa94d', 2) + p('M26 48l2-6h8l2 6', '#fff', 2),
    playground: lines('M4 58h56', '#51cf66', 5) + p('M8 58V20h10v38', 'none', 2.8) + lines('M8 26h10M8 34h10M8 42h10M8 50h10', INK, 2.2) + p('M18 20q20 6 26 38', 'none', 3) + p('M18 22q18 8 22 36', 'none', 0) +
      '<path d="M18 20q20 6 26 38" fill="none" stroke="#ff922b" stroke-width="6" stroke-linecap="round"/>' + p('M46 8v50M60 8v50M46 8h14', 'none', 2.8) + lines('M50 8v26M56 8v26', '#868e96', 1.8) + r(48, 34, 10, 3, '#e5484d', 1, 2),
    canteen: room('#ffe8cc', '#d9a066') + r(4, 32, 56, 14, '#4dabf7', 2) + r(4, 28, 56, 5, '#e7f5ff', 1.5) + p('M10 28l4-8h8l4 8', '#ffd8a8', 2) + p('M12 24h12', 'none', 1.6) +
      r(30, 16, 7, 12, '#ff922b', 2) + r(31, 13, 5, 3, '#fff', 1, 1.6) + r(42, 18, 7, 10, '#e5484d', 2) + c(52, 24, 4, '#ffd43b'),
    'sports-hall': room('#e7f5ff', '#e8a24a') + lines('M2 50h60', '#fff', 1.6) + r(36, 8, 22, 14, '#fff', 2) + r(42, 13, 10, 6, 'none', 0, 2) + p('M42 22h10l-2 10h-6z', 'none', 0) +
      lines('M43 22l2 9M47 22v9M51 22l-2 9M43 26h8', '#adb5bd', 1.6) + lines('M44 22h10', '#e8590c', 3) + c(18, 36, 9, '#ff922b') + lines('M9 36h18M18 27v18M12 29q6 7 0 14M24 29q-6 7 0 14', INK, 1.8),
    'lunch-hall': room('#fff9db', '#c98a4a') + r(4, 34, 56, 7, '#ffa94d', 2) + lines('M8 41v14M56 41v14', INK, 2.6) + [12, 32, 52].map(x => '<ellipse cx="' + x + '" cy="32" rx="7" ry="3" fill="#fff"' + o(2) + '/>' + c(x, 30, 2.6, ['#51cf66', '#e5484d', '#ffd43b'][(x - 12) / 20], 1.4)).join('') +
      r(6, 8, 52, 14, '#e7f5ff', 3) + lines('M12 15h10M28 15h8M42 15h10', '#4dabf7', 2.4),
    'teachers-room': room('#f3f0ff', '#c98a4a') + r(8, 8, 24, 16, '#fff', 2) + lines('M12 13h10M12 18h14', '#9775fa', 2) + r(4, 36, 56, 6, '#a9744f', 2) + lines('M10 42v12M54 42v12', INK, 2.6) +
      p('M38 27h9v6a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4z', '#fff', 2) + p('M47 29a3 3 0 0 1 0 5', 'none', 1.8) + lines('M40 23q1-2 0-4M44 23q1-2 0-4', '#adb5bd', 1.6) + r(14, 28, 14, 8, '#4dabf7', 1.5) + r(16, 26, 10, 3, '#ffd43b', 1, 1.6),
    kitchen: room('#e6fcf5', '#adb5bd') + r(4, 30, 56, 26, '#fff', 2) + lines('M32 30v26M4 42h56', INK, 2) + r(8, 22, 20, 8, '#495057', 2) + c(13, 26, 2.2, '#ff6b6b', 1.4) + c(22, 26, 2.2, '#ff6b6b', 1.4) +
      p('M38 14h16v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z', '#e5484d') + lines('M36 16h-3M56 16h3', INK, 2.4) + lines('M42 10q1-3 0-5M48 10q1-3 0-5', '#adb5bd', 1.8) + c(18, 36, 1.6, INK, 0) + c(46, 36, 1.6, INK, 0),
    'sitting-room': room('#fff0f6', '#d9a066') + r(30, 8, 26, 18, '#343a40', 2) + r(33, 11, 20, 12, '#74c0fc', 1, 0) + lines('M43 26v4M37 30h12', INK, 2.4) + p('M4 52V40a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v12z', '#f06595') +
      r(2, 40, 6, 14, '#e64980', 2) + r(32, 40, 6, 14, '#e64980', 2) + lines('M8 47h24', '#c2255c', 2) + p('M52 52V36M46 36h12l-3-8h-6z', '#ffd43b', 2),
    bedroom: room('#e5dbff', '#d9a066') + r(38, 8, 18, 16, '#1c3d73', 2) + c(50, 14, 3.4, '#ffe066', 0) + c(48.5, 13, 3, '#1c3d73', 0) + '<circle cx="42" cy="12" r="1" fill="#fff"/><circle cx="45" cy="20" r="1" fill="#fff"/>' +
      r(4, 38, 46, 12, '#4dabf7', 3) + r(4, 32, 14, 8, '#fff', 3) + p('M4 30v26M50 36v20', 'none', 3) + p('M18 38q16-6 32 0v12H18z', '#74c0fc', 2),
    bathroom: room('#e3fafc', '#99e9f2') + p('M4 40h40v6a10 10 0 0 1-10 10H14A10 10 0 0 1 4 46z', '#fff') + lines('M10 56v4M38 56v4', INK, 2.4) + p('M40 40V14a5 5 0 0 1 10 0', 'none', 2.6) + p('M46 14h8l-2 4h-4z', '#adb5bd', 2) +
      lines('M47 21l-1 4M50 21v4M53 21l1 4', '#4dabf7', 1.8) + c(12, 36, 3, '#a5d8ff', 1.4) + c(20, 34, 4, '#a5d8ff', 1.4) + c(28, 36, 3, '#a5d8ff', 1.4) + r(52, 40, 8, 14, '#ffd43b', 2),
    'dining-room': room('#fff4e6', '#c98a4a') + '<ellipse cx="32" cy="38" rx="26" ry="7" fill="#e8a24a"' + o() + '/>' + lines('M14 44v12M50 44v12', INK, 3) + '<ellipse cx="22" cy="36" rx="6" ry="2.6" fill="#fff"' + o(1.8) + '/><ellipse cx="42" cy="36" rx="6" ry="2.6" fill="#fff"' + o(1.8) + '/>' +
      p('M28 30q4-8 8 0z', '#e5484d', 2) + r(8, 8, 48, 12, '#ffd8a8', 3) + c(32, 14, 3, '#ffe066', 1.6),
    /* school things */
    pencil: '<g transform="rotate(-35 32 32)">' + r(14, 26, 34, 12, '#ffd43b', 2) + lines('M14 30h34M14 34h34', '#fab005', 1.4) + p('M48 26l12 6-12 6z', '#ffd8a8') + p('M56 30l4 2-4 2z', INK, 1) + r(6, 26, 8, 12, '#ff8787', 3) + r(12, 25, 4, 14, '#adb5bd', 1, 2) + '</g>',
    book: p('M10 10h36a6 6 0 0 1 6 6v38H16a6 6 0 0 1-6-6z', '#e5484d') + p('M16 54a6 6 0 0 1-6-6 6 6 0 0 1 6-6h36v12z', '#fff') + lines('M18 46h30M18 50h30', '#ced4da', 1.6) + r(20, 16, 24, 10, '#ffd43b', 2, 2) + c(32, 21, 2.4, '#e5484d', 1.4),
    bag: r(14, 18, 36, 40, '#4dabf7', 10) + p('M24 18v-4a8 8 0 0 1 16 0v4', 'none', 3) + r(18, 34, 28, 18, '#339af0', 6) + lines('M18 40h28', INK, 2) + r(29, 37, 6, 5, '#ffd43b', 1.5, 1.8) + r(10, 30, 6, 18, '#1c7ed6', 3) + r(48, 30, 6, 18, '#1c7ed6', 3),
    notebook: r(14, 6, 38, 52, '#51cf66', 4) + r(20, 12, 28, 40, '#fff', 2, 2) + lines('M24 20h20M24 26h20M24 32h20M24 38h14', '#a5d8ff', 1.8) + [12, 20, 28, 36, 44, 52].map(y => '<path d="M10 ' + y + 'h8" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="' + y + '" r="1.4" fill="#fff"/>').join(''),
    scissors: c(16, 46, 8, '#e5484d') + c(16, 46, 3.4, '#fff', 2) + c(34, 52, 8, '#e5484d') + c(34, 52, 3.4, '#fff', 2) + p('M20 40L52 8l3 3-29 34z', '#ced4da') + p('M27 48L58 20l-3-3-32 27z', '#e9ecef') + c(26, 42, 2, INK, 0),
    crayon: '<g transform="rotate(-30 32 32)">' + r(12, 24, 32, 16, '#e5484d', 3) + r(18, 24, 18, 16, '#ff8787', 0, 2) + lines('M22 28v8M32 28v8', '#fff', 1.6) + p('M44 24l12 8-12 8z', '#e5484d') + r(8, 24, 6, 16, '#c92a2a', 2) + '</g>',
    'pencil-case': '<g transform="rotate(-24 34 22)">' + r(28, 4, 6, 26, '#ffd43b', 1.5, 2) + p('M28 4l3-5 3 5z', '#ffd8a8', 1.6) + r(36, 6, 6, 24, '#4dabf7', 1.5, 2) + '</g>' + p('M6 30h52v18a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8z', '#9775fa') +
      p('M6 30h52', 'none', 2.6) + lines('M10 34h44', '#ffd43b', 2.2) + r(46, 31, 6, 7, '#ced4da', 1.5, 1.8) + c(18, 46, 3, '#ffd43b', 1.6) + c(26, 48, 2.4, '#ff8787', 1.4),
    box: p('M8 24l24-12 24 12-24 12z', '#ffd8a8') + p('M8 24v22l24 12V36z', '#e8a24a') + p('M56 24v22L32 58V36z', '#d9480f') + lines('M20 18l24 12v8', '#c98a4a', 3) + p('M8 24l-4 8 24 12 4-8M56 24l4 8-24 12-4-8', 'none', 2),
    window: r(8, 6, 48, 50, '#fff', 3) + r(13, 11, 38, 40, '#a5d8ff', 1, 2) + lines('M32 11v40M13 31h38', INK, 2.6) + c(42, 20, 4, '#ffe066', 0) + p('M15 40q6-6 12 0', '#fff', 0) + p('M14 7h36', 'none', 0) + r(4, 54, 56, 5, '#a9744f', 2),
    chair: r(16, 6, 32, 24, '#4dabf7', 4) + r(14, 30, 36, 7, '#339af0', 2) + lines('M18 37v21M46 37v21', INK, 3.4) + lines('M18 37v21M46 37v21', '#868e96', 1.6) + lines('M24 12h16M24 18h16', '#a5d8ff', 2),
    /* actions: a child */
    clap: kid({ l: [30, 30], r: [34, 30], mouth: 'open' }, '#ff922b') + lines('M22 22l-5-4M20 30h-6M42 22l5-4M44 30h6', '#f76707'),
    sing: kid({ l: [22, 46], r: [40, 27], mouth: 'open' }, '#9775fa', true) + r(39, 22, 4, 9, '#495057', 2, 1.8) + note(48, 6, '#e64980') + note(54, 18, '#4dabf7') + note(6, 10, '#40c057'),
    dance: kid({ l: [12, 18], r: [52, 40], legs: 'walk', mouth: 'open' }, '#f06595', true) + lines('M6 30q3-3 0-6M58 22q3-3 0-6', '#f76707') + note(52, 4, '#9775fa'),
    'stand-up': kid({}, '#40c057') + lines('M56 52V14M51 20l5-6 5 6', '#f76707', 4) + r(2, 40, 12, 4, '#ffa94d', 1.5) + lines('M4 44v12M12 44v12M12 40V24', INK, 2.4),
    look: kid({ l: [21, 47], r: [36, 9], eyes: 2 }, '#22b8cf') + lines('M48 14l8-3M48 20h9M48 26l8 3', '#f76707'),
    listen: kid({ l: [21, 47], r: [45, 15], eyes: -1 }, '#20c997') + lines('M51 11q4 7 0 14M56 7q6 11 0 22', '#f76707'),
    point: kid({ l: [21, 47], r: [60, 30] }, '#fab005') + p('M60 30l3-1', 'none', 2) + lines('M4 10l4 4M4 22h6', '#f76707'),
    raise: kid({ l: [21, 47], r: [45, 4], mouth: 'open' }, '#e5484d', true) + lines('M50 6l5-3M52 12h6', '#f76707'),
    hello: kid({ l: [21, 47], r: [47, 9] }, '#4dabf7') + lines('M52 4q5 4 4 10M56 2q7 6 5 14', '#f76707'),
    draw: kid({ l: [24, 48], r: [40, 48] }, '#51cf66') + r(16, 46, 32, 14, '#fff', 2) + lines('M22 54q4-6 8 0t8 0', '#e5484d', 2.2) + '<g transform="rotate(30 42 46)">' + r(40, 38, 4, 12, '#ffd43b', 1, 1.8) + '</g>',
    colour: kid({ l: [24, 48], r: [42, 46] }, '#ff922b', true) + r(16, 46, 32, 14, '#fff', 2) + lines('M20 56h8', '#e5484d', 4) + lines('M28 56h8', '#ffd43b', 4) + lines('M36 56h8', '#4dabf7', 4) + '<g transform="rotate(30 44 44)">' + r(42, 34, 4, 12, '#9775fa', 1, 1.8) + '</g>',
    come: kid({ l: [21, 47], r: [44, 24], legs: 'walk' }, '#339af0') + lines('M50 22q4-4 0-8', '#f76707') + lines('M6 50h8M10 46l-4 4 4 4', '#f76707', 3),
    pass: kid({ l: [42, 38], r: [50, 38] }, '#e599f7', true) + '<g transform="rotate(-10 52 34)">' + r(46, 32, 16, 4, '#ffd43b', 1, 1.8) + '</g>' + lines('M48 48h12M56 44l4 4-4 4', '#f76707', 3),
    put: kid({ l: [26, 44], r: [38, 44] }, '#74c0fc') + r(22, 40, 20, 5, '#e5484d', 1.5, 2) + p('M18 48h28v12H18z', '#e8a24a') + lines('M32 32v-1', 'none', 0) + lines('M50 30v12M46 38l4 4 4-4', '#f76707', 3),
    show: kid({ l: [21, 47], r: [46, 22] }, '#ffa94d', true) + r(42, 6, 18, 14, '#fff', 2) + c(51, 13, 3.4, '#e5484d', 1.6) + lines('M38 4l2 3M62 22l-2-2', '#f76707'),
    say: kid({ mouth: 'open' }, '#4dabf7') + p('M44 4h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-9l-5 5v-5h-2a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', '#fff', 2.2) + lines('M48 10h10M48 15h7', '#4dabf7', 2),
    wait: kid({ l: [30, 40], r: [34, 40], mouth: 'o' }, '#adb5bd') + p('M48 6h12M48 30h12M50 6q0 9 4 12-4 3-4 12M58 6q0 9-4 12 4 3 4 12', '#fff', 2.2) + p('M51 27q3-4 6 0z', '#ffd43b', 1.4),
    find: kid({ l: [21, 47], r: [44, 30], eyes: 2 }, '#40c057', true) + c(50, 24, 7, '#a5d8ff', 3) + lines('M45 29l-3 4', INK, 4),
    read: kid({ l: [24, 40], r: [40, 40] }, '#f783ac', true) + p('M18 32l14 4 14-4v14l-14 4-14-4z', '#fff', 2.2) + p('M32 36v14', 'none', 2) + lines('M22 38l6 2M22 42l6 2M36 40l6-2M36 44l6-2', '#4dabf7', 1.4),
    write: kid({ l: [24, 48], r: [40, 48] }, '#4dabf7', true) + r(16, 46, 32, 14, '#fff', 2) + lines('M20 51h18M20 55h12', '#adb5bd', 1.6) + '<g transform="rotate(30 42 46)">' + r(40, 38, 4, 12, '#e5484d', 1, 1.8) + '</g>',
    /* the body: the part meant is ringed */
    face: kid({}, '#4dabf7', false, ring(32, 18, 14.5, 14.5, false)),
    eye: kid({}, '#4dabf7', false, ring(28, 18, 5)),
    ear: kid({}, '#4dabf7', false, ring(43, 19, 6)),
    nose: kid({}, '#4dabf7', false, ring(32, 20.5, 4.5)) + c(32, 20.5, 1.6, '#f08c00', 1.2),
    mouth: kid({ mouth: 'open' }, '#4dabf7', false, ring(32, 24.5, 6, 4.5)),
    hand: kid({ l: [21, 47], r: [47, 22] }, '#4dabf7', false, ring(47, 22, 6)),
    arm: kid({ l: [21, 47], r: [47, 22] }, '#4dabf7', false, ring(43, 28, 7, 10)),
    leg: kid({ legs: 'walk' }, '#4dabf7', false, ring(42, 52, 6, 8)),
    body: kid({}, '#4dabf7', false, ring(32, 33, 22, 29, false))
  });
})();
