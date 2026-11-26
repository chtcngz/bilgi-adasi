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
    // a box of chalk sticks, one lying in front with its dust
    // the boards: green (board), black (blackboard), white with a marker (whiteboard)
    board: '<rect x="4" y="8" width="56" height="38" rx="3" fill="#2f9e44"' + o() + '/><rect x="2" y="44" width="60" height="5" rx="2" fill="#c98a4a"' + o(1.5) + '/>' +
      '<path d="M12 20h16M12 28h24M12 36h12" stroke="#d3f9d8" stroke-width="2.4" stroke-linecap="round"/><path d="M16 49l-4 12M48 49l4 12"' + o(3) + '/>',
    'coloured-pencil': [['#e5484d', -24], ['#ffd43b', -8], ['#4dabf7', 8], ['#51cf66', 24]].map(([c, r]) =>
      '<g transform="rotate(' + r + ' 32 58)"><rect x="28" y="16" width="8" height="38" fill="' + c + '"' + o(1.5) + '/><path d="M28 16l4-10 4 10z" fill="#f4d9b0"' + o(1.5) + '/><path d="M30.6 9.5l1.4-3.5 1.4 3.5z" fill="' + c + '"/></g>').join(''),
    tablet: '<rect x="6" y="10" width="52" height="40" rx="6" fill="#343a40"' + o() + '/><rect x="11" y="15" width="42" height="30" rx="2" fill="#a5d8ff"/>' +
      '<rect x="15" y="19" width="9" height="9" rx="2" fill="#ff8787"/><rect x="27" y="19" width="9" height="9" rx="2" fill="#69db7c"/><rect x="39" y="19" width="9" height="9" rx="2" fill="#ffd43b"/>' +
      '<rect x="15" y="32" width="9" height="9" rx="2" fill="#b197fc"/><rect x="27" y="32" width="9" height="9" rx="2" fill="#ffa94d"/><circle cx="55" cy="30" r="1.5" fill="#868e96"/>',
    hall: '<rect x="4" y="6" width="56" height="30" fill="#ffe8cc"' + o() + '/><path d="M4 6h56v6H4z" fill="#c92a2a"' + o(1.5) + '/>' +
      '<path d="M4 12q6 10 0 24M60 12q-6 10 0 24" fill="#e03131"' + o(1.5) + '/><rect x="16" y="28" width="32" height="8" fill="#a9744f"' + o(1.5) + '/>' +
      '<circle cx="32" cy="20" r="4" fill="' + SKIN + '"' + o(1) + '/><rect x="29" y="24" width="6" height="4" fill="#4dabf7"/>' +
      [14, 26, 38, 50].map(x => '<rect x="' + (x - 4) + '" y="42" width="8" height="6" rx="1" fill="#4dabf7"' + o(1.2) + '/><rect x="' + (x - 4) + '" y="52" width="8" height="6" rx="1" fill="#4dabf7"' + o(1.2) + '/>').join(''),
    // sizes: the one meant is in colour, the other grey
    big: '<circle cx="24" cy="36" r="20" fill="#fab005"' + o(2.5) + '/><circle cx="52" cy="48" r="8" fill="' + GREY + '"' + o(1.5) + '/>' + arrow('M8 8h32M34 3l6 5-6 5', '#e8590c'),
    long: '<rect x="4" y="18" width="56" height="10" rx="5" fill="#40c057"' + o(2.5) + '/><rect x="4" y="40" width="20" height="10" rx="5" fill="' + GREY + '"' + o(1.5) + '/>' + arrow('M6 9h52M10 5l-5 4 5 4M54 5l5 4-5 4', '#e8590c'),
    short: '<rect x="4" y="18" width="56" height="10" rx="5" fill="' + GREY + '"' + o(1.5) + '/><rect x="4" y="40" width="20" height="10" rx="5" fill="#40c057"' + o(2.5) + '/>' + arrow('M6 58h16M10 54l-5 4 5 4M18 54l5 4-5 4', '#e8590c'),
    // light and dark blue: the dark one is meant
    dark: '<rect x="4" y="12" width="26" height="40" rx="5" fill="#a5d8ff"' + o(1.5) + '/><rect x="34" y="8" width="26" height="48" rx="5" fill="#1c3d73"' + o(3) + '/>' +
      '<path d="M40 50l6-6 6 6" stroke="#ffd43b" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    // a person with the part meant in colour
    uniform: '<path d="M22 8l10 5 10-5 12 7-3 14-5-2v8H18v-8l-5 2-3-14z" fill="#1c7ed6"' + o() + '/><path d="M26 10l6 7 6-7-6-2z" fill="#fff"' + o(1.4) + '/>' +
      '<path d="M30 17h4l1 9-3 3-3-3z" fill="#e5484d"' + o(1.2) + '/><path d="M40 22h6v5q-3 3-6 0z" fill="#ffd43b"' + o(1.2) + '/>' +
      '<path d="M18 37h28l5 21H13z" fill="#1864ab"' + o() + '/><path d="M22 37l-2 21M32 37v21M42 37l2 21"' + o(1.2) + '/>',
    /* home */
    room: '<path d="M4 4l10 8v32L4 58z" fill="#f8d7a8"' + o() + '/><path d="M60 4l-10 8v32l10 14z" fill="#f8d7a8"' + o() + '/><path d="M14 12h36v32H14z" fill="#ffe8cc"' + o() + '/>' +
      '<path d="M14 44h36l10 14H4z" fill="#d9a066"' + o() + '/><rect x="19" y="18" width="12" height="10" fill="#a5d8ff"' + o(1.5) + '/><path d="M25 18v10M19 23h12"' + o(1.2) + '/>' +
      '<rect x="36" y="22" width="9" height="22" fill="#c98a4a"' + o(1.5) + '/><circle cx="43" cy="33" r="1" fill="' + INK + '"/>',
    /* animals: the part in colour */
    tail: '<path d="M10 40q0-14 16-14h12q12 0 12 12v4q0 6-6 6H16q-6 0-6-8z" fill="' + GREY + '"' + o() + '/><circle cx="14" cy="28" r="9" fill="' + GREY + '"' + o() + '/>' +
      '<path d="M7 22l1-9 6 6M15 19l6-6 1 9" fill="' + GREY + '"' + o(1.5) + '/><path d="M16 48v10M24 48v10M38 48v10M45 48v10"' + o(3.5) + '/>' +
      '<path d="M48 34q10-2 10-14t-8-10" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M48 34q10-2 10-14t-8-10" fill="none" stroke="#ff922b" stroke-width="5" stroke-linecap="round"/>',
    whiskers: '<path d="M14 26l-2-18 12 10M50 26l2-18-12 10" fill="' + GREY + '"' + o() + '/><ellipse cx="32" cy="36" rx="20" ry="18" fill="' + GREY + '"' + o() + '/>' +
      '<circle cx="25" cy="31" r="3" fill="' + INK + '"/><circle cx="39" cy="31" r="3" fill="' + INK + '"/><path d="M29 39h6l-3 3z" fill="' + GREY2 + '"' + o(1.2) + '/>' +
      '<path d="M26 42L2 38M26 45L3 48M26 48L6 57M38 42l24-4M38 45l23 3M38 48l20 9" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M26 42L2 38M26 45L3 48M26 48L6 57M38 42l24-4M38 45l23 3M38 48l20 9" stroke="#ff922b" stroke-width="2.3" stroke-linecap="round"/>',
    /* people: the one meant in colour */
    son: person(20, 50, 'man', false) + person(44, 32, 'boy', true, '#40c057'),
    /* verbs with a door */
    /* food */
    ayran: '<path d="M16 14h32l-4 44H20z" fill="#fff"' + o() + '/><path d="M18 26h28l-3 32H21z" fill="#f8f9fa"/><path d="M16 14h32l-4 44H20z" fill="none"' + o() + '/>' +
      '<path d="M14 16q4-8 9-4 3-6 9-2 5-5 10 0 6-2 8 6z" fill="#fff"' + o(1.6) + '/><circle cx="24" cy="20" r="2" fill="#e9ecef"' + o(.8) + '/><circle cx="38" cy="19" r="2.4" fill="#e9ecef"' + o(.8) + '/>' +
      '<circle cx="31" cy="22" r="1.6" fill="#e9ecef"' + o(.8) + '/><path d="M44 4l-6 14" stroke="#e5484d" stroke-width="3" stroke-linecap="round"/>',
    /* Kitap Köşesi */
    ataturk: '<ellipse cx="32" cy="34" rx="28" ry="29" fill="#ffd43b"' + o() + '/><ellipse cx="32" cy="34" rx="23" ry="24" fill="#e7f5ff"/>' +
      '<path d="M14 58q2-14 18-14t18 14z" fill="#343a40"' + o(1.6) + '/><path d="M28 44l4 8 4-8z" fill="#fff"' + o(1) + '/><path d="M31 47h2l1 6-2 2-2-2z" fill="#e5484d"/>' +
      '<ellipse cx="32" cy="35" rx="8" ry="10" fill="' + SKIN + '"' + o(1.6) + '/><path d="M22 27q0-14 10-15t10 15z" fill="#495057"' + o(1.6) + '/>' +
      '<path d="M24 22h16M23 26h18" stroke="#6c757d" stroke-width="1.2"/><circle cx="29" cy="35" r="1" fill="' + INK + '"/><circle cx="35" cy="35" r="1" fill="' + INK + '"/>' +
      '<path d="M29 40h6"' + o(1) + '/>',
    /* the days: Monday first */
    tuesday: week([1]), wednesday: week([2]), thursday: week([3]), friday: week([4]), saturday: week([5]), sunday: week([6]),
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
  // more drawings from other files (core/js/cizimler.js): { name: svg inner markup in a 64×64 box }
  const ekle = more => Object.assign(R, more);
  return { kelimeResmi, resimliMetin, cizim, ekle, adlar: () => Object.keys(R) };
})();
