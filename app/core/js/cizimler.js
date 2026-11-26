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
    /* school things */
    /* actions: a child */
    'stand-up': kid({}, '#40c057') + lines('M56 52V14M51 20l5-6 5 6', '#f76707', 4) + r(2, 40, 12, 4, '#ffa94d', 1.5) + lines('M4 44v12M12 44v12M12 40V24', INK, 2.4),
    read: kid({ l: [24, 40], r: [40, 40] }, '#f783ac', true) + p('M18 32l14 4 14-4v14l-14 4-14-4z', '#fff', 2.2) + p('M32 36v14', 'none', 2) + lines('M22 38l6 2M22 42l6 2M36 40l6-2M36 44l6-2', '#4dabf7', 1.4),
    write: kid({ l: [24, 48], r: [40, 48] }, '#4dabf7', true) + r(16, 46, 32, 14, '#fff', 2) + lines('M20 51h18M20 55h12', '#adb5bd', 1.6) + '<g transform="rotate(30 42 46)">' + r(40, 38, 4, 12, '#e5484d', 1, 1.8) + '</g>',
    /* the body: the part meant is ringed */
  });
})();
