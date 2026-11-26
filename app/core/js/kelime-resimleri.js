// Kelime resimleri: pictures for the words no emoji shows (a school desk, a sharpener, a cat's whiskers …).
// A question writes one as [[name]] wherever it would write an emoji: in k[2] and in its texts ("[[desk]] sıra").
// kelimeResmi('[[desk]]') gives the drawing (an inline SVG, 1em wide like an emoji); resimliMetin(html) turns every
// [[name]] of an already escaped text into its drawing. In a picture of a part or a person (tail, son), the part or the
// person meant is in colour and the rest is grey.
const kelimeResimleri = (() => {
  const INK = '#33413f';
  const o = (w = 2) => ' stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"';
  const GREY = '#ced4da', GREY2 = '#adb5bd', SKIN = '#f7c99b';

  // A person: x is the middle of the feet line (y 60), h the height; kind man|woman|boy|girl; grey or in colour.
  function person(x, h, kind, coloured, shirt) {
    const s = h / 50, head = 7 * s, top = 60 - h;
    const skin = coloured ? SKIN : GREY, hair = coloured ? (kind === 'girl' || kind === 'woman' ? '#8b5a2b' : '#4a3426') : GREY2;
    const body = coloured ? shirt : GREY, legs = coloured ? '#3b5bdb' : GREY2;
    const hy = top + head, by = hy + head * 0.9;
    const long = kind === 'girl' || kind === 'woman';
    let p = '';
    if (long) p += '<path d="M' + (x - head * 1.15) + ' ' + (hy + head * 1.4) + 'Q' + (x - head * 1.3) + ' ' + (hy - head * 1.2) + ' ' + x + ' ' + (hy - head * 1.15) +
      'Q' + (x + head * 1.3) + ' ' + (hy - head * 1.2) + ' ' + (x + head * 1.15) + ' ' + (hy + head * 1.4) + 'Z" fill="' + hair + '"' + o(1.5) + '/>';
    // legs and body
    p += '<rect x="' + (x - head * 0.75) + '" y="' + (by + h * 0.34) + '" width="' + head * 0.6 + '" height="' + (60 - by - h * 0.34) + '" rx="1.5" fill="' + legs + '"' + o(1.5) + '/>';
    p += '<rect x="' + (x + head * 0.15) + '" y="' + (by + h * 0.34) + '" width="' + head * 0.6 + '" height="' + (60 - by - h * 0.34) + '" rx="1.5" fill="' + legs + '"' + o(1.5) + '/>';
    if (long) p += '<path d="M' + (x - head * 1.1) + ' ' + by + 'h' + head * 2.2 + 'l' + head * 0.5 + ' ' + h * 0.42 + 'h-' + head * 3.2 + 'Z" fill="' + body + '"' + o(1.5) + '/>';
    else p += '<rect x="' + (x - head * 1.1) + '" y="' + by + '" width="' + head * 2.2 + '" height="' + h * 0.38 + '" rx="' + head * 0.5 + '" fill="' + body + '"' + o(1.5) + '/>';
    p += '<circle cx="' + x + '" cy="' + hy + '" r="' + head + '" fill="' + skin + '"' + o(1.5) + '/>';
    if (!long) p += '<path d="M' + (x - head) + ' ' + hy + 'Q' + x + ' ' + (hy - head * 1.9) + ' ' + (x + head) + ' ' + hy + 'Q' + x + ' ' + (hy - head * 0.9) + ' ' + (x - head) + ' ' + hy + 'Z" fill="' + hair + '"' + o(1.2) + '/>';
    if (coloured) p += '<circle cx="' + (x - head * 0.35) + '" cy="' + (hy + head * 0.05) + '" r="' + head * 0.12 + '" fill="' + INK + '"/><circle cx="' + (x + head * 0.35) + '" cy="' + (hy + head * 0.05) + '" r="' + head * 0.12 + '" fill="' + INK + '"/>' +
      '<path d="M' + (x - head * 0.35) + ' ' + (hy + head * 0.45) + 'Q' + x + ' ' + (hy + head * 0.75) + ' ' + (x + head * 0.35) + ' ' + (hy + head * 0.45) + '" fill="none"' + o(1.2) + '/>';
    return p;
  }
  // A calendar card for a week: the days asked are in colour (Monday is the first).
  function week(days) {
    let p = '<rect x="4" y="12" width="56" height="40" rx="6" fill="#fff"' + o() + '/><path d="M4 18a6 6 0 0 1 6-6h44a6 6 0 0 1 6 6v6H4z" fill="#e5484d"' + o() + '/>' +
      '<path d="M18 8v8M46 8v8"' + o(3) + '/>';
    for (let i = 0; i < 7; i++) {
      const x = 7.5 + i * 7.3, on = days.includes(i);
      p += '<rect x="' + x + '" y="' + (on ? 29 : 31) + '" width="6" height="' + (on ? 17 : 13) + '" rx="1.6" fill="' + (on ? '#ff922b' : (i > 4 ? '#e9ecef' : '#f1f3f5')) + '"' + o(on ? 1.6 : 1) + '/>';
    }
    return p;
  }
  // A number badge: the digits a child knows, for the numbers after ten.
  const num = (n, colour) => '<circle cx="32" cy="32" r="27" fill="' + colour + '"' + o(2.5) + '/><circle cx="32" cy="32" r="21" fill="#fff" opacity=".25"/>' +
    '<text x="32" y="41.5" text-anchor="middle" font-family="Nunito, Arial Rounded MT Bold, Arial, sans-serif" font-weight="900" font-size="26" fill="#fff" stroke="' + INK + '" stroke-width="1.2" paint-order="stroke">' + n + '</text>';
  const arrow = (d, colour) => '<path d="' + d + '" fill="none" stroke="' + colour + '" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>';

  const R = {
    /* school */
    desk: '<path d="M8 22h48l-4 8H12z" fill="#e8a24a"' + o() + '/><rect x="11" y="30" width="42" height="9" fill="#c98a4a"' + o() + '/>' +
      '<path d="M14 39v19M50 39v19M14 50h36"' + o(3) + '/><rect x="16" y="46" width="32" height="4" rx="1.5" fill="#e8a24a"' + o(1.5) + '/>' +
      '<rect x="18" y="15" width="16" height="7" rx="1" fill="#4dabf7"' + o(1.5) + '/><path d="M38 19l14-4"' + o(3) + '/><path d="M38 19l14-4" stroke="#fcc419" stroke-width="2" stroke-linecap="round"/>',
    table: '<rect x="5" y="22" width="54" height="7" rx="2" fill="#e8a24a"' + o() + '/><rect x="9" y="29" width="5" height="28" rx="1.5" fill="#c98a4a"' + o(1.5) + '/>' +
      '<rect x="50" y="29" width="5" height="28" rx="1.5" fill="#c98a4a"' + o(1.5) + '/><path d="M14 33h36"' + o(1.5) + '/>' +
      '<path d="M27 22c-2-6 0-10 5-10s7 4 5 10z" fill="#74c0fc"' + o(1.5) + '/><circle cx="29" cy="9" r="3.5" fill="#ff6b6b"' + o(1.2) + '/><circle cx="35" cy="8" r="3.5" fill="#ffd43b"' + o(1.2) + '/>',
    'coffee-table': '<rect x="4" y="36" width="56" height="7" rx="3" fill="#a9744f"' + o() + '/><path d="M10 43l-2 13M54 43l2 13M20 43v9M44 43v9"' + o(3) + '/>' +
      '<path d="M22 26h12v8a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" fill="#fff"' + o(1.6) + '/><path d="M34 28a4 4 0 0 1 0 7"' + o(1.6) + ' fill="none"/>' +
      '<path d="M26 22c-1-2 1-3 0-5M30 22c-1-2 1-3 0-5"' + o(1.3) + ' fill="none"/><rect x="40" y="30" width="12" height="6" rx="1" fill="#e599f7"' + o(1.4) + '/>',
    sharpener: '<rect x="30" y="18" width="28" height="30" rx="5" fill="#e5484d"' + o() + '/><rect x="34" y="22" width="20" height="6" rx="2" fill="#ffa8a8"/>' +
      '<circle cx="38" cy="36" r="6" fill="#343a40"' + o(1.5) + '/><path d="M4 30l22-6 10 12-22 6z" fill="#fcc419"' + o(1.6) + '/><path d="M26 24l10 12 2-1-9-12z" fill="#f4d9b0"' + o(1.2) + '/>' +
      '<path d="M14 42c-3 4 1 8 4 11M20 44c-1 3 2 5 3 8" fill="none" stroke="#c98a4a" stroke-width="2" stroke-linecap="round"/>',
    rubber: '<g transform="rotate(-20 32 34)"><rect x="8" y="22" width="48" height="22" rx="5" fill="#ff8fab"' + o() + '/><rect x="32" y="22" width="24" height="22" rx="0" fill="#4dabf7"/>' +
      '<rect x="8" y="22" width="48" height="22" rx="5" fill="none"' + o() + '/><path d="M32 22v22"' + o(1.5) + '/></g>' +
      '<circle cx="12" cy="56" r="2" fill="#ffc9d5"' + o(1) + '/><circle cx="20" cy="58" r="1.6" fill="#ffc9d5"' + o(1) + '/><circle cx="6" cy="51" r="1.4" fill="#ffc9d5"' + o(1) + '/>',
    // a box of chalk sticks, one lying in front with its dust
    chalk: '<path d="M10 22h34v26H10z" fill="#4dabf7"' + o() + '/><path d="M10 22l6-8h34l-6 8z" fill="#74c0fc"' + o() + '/><path d="M44 22l6-8v26l-6 8z" fill="#339af0"' + o() + '/>' +
      '<rect x="15" y="8" width="6" height="16" rx="3" fill="#fff"' + o(1.5) + '/><rect x="24" y="6" width="6" height="18" rx="3" fill="#ffe3e3"' + o(1.5) + '/><rect x="33" y="9" width="6" height="15" rx="3" fill="#fff9db"' + o(1.5) + '/>' +
      '<g transform="rotate(-12 40 54)"><rect x="22" y="50" width="34" height="9" rx="4.5" fill="#fff"' + o() + '/></g><circle cx="58" cy="56" r="1.6" fill="#dee2e6"/><circle cx="61" cy="52" r="1.2" fill="#dee2e6"/><circle cx="55" cy="60" r="1.2" fill="#dee2e6"/>',
    // the boards: green (board), black (blackboard), white with a marker (whiteboard)
    board: '<rect x="4" y="8" width="56" height="38" rx="3" fill="#2f9e44"' + o() + '/><rect x="2" y="44" width="60" height="5" rx="2" fill="#c98a4a"' + o(1.5) + '/>' +
      '<path d="M12 20h16M12 28h24M12 36h12" stroke="#d3f9d8" stroke-width="2.4" stroke-linecap="round"/><path d="M16 49l-4 12M48 49l4 12"' + o(3) + '/>',
    blackboard: '<rect x="4" y="8" width="56" height="38" rx="3" fill="#343a40"' + o() + '/><rect x="2" y="44" width="60" height="5" rx="2" fill="#c98a4a"' + o(1.5) + '/>' +
      '<path d="M12 22q4-8 8 0t8 0M34 20h14M34 30h10M12 34h14" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M16 49l-4 12M48 49l4 12"' + o(3) + '/>',
    whiteboard: '<rect x="4" y="8" width="56" height="38" rx="3" fill="#fff"' + o() + '/><rect x="8" y="12" width="48" height="30" fill="#f8f9fa"/>' +
      '<path d="M12 22h18M12 30h26" stroke="#4dabf7" stroke-width="2.6" stroke-linecap="round"/><path d="M40 20l8 8M48 20l-8 8" stroke="#fa5252" stroke-width="2.6" stroke-linecap="round"/>' +
      '<rect x="40" y="45" width="16" height="5" rx="2" fill="#1c7ed6"' + o(1.4) + '/><path d="M16 46l-4 14M48 50l4 10"' + o(3) + '/>',
    'smart-board': '<rect x="4" y="6" width="56" height="38" rx="3" fill="#212529"' + o() + '/><rect x="8" y="10" width="48" height="30" rx="1" fill="#74c0fc"/>' +
      '<path d="M8 32l12-10 10 8 8-6 18 12v4H8z" fill="#51cf66"/><circle cx="46" cy="18" r="4" fill="#ffd43b"/><path d="M30 44v8M22 58h20"' + o(3) + '/>' +
      '<path d="M40 30l14 14" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M40 30l14 14" stroke="#e5484d" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="12" cy="40" r="1.4" fill="#fff"/>',
    bookcase: '<rect x="8" y="4" width="48" height="56" rx="2" fill="#a9744f"' + o() + '/><rect x="12" y="8" width="40" height="14" fill="#5c3d2e"/><rect x="12" y="26" width="40" height="14" fill="#5c3d2e"/><rect x="12" y="44" width="40" height="12" fill="#5c3d2e"/>' +
      '<rect x="14" y="10" width="5" height="12" fill="#e5484d"/><rect x="20" y="9" width="4" height="13" fill="#4dabf7"/><rect x="25" y="11" width="6" height="11" fill="#ffd43b"/><rect x="33" y="10" width="4" height="12" fill="#51cf66"/><path d="M39 22l5-12 4 1.5-5 10.5z" fill="#9775fa"/>' +
      '<rect x="14" y="28" width="6" height="12" fill="#ff922b"/><rect x="21" y="29" width="4" height="11" fill="#e599f7"/><rect x="27" y="28" width="5" height="12" fill="#22b8cf"/><rect x="34" y="30" width="6" height="10" fill="#e5484d"/><rect x="42" y="28" width="5" height="12" fill="#fab005"/>' +
      '<rect x="14" y="46" width="9" height="10" fill="#4dabf7"/><rect x="25" y="47" width="5" height="9" fill="#51cf66"/><rect x="40" y="48" width="9" height="8" rx="1" fill="#ffd8a8"/>' +
      '<path d="M12 22h40M12 40h40"' + o(2) + '/>',
    'coloured-pencil': [['#e5484d', -24], ['#ffd43b', -8], ['#4dabf7', 8], ['#51cf66', 24]].map(([c, r]) =>
      '<g transform="rotate(' + r + ' 32 58)"><rect x="28" y="16" width="8" height="38" fill="' + c + '"' + o(1.5) + '/><path d="M28 16l4-10 4 10z" fill="#f4d9b0"' + o(1.5) + '/><path d="M30.6 9.5l1.4-3.5 1.4 3.5z" fill="' + c + '"/></g>').join(''),
    glue: '<path d="M22 22h20v34a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="#fff"' + o() + '/><rect x="22" y="32" width="20" height="16" fill="#ff922b"' + o(1.5) + '/>' +
      '<path d="M26 22l3-10h6l3 10z" fill="#ffd43b"' + o(1.5) + '/><path d="M31 12v-4h2v4z" fill="#ffd43b"' + o(1.2) + '/><path d="M34 6q8 2 6 12q-1 4 2 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M34 6q8 2 6 12q-1 4 2 8" fill="none" stroke="' + INK + '" stroke-width="1.2"/><path d="M28 40h8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
    tablet: '<rect x="6" y="10" width="52" height="40" rx="6" fill="#343a40"' + o() + '/><rect x="11" y="15" width="42" height="30" rx="2" fill="#a5d8ff"/>' +
      '<rect x="15" y="19" width="9" height="9" rx="2" fill="#ff8787"/><rect x="27" y="19" width="9" height="9" rx="2" fill="#69db7c"/><rect x="39" y="19" width="9" height="9" rx="2" fill="#ffd43b"/>' +
      '<rect x="15" y="32" width="9" height="9" rx="2" fill="#b197fc"/><rect x="27" y="32" width="9" height="9" rx="2" fill="#ffa94d"/><circle cx="55" cy="30" r="1.5" fill="#868e96"/>',
    clock: '<path d="M32 2v6" stroke="#868e96" stroke-width="2"/><circle cx="32" cy="2.5" r="2" fill="#868e96"/><circle cx="32" cy="34" r="26" fill="#ff922b"' + o() + '/><circle cx="32" cy="34" r="21" fill="#fff"' + o(1.5) + '/>' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => { const a = h * Math.PI / 6; return '<circle cx="' + (32 + Math.sin(a) * 17).toFixed(1) + '" cy="' + (34 - Math.cos(a) * 17).toFixed(1) + '" r="' + (h % 3 ? 1 : 1.8) + '" fill="' + INK + '"/>'; }).join('') +
      '<path d="M32 34V20M32 34l9 5"' + o(2.8) + '/><circle cx="32" cy="34" r="2.2" fill="#e5484d"/>',
    // a Turkish tea glass on its saucer
    tea: '<ellipse cx="32" cy="56" rx="20" ry="5" fill="#e03131"' + o() + '/><path d="M22 14h20q-2 8-6 14 6 6 6 16 0 8-4 10H26q-4-2-4-10 0-10 6-16-4-6-6-14z" fill="#fff" opacity=".9"' + o() + '/>' +
      '<path d="M24.5 20h15q-1.5 5-5 8.5 5.5 6 5.5 15 0 6.5-3 8.5H27q-3-2-3-8.5 0-9 5.5-15-3.5-3.5-5-8.5z" fill="#c2410c"/><path d="M28 24q-2 4 1 6" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/>' +
      '<path d="M44 12l-8 36" stroke="#adb5bd" stroke-width="2.5" stroke-linecap="round"/><path d="M26 8q2-3 0-5M32 8q2-3 0-5M38 8q2-3 0-5" fill="none" stroke="#adb5bd" stroke-width="1.6" stroke-linecap="round"/>',
    goldfish: '<path d="M10 22q-4 18 6 32h32q10-14 6-32" fill="#d0ebff" opacity=".85"' + o() + '/><ellipse cx="32" cy="22" rx="22" ry="4" fill="#e7f5ff"' + o(1.5) + '/>' +
      '<path d="M12 40q20 6 40 0v8q-4 6-8 6H20q-4 0-8-6z" fill="#74c0fc" opacity=".6"/><path d="M22 36q8-10 18-2-10 8-18 2z" fill="#ff922b"' + o(1.5) + '/><path d="M40 34l8-6v14z" fill="#ffa94d"' + o(1.5) + '/>' +
      '<circle cx="26" cy="34" r="1.4" fill="' + INK + '"/><circle cx="18" cy="28" r="1.6" fill="#fff"' + o(.8) + '/><circle cx="15" cy="23" r="1.1" fill="#fff"' + o(.8) + '/><path d="M20 52q2-6 0-10M44 52q-2-5 0-9" stroke="#2f9e44" stroke-width="2" fill="none"/>',
    photo: '<g transform="rotate(-6 32 32)"><rect x="8" y="8" width="48" height="50" rx="2" fill="#fff"' + o() + '/><rect x="13" y="13" width="38" height="32" fill="#a5d8ff"/>' +
      '<path d="M13 45V36q8-6 19 0t19-2v11z" fill="#69db7c"/><circle cx="24" cy="27" r="4" fill="' + SKIN + '"' + o(1) + '/><rect x="20" y="31" width="8" height="9" rx="3" fill="#e5484d"' + o(1) + '/>' +
      '<circle cx="38" cy="29" r="3.4" fill="' + SKIN + '"' + o(1) + '/><rect x="34.5" y="32.5" width="7" height="7.5" rx="3" fill="#4dabf7"' + o(1) + '/><circle cx="45" cy="18" r="3" fill="#ffd43b"/></g>',
    dollhouse: '<path d="M6 26L32 6l26 20z" fill="#f06595"' + o() + '/><rect x="10" y="26" width="44" height="32" fill="#fff0f6"' + o() + '/><path d="M32 26v32M10 42h44"' + o(2) + '/>' +
      '<rect x="14" y="31" width="7" height="7" fill="#a5d8ff"' + o(1) + '/><rect x="40" y="33" width="10" height="5" rx="1" fill="#e599f7"' + o(1) + '/>' +
      '<circle cx="24" cy="50" r="3" fill="' + SKIN + '"' + o(1) + '/><path d="M21 58l1-5h4l1 5z" fill="#f783ac"' + o(1) + '/><path d="M20 48q4-5 8 0" fill="#8b5a2b"/>' +
      '<rect x="38" y="49" width="12" height="5" rx="1" fill="#ffd43b"' + o(1) + '/><path d="M39 54v4M49 54v4"' + o(1.4) + '/>',
    hall: '<rect x="4" y="6" width="56" height="30" fill="#ffe8cc"' + o() + '/><path d="M4 6h56v6H4z" fill="#c92a2a"' + o(1.5) + '/>' +
      '<path d="M4 12q6 10 0 24M60 12q-6 10 0 24" fill="#e03131"' + o(1.5) + '/><rect x="16" y="28" width="32" height="8" fill="#a9744f"' + o(1.5) + '/>' +
      '<circle cx="32" cy="20" r="4" fill="' + SKIN + '"' + o(1) + '/><rect x="29" y="24" width="6" height="4" fill="#4dabf7"/>' +
      [14, 26, 38, 50].map(x => '<rect x="' + (x - 4) + '" y="42" width="8" height="6" rx="1" fill="#4dabf7"' + o(1.2) + '/><rect x="' + (x - 4) + '" y="52" width="8" height="6" rx="1" fill="#4dabf7"' + o(1.2) + '/>').join(''),
    // sizes: the one meant is in colour, the other grey
    big: '<circle cx="24" cy="36" r="20" fill="#fab005"' + o(2.5) + '/><circle cx="52" cy="48" r="8" fill="' + GREY + '"' + o(1.5) + '/>' + arrow('M8 8h32M34 3l6 5-6 5', '#e8590c'),
    small: '<circle cx="24" cy="36" r="20" fill="' + GREY + '"' + o(1.5) + '/><circle cx="52" cy="48" r="8" fill="#fab005"' + o(2.5) + '/>' + arrow('M52 12v22M47 28l5 6 5-6', '#e8590c'),
    long: '<rect x="4" y="18" width="56" height="10" rx="5" fill="#40c057"' + o(2.5) + '/><rect x="4" y="40" width="20" height="10" rx="5" fill="' + GREY + '"' + o(1.5) + '/>' + arrow('M6 9h52M10 5l-5 4 5 4M54 5l5 4-5 4', '#e8590c'),
    short: '<rect x="4" y="18" width="56" height="10" rx="5" fill="' + GREY + '"' + o(1.5) + '/><rect x="4" y="40" width="20" height="10" rx="5" fill="#40c057"' + o(2.5) + '/>' + arrow('M6 58h16M10 54l-5 4 5 4M18 54l5 4-5 4', '#e8590c'),
    // light and dark blue: the dark one is meant
    dark: '<rect x="4" y="12" width="26" height="40" rx="5" fill="#a5d8ff"' + o(1.5) + '/><rect x="34" y="8" width="26" height="48" rx="5" fill="#1c3d73"' + o(3) + '/>' +
      '<path d="M40 50l6-6 6 6" stroke="#ffd43b" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    jump: '<path d="M14 58h36" stroke="#adb5bd" stroke-width="3" stroke-linecap="round"/><ellipse cx="32" cy="57" rx="8" ry="2" fill="#dee2e6"/>' +
      '<circle cx="32" cy="12" r="6" fill="' + SKIN + '"' + o(1.5) + '/><path d="M26 11q6-9 12 0q-6-4-12 0z" fill="#4a3426"' + o(1.2) + '/>' +
      '<rect x="27" y="18" width="10" height="14" rx="4" fill="#fab005"' + o(1.5) + '/><path d="M27 21l-9-9M37 21l9-9"' + o(5) + '/><path d="M27 21l-9-9M37 21l9-9" stroke="' + SKIN + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M29 32l-6 8 4 6M35 32l6 8-4 6"' + o(5) + ' fill="none"/><path d="M29 32l-6 8 4 6M35 32l6 8-4 6" stroke="#3b5bdb" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M14 40v8M50 40v8M20 48v4M44 48v4" stroke="#e8590c" stroke-width="2.5" stroke-linecap="round"/>',
    // a person with the part meant in colour
    head: '<rect x="20" y="34" width="24" height="18" rx="8" fill="' + GREY + '"' + o(1.5) + '/><rect x="24" y="50" width="6" height="10" fill="' + GREY2 + '"' + o(1.2) + '/><rect x="34" y="50" width="6" height="10" fill="' + GREY2 + '"' + o(1.2) + '/>' +
      '<circle cx="32" cy="20" r="14" fill="' + SKIN + '"' + o(2.5) + '/><path d="M18 18q14-18 28 0q-14-8-28 0z" fill="#8b5a2b"' + o(1.4) + '/>' +
      '<circle cx="27" cy="21" r="1.6" fill="' + INK + '"/><circle cx="37" cy="21" r="1.6" fill="' + INK + '"/><path d="M28 27q4 3 8 0" fill="none"' + o(1.4) + '/>' +
      '<circle cx="32" cy="20" r="17" fill="none" stroke="#e8590c" stroke-width="2.5" stroke-dasharray="4 3"/>',
    hair: '<circle cx="32" cy="34" r="14" fill="' + GREY + '"' + o(1.5) + '/><path d="M14 40q-4-30 18-30t18 30q-2-14-8-18-6 6-20 4-6 6-8 14z" fill="#e8590c"' + o(2) + '/>' +
      '<path d="M14 40q-2 12 4 18M50 40q2 12-4 18" fill="none" stroke="#e8590c" stroke-width="6" stroke-linecap="round"/><path d="M14 40q-2 12 4 18M50 40q2 12-4 18" fill="none"' + o(1.2) + '/>' +
      '<circle cx="27" cy="36" r="1.6" fill="' + GREY2 + '"/><circle cx="37" cy="36" r="1.6" fill="' + GREY2 + '"/>',
    puppet: '<path d="M18 56V28a14 14 0 0 1 28 0v28z" fill="#9775fa"' + o() + '/><circle cx="26" cy="27" r="4.5" fill="#fff"' + o(1.4) + '/><circle cx="38" cy="27" r="4.5" fill="#fff"' + o(1.4) + '/>' +
      '<circle cx="27" cy="28" r="2" fill="' + INK + '"/><circle cx="37" cy="28" r="2" fill="' + INK + '"/><path d="M25 37q7 6 14 0" fill="#e5484d"' + o(1.5) + '/>' +
      '<circle cx="32" cy="33" r="2.5" fill="#ff922b"' + o(1.2) + '/><path d="M18 40q-8-2-10-10M46 40q8-2 10-10" fill="none"' + o(3) + '/><path d="M18 40q-8-2-10-10M46 40q8-2 10-10" fill="none" stroke="#9775fa" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M24 14l3-7 3 6 2-7 2 7 3-6 3 7" fill="#ffd43b"' + o(1.4) + '/><rect x="16" y="54" width="32" height="8" rx="2" fill="' + SKIN + '"' + o(1.5) + '/>',
    jacket: '<path d="M20 8l12 6 12-6 14 8-4 22-6-2v22H16V36l-6 2-4-22z" fill="#364fc7"' + o() + '/><path d="M26 12l6 16 6-16" fill="#fff"' + o(1.5) + '/>' +
      '<path d="M32 28v30"' + o(1.5) + '/><path d="M24 11l8 17-6-4-4 4zM40 11l-8 17 6-4 4 4z" fill="#4c6ef5"' + o(1.4) + '/><circle cx="35" cy="38" r="1.6" fill="#ffd43b"' + o(1) + '/>' +
      '<circle cx="35" cy="46" r="1.6" fill="#ffd43b"' + o(1) + '/><path d="M20 44h7M37 44h7"' + o(1.4) + '/>',
    uniform: '<path d="M22 8l10 5 10-5 12 7-3 14-5-2v8H18v-8l-5 2-3-14z" fill="#1c7ed6"' + o() + '/><path d="M26 10l6 7 6-7-6-2z" fill="#fff"' + o(1.4) + '/>' +
      '<path d="M30 17h4l1 9-3 3-3-3z" fill="#e5484d"' + o(1.2) + '/><path d="M40 22h6v5q-3 3-6 0z" fill="#ffd43b"' + o(1.2) + '/>' +
      '<path d="M18 37h28l5 21H13z" fill="#1864ab"' + o() + '/><path d="M22 37l-2 21M32 37v21M42 37l2 21"' + o(1.2) + '/>',
    /* home */
    room: '<path d="M4 4l10 8v32L4 58z" fill="#f8d7a8"' + o() + '/><path d="M60 4l-10 8v32l10 14z" fill="#f8d7a8"' + o() + '/><path d="M14 12h36v32H14z" fill="#ffe8cc"' + o() + '/>' +
      '<path d="M14 44h36l10 14H4z" fill="#d9a066"' + o() + '/><rect x="19" y="18" width="12" height="10" fill="#a5d8ff"' + o(1.5) + '/><path d="M25 18v10M19 23h12"' + o(1.2) + '/>' +
      '<rect x="36" y="22" width="9" height="22" fill="#c98a4a"' + o(1.5) + '/><circle cx="43" cy="33" r="1" fill="' + INK + '"/>',
    balcony: '<rect x="6" y="4" width="52" height="56" fill="#ffe3bf"' + o() + '/><rect x="20" y="10" width="24" height="34" rx="2" fill="#a5d8ff"' + o() + '/><path d="M32 10v34"' + o(1.5) + '/>' +
      '<rect x="4" y="44" width="56" height="5" fill="#adb5bd"' + o() + '/><path d="M6 28h52"' + o(3) + '/><path d="M10 28v16M18 28v16M26 28v16M34 28v16M42 28v16M50 28v16"' + o(1.8) + '/>' +
      '<path d="M48 22h6l-1 6h-4z" fill="#e8590c"' + o(1.2) + '/><circle cx="49" cy="18" r="3" fill="#51cf66"' + o(1) + '/><circle cx="53" cy="19" r="3" fill="#ff6b6b"' + o(1) + '/>',
    /* animals: the part in colour */
    tail: '<path d="M10 40q0-14 16-14h12q12 0 12 12v4q0 6-6 6H16q-6 0-6-8z" fill="' + GREY + '"' + o() + '/><circle cx="14" cy="28" r="9" fill="' + GREY + '"' + o() + '/>' +
      '<path d="M7 22l1-9 6 6M15 19l6-6 1 9" fill="' + GREY + '"' + o(1.5) + '/><path d="M16 48v10M24 48v10M38 48v10M45 48v10"' + o(3.5) + '/>' +
      '<path d="M48 34q10-2 10-14t-8-10" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M48 34q10-2 10-14t-8-10" fill="none" stroke="#ff922b" stroke-width="5" stroke-linecap="round"/>',
    claw: '<ellipse cx="32" cy="40" rx="18" ry="15" fill="' + GREY + '"' + o() + '/><ellipse cx="32" cy="44" rx="8" ry="6" fill="' + GREY2 + '"/>' +
      '<circle cx="18" cy="24" r="6" fill="' + GREY + '"' + o() + '/><circle cx="28" cy="18" r="6" fill="' + GREY + '"' + o() + '/><circle cx="38" cy="18" r="6" fill="' + GREY + '"' + o() + '/><circle cx="47" cy="24" r="6" fill="' + GREY + '"' + o() + '/>' +
      '<path d="M15 19l-3-12 7 9zM26 13l-1-12 5 11zM36 12l3-11 2 12zM46 18l7-10-3 12z" fill="#e8590c"' + o(1.4) + '/>',
    whiskers: '<path d="M14 26l-2-18 12 10M50 26l2-18-12 10" fill="' + GREY + '"' + o() + '/><ellipse cx="32" cy="36" rx="20" ry="18" fill="' + GREY + '"' + o() + '/>' +
      '<circle cx="25" cy="31" r="3" fill="' + INK + '"/><circle cx="39" cy="31" r="3" fill="' + INK + '"/><path d="M29 39h6l-3 3z" fill="' + GREY2 + '"' + o(1.2) + '/>' +
      '<path d="M26 42L2 38M26 45L3 48M26 48L6 57M38 42l24-4M38 45l23 3M38 48l20 9" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M26 42L2 38M26 45L3 48M26 48L6 57M38 42l24-4M38 45l23 3M38 48l20 9" stroke="#ff922b" stroke-width="2.3" stroke-linecap="round"/>',
    beak: '<circle cx="28" cy="30" r="18" fill="' + GREY + '"' + o() + '/><path d="M12 40q4 18 22 20h10L40 44" fill="' + GREY + '"' + o() + '/><circle cx="30" cy="25" r="4" fill="#fff"' + o(1.4) + '/>' +
      '<circle cx="31" cy="25" r="2" fill="' + INK + '"/><path d="M44 26l18 6-18 6z" fill="#ff922b"' + o() + '/><path d="M44 32h17"' + o(1.4) + '/>',
    /* people: the one meant in colour */
    son: person(20, 50, 'man', false) + person(44, 32, 'boy', true, '#40c057'),
    daughter: person(20, 50, 'woman', false) + person(44, 32, 'girl', true, '#f06595'),
    brother: person(19, 36, 'girl', false) + person(45, 38, 'boy', true, '#228be6'),
    sister: person(19, 38, 'boy', false) + person(45, 36, 'girl', true, '#f06595'),
    tall: person(20, 52, 'boy', true, '#fab005') + person(44, 30, 'boy', false) + arrow('M4 10v44M1 14l3-5 3 5M1 50l3 5 3-5', '#e8590c'),
    'sit-down': '<path d="M34 34h20v4H34zM50 10v28M36 38v20M52 38v20" fill="#e8a24a"' + o() + '/><rect x="48" y="8" width="5" height="30" rx="2" fill="#e8a24a"' + o(1.6) + '/>' +
      '<circle cx="40" cy="14" r="6" fill="' + SKIN + '"' + o(1.5) + '/><path d="M34 13q6-9 12 0q-6-4-12 0z" fill="#4a3426"' + o(1.2) + '/>' +
      '<rect x="34" y="20" width="12" height="14" rx="4" fill="#40c057"' + o(1.5) + '/><path d="M34 34H24v18"' + o(6) + ' fill="none"/><path d="M34 34H24v18" stroke="#3b5bdb" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      arrow('M12 8v26M6 28l6 7 6-7', '#e8590c'),
    /* verbs with a door */
    open: '<rect x="14" y="6" width="34" height="52" fill="#343a40"' + o() + '/><path d="M48 6l12 6v40l-12 6z" fill="#c98a4a"' + o() + '/><circle cx="53" cy="33" r="1.6" fill="#ffd43b"/>' +
      '<rect x="14" y="6" width="34" height="52" fill="none"' + o() + '/><path d="M22 58h20" stroke="#ffe066" stroke-width="3" stroke-linecap="round"/>' + arrow('M20 32h18M33 26l6 6-6 6', '#40c057'),
    close: '<rect x="10" y="6" width="34" height="52" fill="#c98a4a"' + o() + '/><rect x="15" y="12" width="24" height="18" rx="2" fill="#a9744f"' + o(1.3) + '/><rect x="15" y="35" width="24" height="17" rx="2" fill="#a9744f"' + o(1.3) + '/>' +
      '<circle cx="39" cy="33" r="2" fill="#ffd43b"' + o(1) + '/>' + arrow('M63 33H52M57 27l-6 6 6 6', '#e5484d'),
    /* food */
    courgette: '<path d="M8 44q-4-8 4-12l36-20q8-4 11 3t-5 11L18 50q-8 3-10-6z" fill="#2b8a3e"' + o() + '/><path d="M14 40l38-22M16 45l36-21" stroke="#69db7c" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M54 14l6-6" stroke="#5c940d" stroke-width="5" stroke-linecap="round"/><circle cx="10" cy="45" r="3" fill="#ffd43b"' + o(1.2) + '/>',
    ayran: '<path d="M16 14h32l-4 44H20z" fill="#fff"' + o() + '/><path d="M18 26h28l-3 32H21z" fill="#f8f9fa"/><path d="M16 14h32l-4 44H20z" fill="none"' + o() + '/>' +
      '<path d="M14 16q4-8 9-4 3-6 9-2 5-5 10 0 6-2 8 6z" fill="#fff"' + o(1.6) + '/><circle cx="24" cy="20" r="2" fill="#e9ecef"' + o(.8) + '/><circle cx="38" cy="19" r="2.4" fill="#e9ecef"' + o(.8) + '/>' +
      '<circle cx="31" cy="22" r="1.6" fill="#e9ecef"' + o(.8) + '/><path d="M44 4l-6 14" stroke="#e5484d" stroke-width="3" stroke-linecap="round"/>',
    cauliflower: '<path d="M8 36q-2 16 24 22 26-6 24-22-12 8-24 6-12 2-24-6z" fill="#51cf66"' + o() + '/><path d="M14 42q8 10 18 12M50 42q-8 10-18 12" fill="none" stroke="#2f9e44" stroke-width="1.6"/>' +
      '<circle cx="20" cy="30" r="9" fill="#fff9db"' + o(1.6) + '/><circle cx="44" cy="30" r="9" fill="#fff9db"' + o(1.6) + '/><circle cx="32" cy="22" r="10" fill="#fff9db"' + o(1.6) + '/>' +
      '<circle cx="26" cy="35" r="8" fill="#fff9db"' + o(1.6) + '/><circle cx="38" cy="35" r="8" fill="#fff9db"' + o(1.6) + '/><circle cx="32" cy="30" r="6" fill="#fff9db"/>',
    spinach: '<path d="M30 60l2-20M32 60l6-22M28 60l-6-22" stroke="#5c940d" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M22 40q-18-6-14-26 14-2 18 12 4 8-4 14z" fill="#2b8a3e"' + o() + '/><path d="M40 38q18-8 12-28-14 0-16 14-2 8 4 14z" fill="#2b8a3e"' + o() + '/>' +
      '<path d="M32 40q-10-14 0-34 10 20 0 34z" fill="#37b24d"' + o() + '/><path d="M32 38V12M22 38L13 18M40 36l9-20" stroke="#8ce99a" stroke-width="1.4"/>' +
      '<rect x="24" y="48" width="16" height="5" rx="2" fill="#e5484d"' + o(1.4) + '/>',
    /* Kitap Köşesi */
    ataturk: '<ellipse cx="32" cy="34" rx="28" ry="29" fill="#ffd43b"' + o() + '/><ellipse cx="32" cy="34" rx="23" ry="24" fill="#e7f5ff"/>' +
      '<path d="M14 58q2-14 18-14t18 14z" fill="#343a40"' + o(1.6) + '/><path d="M28 44l4 8 4-8z" fill="#fff"' + o(1) + '/><path d="M31 47h2l1 6-2 2-2-2z" fill="#e5484d"/>' +
      '<ellipse cx="32" cy="35" rx="8" ry="10" fill="' + SKIN + '"' + o(1.6) + '/><path d="M22 27q0-14 10-15t10 15z" fill="#495057"' + o(1.6) + '/>' +
      '<path d="M24 22h16M23 26h18" stroke="#6c757d" stroke-width="1.2"/><circle cx="29" cy="35" r="1" fill="' + INK + '"/><circle cx="35" cy="35" r="1" fill="' + INK + '"/>' +
      '<path d="M29 40h6"' + o(1) + '/>',
    /* the days: Monday first */
    monday: week([0]), tuesday: week([1]), wednesday: week([2]), thursday: week([3]), friday: week([4]), saturday: week([5]), sunday: week([6]),
    'monday-tuesday': week([0, 1])
  };
  const NUMS = ['#ff6b6b', '#ff922b', '#fcc419', '#51cf66', '#22b8cf', '#339af0', '#845ef7', '#f06595', '#20c997', '#e8590c'];
  for (let n = 11; n <= 20; n++) R['n' + n] = num(n, NUMS[n - 11]);

  const TOKEN = /\[\[([a-z0-9-]+)\]\]/g;
  const svg = name => R[name] ? '<svg class="kr" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + R[name] + '</svg>' : '';
  // One picture: an emoji (or two) as text, or a drawing for [[name]].
  const kelimeResmi = pic => String(pic || '').replace(TOKEN, (_, name) => svg(name));
  // An escaped text with [[name]] pictures in it.
  const resimliMetin = html => String(html).replace(TOKEN, (_, name) => svg(name));
  const cizim = pic => /\[\[[a-z0-9-]+\]\]/.test(String(pic || ''));
  return { kelimeResmi, resimliMetin, cizim, adlar: () => Object.keys(R) };
})();
