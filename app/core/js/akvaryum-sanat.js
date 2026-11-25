// Akvaryum's drawings: the fish, the ornaments, the plants and the textures of a tank. Every drawing is an SVG
// string; their gradients, clip paths and patterns live once in a hidden <svg> at the end of <body> (a gradient
// inside a closed dialog does not paint, so they cannot sit in the dialogs that show the drawings).
// Fish face left, head at the left of their viewBox; core/js/akvaryum.js turns them round.
const akvaryumSanat = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const defs = [];
  const id = name => 'akd-' + name;
  const url = name => 'url(#' + id(name) + ')';
  const grad = (name, stops, { x2 = 0, y2 = 1, x1 = 0, y1 = 0 } = {}) =>
    defs.push('<linearGradient id="' + id(name) + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map(([o, c, a = 1]) => '<stop offset="' + o + '" stop-color="' + c + '" stop-opacity="' + a + '"/>').join('') + '</linearGradient>');
  const radial = (name, stops, { cx = .5, cy = .5, r = .5, fx = cx, fy = cy } = {}) =>
    defs.push('<radialGradient id="' + id(name) + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fx="' + fx + '" fy="' + fy + '">' +
      stops.map(([o, c, a = 1]) => '<stop offset="' + o + '" stop-color="' + c + '" stop-opacity="' + a + '"/>').join('') + '</radialGradient>');
  const clip = (name, ...paths) => defs.push('<clipPath id="' + id(name) + '">' + paths.map(d => '<path d="' + d + '"/>').join('') + '</clipPath>');

  // A seeded random, so a tank's plants and pebbles lie the same way each time it opens.
  function seeded(seed) {
    let a = seed >>> 0 || 1;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f1 = n => Math.round(n * 10) / 10;

  /* ---------- Shared shading ---------- */
  // Light from above: a soft highlight high on the body, a shadow low on it.
  radial('shade', [[0, '#fff', .55], [.45, '#fff', 0], [.8, '#000', 0], [1, '#000', .3]], { cx: .42, cy: .32, r: .78, fx: .35, fy: .22 });
  grad('belly', [[0, '#000', .22], [.4, '#000', 0], [.7, '#fff', 0], [1, '#fff', .3]]);
  defs.push('<pattern id="' + id('scales') + '" width="8" height="10" patternUnits="userSpaceOnUse">' +
    '<path d="M0 5Q4 0 8 5M-4 10Q0 5 4 10M4 10Q8 5 12 10" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".8"/>' +
    '<path d="M0 6Q4 1 8 6" fill="none" stroke="#000" stroke-opacity=".05" stroke-width=".8"/></pattern>');
  radial('glass', [[0, '#fff', .9], [.5, '#fff', .25], [1, '#fff', 0]], { cx: .35, cy: .35, r: .7 });

  /* ---------- Fish ---------- */
  // Each kind: its viewBox, the body, tail and fins as paths, where the tail joins (and the spread of its rays),
  // the eye, its colours (b body top → belly, f fins, t tail) and what is painted on the body.
  const kinds = {};
  kinds.palyaco = {
    vb: '0 0 200 120',
    b: [[0, '#f25a00'], [.5, '#ff8418'], [1, '#ffb251']], f: [[0, '#ff7a10'], [1, '#ff9a3a', .92]], t: [[0, '#ff7a10'], [1, '#ffa24a', .9]],
    body: 'M14 64C14 40 42 26 82 26C118 26 142 40 156 56C159 60 159 66 156 70C142 86 118 100 82 100C42 100 14 88 14 64Z',
    tail: 'M150 58C162 46 180 36 192 38C199 52 199 76 192 90C180 92 162 82 150 70Z', joint: [150, 64, -40, 40],
    dorsal: 'M54 36C58 18 72 10 86 14C94 16 98 22 100 28C108 14 128 12 142 26C150 34 154 44 154 58L100 44Z', dorsalRay: [100, 50, -150, -30],
    anal: 'M100 92C106 108 124 114 136 104C142 98 146 88 148 76L110 84Z', analRay: [112, 80, 30, 110],
    pelvic: 'M62 94C62 108 70 114 80 112C80 104 76 98 70 92Z',
    pec: 'M58 72C70 66 84 70 90 80C84 90 70 90 62 84C58 80 56 76 58 72Z', pecAt: [60, 76],
    edge: '#151515', edgeW: 2.6, eye: [36, 52, 8.5], iris: '#ec7a14', mouth: 'M15 70q6 4 12 2',
    over: c => '<g clip-path="' + c + '" fill="#fff" stroke="#131313" stroke-width="3.2">' +
      '<path d="M44 20C54 40 56 84 44 106L62 106C72 84 72 40 62 20Z"/>' +
      '<path d="M96 18C88 40 86 58 98 72C90 84 92 98 100 108L118 108C110 96 108 84 116 72C106 58 108 40 116 18Z"/>' +
      '<path d="M140 28C136 50 136 76 140 98L156 98C152 76 152 50 156 28Z"/></g>'
  };
  kinds.cerrah = {
    vb: '0 0 210 120',
    b: [[0, '#123fb4'], [.5, '#2465e6'], [1, '#5c9cff']], f: [[0, '#1a4fd0'], [1, '#3a7cf0', .95]], t: [[0, '#ffcf1a'], [1, '#ffb000']],
    body: 'M10 62C12 44 34 24 74 22C112 20 146 34 164 56C167 60 167 66 164 70C146 90 112 102 74 102C34 100 12 80 10 62Z',
    tail: 'M160 58L198 28C191 46 189 56 189 64C189 72 191 82 198 100L160 70Z', joint: [160, 64, -38, 38],
    dorsal: 'M30 36C62 12 124 12 156 38C161 44 164 50 164 58C150 44 120 34 80 30Z', dorsalRay: [96, 46, -165, -15],
    anal: 'M52 96C88 116 132 110 154 88C159 82 163 76 164 70C150 82 120 94 80 98Z', analRay: [100, 80, 20, 160],
    pec: 'M56 70C68 62 88 64 96 72C88 82 70 84 58 78Z', pecAt: [58, 72], pecFill: '#ffd34a',
    edge: '#0a1430', edgeW: 2.6, fin: '#0c1024', eye: [30, 52, 7], iris: '#1b2b55', mouth: 'M11 64q5 3 9 1',
    over: c => '<g clip-path="' + c + '" fill="none" stroke="#0a0f1f" stroke-linecap="round">' +
      '<path d="M24 50C56 30 110 28 142 44C154 50 160 58 162 66" stroke-width="13"/>' +
      '<path d="M162 66C142 80 100 84 74 66" stroke-width="10"/>' +
      '<path d="M8 36C40 22 110 18 168 50" stroke-width="5"/></g>' +
      '<path d="M190 30L160 58M190 98L160 70" stroke="#111" stroke-width="4" fill="none"/>'
  };
  kinds.sari = {
    vb: '0 -20 190 160',
    b: [[0, '#f0bb00'], [.5, '#ffd81a'], [1, '#ffec6a']], f: [[0, '#f6c400'], [1, '#ffd82e', .9]], t: [[0, '#f5c000'], [1, '#ffe14a', .9]],
    body: 'M8 62C18 52 28 40 44 34C72 24 112 28 136 48C142 54 146 58 148 62C146 66 142 70 136 76C112 96 72 100 44 90C28 84 18 72 8 64Z',
    tail: 'M144 58L178 38C172 54 172 70 178 86L144 66Z', joint: [144, 62, -36, 36],
    dorsal: 'M34 40C52 8 96 -8 122 4C138 12 146 34 150 58C130 40 100 30 60 32Z', dorsalRay: [92, 40, -160, -40],
    anal: 'M34 84C52 116 96 132 122 120C138 112 146 90 150 66C130 84 100 94 60 92Z', analRay: [92, 84, 40, 160],
    pec: 'M50 64C62 58 76 60 82 68C76 76 62 78 52 72Z', pecAt: [52, 66],
    edge: '#a87b00', edgeW: 1.6, eye: [30, 52, 7], iris: '#3b2a05', mouth: 'M8 62q3 2 6 1',
    over: () => '<path d="M130 62C134 58 140 58 143 62C140 66 134 66 130 62Z" fill="#fffbe8"/>'
  };
  kinds.melek = {
    vb: '0 -40 180 200',
    b: [[0, '#aab8be'], [.45, '#e6eef1'], [1, '#ffffff']], f: [[0, '#cfd9dd', .85], [1, '#eef3f5', .6]], t: [[0, '#d4dde1', .85], [1, '#f2f6f7', .5]],
    body: 'M8 60C18 48 36 36 60 34C86 32 106 42 120 56C122 60 122 64 120 68C106 82 86 92 60 90C36 88 18 76 8 64Z',
    tail: 'M118 56L160 30C154 50 154 74 160 94L118 68Z', joint: [118, 62, -36, 36],
    dorsal: 'M44 38C60 20 84 -12 104 -36C106 -4 112 28 120 58C104 44 80 36 44 38Z', dorsalRay: [80, 40, -110, -60],
    anal: 'M44 86C60 104 84 136 104 160C106 128 112 96 120 66C104 80 80 88 44 86Z', analRay: [80, 84, 60, 110],
    pec: 'M40 62C50 58 60 62 62 70C54 74 44 72 40 66Z', pecAt: [42, 64],
    edge: '#6d7a80', edgeW: 1.2, eye: [24, 54, 6.5], iris: '#c8322c', mouth: 'M9 62q4 2 7 1',
    under: '<path d="M54 86C56 110 62 132 70 152M60 86C64 108 72 126 84 142" fill="none" stroke="#d8e0e3" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M152 36L176 18M152 88L176 106" stroke="#dbe3e6" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>',
    all: true,
    over: c => '<g clip-path="' + c + '" fill="none" stroke="#1d2226" stroke-linecap="round" opacity=".88">' +
      '<path d="M28 30L20 96" stroke-width="7"/><path d="M62 -40C56 30 56 100 64 170" stroke-width="10"/>' +
      '<path d="M98 -30C92 30 92 100 100 160" stroke-width="7"/><path d="M118 40L118 86" stroke-width="5"/></g>'
  };
  kinds.neon = {
    vb: '0 6 150 64',
    b: [[0, '#6b7d6c'], [.42, '#b9c8bb'], [1, '#f2f5ef']], f: [[0, '#dfe8e1', .45], [1, '#ffffff', .2]], t: [[0, '#d0dcd2', .55], [1, '#ffffff', .2]],
    body: 'M6 36C14 28 40 22 74 24C98 26 112 32 120 36C112 40 98 46 74 48C40 50 14 44 6 36Z',
    tail: 'M114 36L142 20C138 30 134 34 133 36C134 38 138 42 142 52Z', joint: [114, 36, -32, 32],
    dorsal: 'M62 28C66 16 76 12 84 16L82 28Z', anal: 'M72 46C80 56 94 58 102 52L96 44Z',
    edge: '#4d5a4f', edgeW: .8, eye: [17, 34, 5.2], iris: '#8fb7c9', mouth: 'M7 37q3 1 5 0',
    over: c => '<g clip-path="' + c + '"><path d="M56 40C78 38 100 37 116 37C108 43 94 48 76 49C66 49 58 46 56 40Z" fill="#ec2236"/>' +
      '<path d="M14 35C40 31 80 31 114 35.5" stroke="#38d6ff" stroke-width="10" stroke-opacity=".25" fill="none"/>' +
      '<path d="M14 35C40 31 80 31 114 35.5" stroke="url(#' + id('neon-line') + ')" stroke-width="4.6" fill="none" stroke-linecap="round"/></g>'
  };
  grad('neon-line', [[0, '#7ff2ff'], [.5, '#20b8ff'], [1, '#2a6bff']], { x2: 1, y2: 0 });
  kinds.japon = {
    vb: '0 -4 220 130',
    b: [[0, '#f06400'], [.5, '#ff8f1a'], [1, '#ffc566']], f: [[0, '#ff8a1e', .9], [1, '#ffd08a', .55]], t: [[0, '#ff8a1e', .92], [.6, '#ffb45a', .65], [1, '#ffe1b0', .35]],
    body: 'M12 66C12 40 40 26 78 26C112 26 134 46 142 64C134 84 112 102 78 102C40 102 12 90 12 66Z',
    tail: 'M134 60C150 40 180 22 210 30C204 44 196 54 200 64C196 74 204 86 212 102C182 112 150 92 134 70Z', joint: [134, 65, -44, 44],
    tailBack: 'M136 64C154 62 178 66 200 80C210 88 214 100 206 112C192 108 176 100 160 88C150 80 142 74 136 70Z',
    dorsal: 'M52 32C58 8 86 -2 108 8C116 14 120 22 122 34L80 30Z', dorsalRay: [86, 36, -150, -40],
    anal: 'M106 94C112 108 128 116 142 108L128 88Z', analRay: [112, 90, 20, 100],
    pelvic: 'M54 96C52 110 60 118 70 116L70 98Z',
    pec: 'M44 72C54 70 64 76 66 86C58 90 48 88 44 80Z', pecAt: [46, 74],
    edge: '#b84a00', edgeW: 1.4, eye: [32, 56, 8.5], iris: '#e8a21a', mouth: 'M12 70q4 3 9 2', scales: 1.4,
    gill: 'M50 40Q60 64 50 90'
  };
  kinds.beta = {
    vb: '0 -10 220 140',
    b: [[0, '#6e0c2a'], [.5, '#c21a3c'], [1, '#e34c62']], f: [[0, '#c4183c', .95], [.7, '#8a1f86', .85], [1, '#3d4bdc', .8]], t: [[0, '#c4183c', .95], [.6, '#8c1f8a', .85], [1, '#3a52e6', .75]],
    body: 'M8 54C16 44 40 38 66 40C88 42 102 48 108 54C102 60 88 66 66 68C40 70 16 64 8 54Z',
    tail: 'M102 46C120 14 170 -4 208 20C220 40 216 68 210 88C198 116 150 126 112 82C108 74 104 64 102 60Z', joint: [104, 54, -70, 60],
    dorsal: 'M60 42C68 20 96 6 120 14C128 20 128 32 118 40C112 44 104 48 100 50Z', dorsalRay: [96, 48, -150, -40],
    anal: 'M34 64C44 92 76 120 120 126C142 128 152 118 144 106C126 96 112 80 104 62Z', analRay: [70, 62, 40, 120],
    pelvic: 'M38 64C34 84 40 100 50 110C52 96 50 80 46 64Z',
    pec: 'M32 56C38 52 46 54 48 60C42 64 36 62 32 58Z', pecAt: [34, 57], pecFill: '#f0a0b0',
    edge: '#4a0618', edgeW: 1, eye: [20, 50, 5], iris: '#2a0a10', mouth: 'M8 54q3 2 6 1', rays: 1.6, wavy: true
  };
  kinds.disk = {
    vb: '0 -6 190 140',
    b: [[0, '#0f8f94'], [.5, '#2fbcb6'], [1, '#79e0cf']], f: [[0, '#26a9a8', .95], [1, '#7cd8cf', .7]], t: [[0, '#2aa8a6', .8], [1, '#a6ebe2', .45]],
    body: 'M12 64C12 34 40 14 76 14C110 14 136 34 142 58C143 62 143 66 142 70C136 96 110 116 76 116C40 116 12 94 12 64Z',
    tail: 'M144 58C154 50 168 46 176 48C180 58 180 70 176 80C168 82 154 78 144 70Z', joint: [144, 64, -30, 30],
    dorsal: 'M26 34C46 4 104 -4 136 22C148 32 152 48 152 62L80 40Z', anal: 'M26 94C46 124 104 132 136 106C148 96 152 80 152 66L80 88Z',
    pec: 'M50 64C58 60 68 62 72 70C66 76 56 76 50 70Z', pecAt: [52, 66],
    edge: '#e0502a', edgeW: 2.4, eye: [30, 58, 6.5], iris: '#d6262a', mouth: 'M12 66q3 2 6 1', all: true,
    over: c => '<g clip-path="' + c + '" fill="none" stroke="#e8542a" stroke-width="2.8" opacity=".85" stroke-linecap="round">' +
      [6, 22, 38, 54, 70, 86, 102, 118].map((y, k) => '<path d="M0 ' + y + 'q12 ' + (k % 2 ? 5 : -5) + ' 24 0t24 0t24 0t24 0t24 0t24 0t24 0"/>').join('') +
      '</g><g clip-path="' + c + '" stroke="#0b5054" stroke-opacity=".14" stroke-width="7">' +
      '<path d="M44 0V140M72 0V140M100 0V140M126 0V140"/></g>'
  };
  kinds.balon = {
    vb: '0 6 180 110',
    b: [[0, '#a98d2c'], [.35, '#d9bf56'], [.6, '#f2e6ae'], [1, '#ffffff']], f: [[0, '#e8d27a', .8], [1, '#fff4c0', .5]], t: [[0, '#d9c060', .85], [1, '#fff0b0', .5]],
    body: 'M14 62C14 38 40 22 76 22C110 22 134 40 140 60C134 82 110 100 76 100C40 100 14 86 14 62Z',
    tail: 'M134 56C144 48 158 44 166 46C170 56 170 68 166 78C158 80 144 76 134 68Z', joint: [134, 62, -30, 30],
    dorsal: 'M110 32C116 22 128 22 132 30L126 42Z', anal: 'M110 90C116 100 128 100 132 92L126 80Z',
    pec: 'M54 64C60 56 70 56 72 64C70 72 60 72 54 64Z', pecAt: [56, 64],
    edge: '#7b6420', edgeW: 1.2, eye: [36, 50, 10.5], iris: '#3a9a5c', mouth: 'M14 64q4 3 8 1', inflate: true,
    over: c => '<g clip-path="' + c + '" fill="#6b4f16" opacity=".75">' +
      [[50, 30, 4], [66, 36, 3.5], [84, 30, 4.5], [100, 38, 3.5], [116, 44, 3], [60, 48, 3], [78, 46, 3.5], [96, 52, 3], [112, 58, 3],
        [44, 40, 2.5], [128, 52, 2.5], [88, 60, 2.5]].map(([x, y, r]) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>').join('') + '</g>',
    top: '<g class="akf-spikes" stroke="#8b7430" stroke-width="2" stroke-linecap="round">' +
      Array.from({ length: 22 }, (_, k) => {
        const a = (k / 22) * Math.PI * 2, x = 78 + Math.cos(a) * 62, y = 62 + Math.sin(a) * 38;
        return '<path d="M' + f1(x) + ' ' + f1(y) + 'l' + f1(Math.cos(a) * 7) + ' ' + f1(Math.sin(a) * 7) + '"/>';
      }).join('') + '</g>'
  };
  kinds.kelebek = {
    vb: '0 -14 190 146',
    b: [[0, '#e9e6dc'], [.5, '#fbfaf5'], [1, '#ffffff']], f: [[0, '#f2efe4', .9], [1, '#fffdf4', .7]], t: [[0, '#f4f0d0', .6], [1, '#fffbe0', .3]],
    body: 'M4 60L22 56C32 40 52 28 80 28C110 28 130 42 140 58C142 62 142 64 140 68C130 84 110 96 80 96C52 96 32 84 22 68L4 64Z',
    tail: 'M140 58C150 52 164 48 174 50C178 58 178 68 174 76C164 78 150 74 140 68Z', joint: [140, 63, -26, 26],
    dorsal: 'M38 36C58 8 104 0 130 18C140 26 146 42 148 58L100 38Z', dorsalRay: [96, 40, -150, -40],
    anal: 'M46 88C66 114 108 120 132 104C142 96 146 80 148 68L100 86Z', analRay: [96, 84, 40, 150],
    pec: 'M50 64C58 60 68 62 72 68C66 74 56 74 50 70Z', pecAt: [52, 66],
    edge: '#5b4a3a', edgeW: 1.2, eye: [34, 56, 5.5], iris: '#2b1e14', mouth: 'M4 62h3', all: true,
    over: c => '<g clip-path="' + c + '" fill="none" stroke-linecap="butt">' +
      [['M32 10C27 50 27 80 33 110', 12], ['M66 -10C60 40 60 90 68 130', 16], ['M102 -10C96 40 96 90 104 130', 15], ['M134 20C130 46 130 82 136 106', 10]]
        .map(([d, w]) => '<path d="' + d + '" stroke="#3a2a1c" stroke-width="' + (w + 4) + '"/><path d="' + d + '" stroke="#f0861a" stroke-width="' + w + '"/>').join('') +
      '<path d="M140 62H178" stroke="#2a1e14" stroke-width="5"/>' +
      '<circle cx="126" cy="36" r="7.5" fill="#fff" stroke="none"/><circle cx="126" cy="36" r="5.5" fill="#111" stroke="none"/></g>'
  };
  kinds.lepistes = {
    vb: '0 6 160 64',
    b: [[0, '#7f8b77'], [.5, '#c7ccbc'], [1, '#eef0e6']], f: [[0, '#ff7a2a', .9], [1, '#ff3f7a', .8]], t: [[0, '#ff6a2a', .95], [.55, '#ffae3a', .9], [1, '#ff3d78', .85]],
    body: 'M6 40C14 32 34 28 56 30C72 32 84 36 90 40C84 44 72 48 56 50C34 52 14 48 6 40Z',
    tail: 'M86 38C104 16 138 12 154 28C160 38 158 52 150 62C134 70 104 62 86 44Z', joint: [86, 41, -50, 40],
    dorsal: 'M48 32C56 20 72 14 84 20C82 28 78 34 74 36Z', anal: 'M58 48C62 54 70 56 74 52L70 46Z',
    edge: '#5d6656', edgeW: .8, eye: [14, 38, 4.4], iris: '#9a8f50', mouth: 'M6 40q2 1 4 0',
    over: c => '<g clip-path="' + c + '"><path d="M38 36C50 33 62 35 70 40C62 45 50 47 38 44Z" fill="#3fa3ff" opacity=".6"/>' +
      '<circle cx="74" cy="42" r="4" fill="#ff7a2a"/><circle cx="56" cy="38" r="2.5" fill="#111" opacity=".6"/></g>',
    tailOver: '<g fill="#1d1d2e" opacity=".55"><circle cx="118" cy="30" r="3.2"/><circle cx="134" cy="40" r="3"/><circle cx="124" cy="50" r="3.6"/><circle cx="142" cy="54" r="2.6"/></g>' +
      '<g fill="#5ad0ff" opacity=".8"><circle cx="108" cy="40" r="2.4"/><circle cx="140" cy="30" r="2"/><circle cx="132" cy="58" r="2"/></g>'
  };
  kinds.grama = {
    vb: '0 10 170 86',
    b: [[0, '#000', 0], [1, '#000', 0]], f: [[0, '#b23ad8'], [.5, '#c84ae0'], [.55, '#ffcf24'], [1, '#ffd94a']], t: [[0, '#ffc81a'], [1, '#ffe066', .9]],
    bodyFill: url('grama'),
    body: 'M6 50C12 38 36 30 66 30C96 30 118 40 128 48C130 50 130 52 128 54C118 62 96 70 66 70C36 70 12 62 6 50Z',
    tail: 'M126 46L156 32C152 44 150 50 150 52C150 54 152 60 156 72L126 56Z', joint: [126, 51, -30, 30],
    dorsal: 'M30 34C48 22 90 18 118 30C124 34 128 40 130 46L70 34Z', dorsalRay: [80, 40, -165, -20],
    anal: 'M70 66C86 78 110 76 124 64L100 62Z',
    pelvic: 'M38 66C38 80 44 88 52 90C52 80 48 72 44 66Z', pelvicFill: '#9b2fc6',
    edge: '#5a1a70', edgeW: 1, eye: [22, 46, 5], iris: '#ffcc2a', mouth: 'M6 50q3 2 6 1', finH: true,
    over: c => '<g clip-path="' + c + '"><path d="M8 44L32 39" stroke="#1d1020" stroke-width="2.4" stroke-linecap="round"/></g>',
    top: '<circle cx="44" cy="27" r="4.2" fill="#14081a"/>'
  };
  grad('grama', [[0, '#a02cd0'], [.46, '#c443de'], [.56, '#ffcc1a'], [1, '#ffd84a']], { x2: 1, y2: 0 });
  kinds.denizati = {
    vb: '0 0 90 160', upright: true,
    b: [[0, '#e88a12'], [.5, '#f6b030'], [1, '#ffd36a']], f: [[0, '#ffd27a', .7], [1, '#fff0c0', .35]], t: [[0, '#000', 0], [1, '#000', 0]],
    bodyGrad: { x2: 1, y2: 0 },
    body: 'M44 13C54 10 64 16 64 26C64 32 60 36 58 40C68 52 70 78 62 100C58 108 54 112 50 116C54 124 60 132 58 142C56 150 46 153 41 147C37 141 42 135 47 138L49 141C46 139 44 142 46 145C48 148 53 147 54 142C55 134 48 126 44 118C30 106 24 76 32 52C34 46 37 42 40 39L38 36L14 34C9 34 7 30 10 27C12 25 16 25 20 25L36 24C37 19 40 15 44 13Z',
    dorsal: 'M62 64C76 64 82 74 80 88L62 88Z', pec: 'M56 42C62 38 68 40 70 46C66 50 60 50 56 46Z', pecAt: [57, 44],
    edge: '#9a5300', edgeW: 1.2, eye: [47, 24, 4.4], iris: '#5a3000', mouth: 'M10 30h3',
    over: c => '<g clip-path="' + c + '" fill="none" stroke="#9a5a08" stroke-opacity=".45" stroke-width="1.6">' +
      [46, 54, 62, 70, 78, 86, 94, 102, 110, 118, 126, 134].map(y => '<path d="M20 ' + y + 'Q46 ' + (y + 5) + ' 72 ' + y + '"/>').join('') + '</g>' +
      '<g clip-path="' + c + '" fill="#fff4cf" opacity=".6"><circle cx="40" cy="60" r="1.6"/><circle cx="50" cy="74" r="1.4"/><circle cx="38" cy="86" r="1.6"/><circle cx="54" cy="96" r="1.3"/></g>',
    top: '<path d="M46 13l2-6 3 5 2-6 2 6 2-4 1 6" fill="none" stroke="#e08a12" stroke-width="2.4" stroke-linejoin="round"/>'
  };

  // Defs for every kind: its gradients and the clip paths its markings and fin rays are painted through.
  for (const [k, s] of Object.entries(kinds)) {
    grad(k + '-b', s.b, s.bodyGrad);
    grad(k + '-f', s.f, s.finH ? { x2: 1, y2: 0 } : { x2: 1, y2: .3 });
    grad(k + '-t', s.t, { x2: 1, y2: 0 });
    clip(k + '-cb', s.body);
    if (s.tail) clip(k + '-ct', s.tail);
    if (s.dorsal) clip(k + '-cd', s.dorsal);
    if (s.anal) clip(k + '-ca', s.anal);
    clip(k + '-cx', ...[s.body, s.dorsal, s.anal, s.tail].filter(Boolean));
  }
  // Fin rays: thin lines spreading from where the fin grows, seen through the fin.
  function rays([x, y, a0, a1], clipName, color, n, width) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
      d += 'M' + x + ' ' + y + 'L' + f1(x + Math.cos(a) * 180) + ' ' + f1(y + Math.sin(a) * 180);
    }
    return '<path clip-path="' + url(clipName) + '" d="' + d + '" fill="none" stroke="' + color + '" stroke-opacity=".35" stroke-width="' + width + '"/>';
  }
  function fish(k, { extraClass = '' } = {}) {
    const s = kinds[k];
    if (!s) return '';
    const fin = s.fin || s.edge;
    const stroke = ' stroke="' + fin + '" stroke-opacity="' + (s.edgeW > 2 ? .9 : .4) + '" stroke-width="' + s.edgeW + '" stroke-linejoin="round"';
    const finFill = ' fill="' + url(k + '-f') + '"';
    const rayW = s.rays || 1;
    const [ex, ey, er] = s.eye;
    const [jx, jy] = s.joint || [0, 0];
    const clipAll = url(k + (s.all ? '-cx' : '-cb'));
    const parts = [];
    parts.push(s.under || '');
    if (s.tail) parts.push('<g class="akf-tail" style="transform-origin:' + jx + 'px ' + jy + 'px">' +
      (s.tailBack ? '<path d="' + s.tailBack + '" fill="' + url(k + '-t') + '" opacity=".6"/>' : '') +
      '<path d="' + s.tail + '" fill="' + url(k + '-t') + '"' + stroke + '/>' + rays(s.joint, k + '-ct', fin, 11, rayW) + (s.tailOver || '') + '</g>');
    if (s.dorsal) parts.push('<g class="akf-fin"><path d="' + s.dorsal + '"' + finFill + stroke + '/>' +
      (s.dorsalRay ? rays(s.dorsalRay, k + '-cd', fin, 12, rayW) : '') + '</g>');
    if (s.anal) parts.push('<g class="akf-fin low"><path d="' + s.anal + '"' + finFill + stroke + '/>' +
      (s.analRay ? rays(s.analRay, k + '-ca', fin, 9, rayW) : '') + '</g>');
    if (s.pelvic) parts.push('<path class="akf-pelvic" d="' + s.pelvic + '" fill="' + (s.pelvicFill || url(k + '-f')) + '"' + stroke + '/>');
    const inner = [];
    inner.push('<path d="' + s.body + '" fill="' + (s.bodyFill || url(k + '-b')) + '"/>');
    if (s.over) inner.push(s.over(clipAll));
    inner.push('<path d="' + s.body + '" fill="' + url('scales') + '" opacity="' + (s.scales || .9) + '"/>');
    inner.push('<path d="' + s.body + '" fill="' + url('belly') + '"/>');
    inner.push('<path d="' + s.body + '" fill="' + url('shade') + '"/>');
    inner.push('<path d="' + s.body + '" fill="none" stroke="' + s.edge + '" stroke-opacity=".45" stroke-width="' + Math.max(1, s.edgeW * .6) + '"/>');
    if (s.gill) inner.push('<path d="' + s.gill + '" fill="none" stroke="' + s.edge + '" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>');
    else if (!s.upright) inner.push('<path d="M' + (ex + er + 8) + ' ' + (ey - er - 6) + 'Q' + (ex + er + 15) + ' ' + (ey + 4) + ' ' + (ex + er + 8) + ' ' + (ey + er + 12) +
      '" fill="none" stroke="' + s.edge + '" stroke-opacity=".3" stroke-width="1.8" stroke-linecap="round"/>');
    if (s.pec) inner.push('<path class="akf-pec" style="transform-origin:' + s.pecAt[0] + 'px ' + s.pecAt[1] + 'px" d="' + s.pec + '" fill="' + (s.pecFill || url(k + '-f')) +
      '" fill-opacity=".85"' + stroke + '/>');
    inner.push('<circle cx="' + ex + '" cy="' + ey + '" r="' + er + '" fill="#f6f1e2"/><circle cx="' + ex + '" cy="' + ey + '" r="' + f1(er * .8) + '" fill="' + s.iris + '"/>' +
      '<circle cx="' + f1(ex - er * .08) + '" cy="' + ey + '" r="' + f1(er * .5) + '" fill="#080b0e"/>' +
      '<circle cx="' + f1(ex - er * .34) + '" cy="' + f1(ey - er * .34) + '" r="' + f1(er * .22) + '" fill="#fff"/>' +
      '<circle cx="' + f1(ex + er * .25) + '" cy="' + f1(ey + er * .3) + '" r="' + f1(er * .1) + '" fill="#fff" opacity=".7"/>');
    if (s.mouth) inner.push('<path d="' + s.mouth + '" fill="none" stroke="#1a1410" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>');
    if (s.top) inner.push(s.top);
    const body = s.inflate ? '<g class="akf-inflate">' + inner.join('') + '</g>' : inner.join('');
    return '<svg class="akf akf-' + k + (s.upright ? ' upright' : '') + (extraClass ? ' ' + extraClass : '') + '" viewBox="' + s.vb + '" aria-hidden="true">' +
      '<g class="akf-s"><g class="akf-w">' + parts.join('') + body + '</g></g></svg>';
  }
  const ratio = k => { const [, , w, h] = kinds[k].vb.split(' ').map(Number); return h / w; };

  /* ---------- Ornaments ---------- */
  grad('wood', [[0, '#7a5230'], [.5, '#5c3a1f'], [1, '#3a2312']]);
  grad('wood-lid', [[0, '#8c6038'], [1, '#5a391e']]);
  grad('gold', [[0, '#fff0a0'], [.4, '#f2c440'], [1, '#a8741a']]);
  radial('gold-glow', [[0, '#fff6c0', .95], [.4, '#ffd24a', .7], [1, '#ffb000', 0]]);
  grad('stone', [[0, '#a8aaa4'], [.55, '#7c807e'], [1, '#4f5452']], { x2: 1, y2: .4 });
  grad('stone-dark', [[0, '#878a86'], [1, '#3f4442']], { x2: 1, y2: .3 });
  defs.push('<pattern id="' + id('bricks') + '" width="28" height="16" patternUnits="userSpaceOnUse"><path d="M0 .5H28M0 8.5H28M10 .5V8.5M24 8.5V16.5" stroke="#2c3130" stroke-opacity=".45" stroke-width="1.4" fill="none"/>' +
    '<path d="M1 2H9M12 10H22" stroke="#fff" stroke-opacity=".12" stroke-width="1.2"/></pattern>');
  radial('brass', [[0, '#fff3c0'], [.25, '#e8be5a'], [.7, '#a8741e'], [1, '#5c3a0c']], { cx: .5, cy: .5, r: .55, fx: .34, fy: .3 });
  grad('brass-plate', [[0, '#d9a945'], [1, '#6e4810']]);
  radial('porthole', [[0, '#3c6a78'], [.7, '#0d2a33'], [1, '#05141a']], { fx: .38, fy: .34 });
  grad('terra', [[0, '#e08b55'], [.5, '#b9592c'], [1, '#7a3216']], { x2: 1, y2: 0 });
  grad('rock', [[0, '#9b8f96'], [.6, '#6e6470'], [1, '#433b47']]);
  grad('rock-warm', [[0, '#a69680'], [.55, '#7a6a58'], [1, '#4a3e33']]);
  radial('brain', [[0, '#e6c27a'], [.7, '#b8893c'], [1, '#7c5a22']], { fx: .4, fy: .3 });
  grad('star', [[0, '#ff9a4a'], [1, '#d9431e']]);
  radial('pearl', [[0, '#ffffff'], [.6, '#f4eef6'], [1, '#c9bcd6']], { fx: .35, fy: .3 });
  grad('shell-in', [[0, '#ffd8d0'], [1, '#e89a9a']]);
  grad('clam', [[0, '#c9b6a6'], [1, '#7f6a5c']]);
  grad('anemone', [[0, '#ff9ccc'], [1, '#ffe6f2']]);
  grad('anem-foot', [[0, '#d0607e'], [1, '#8a3450']], { x2: 1, y2: 0 });
  grad('crab', [[0, '#ff6a3d'], [1, '#b8301a']]);
  grad('snail', [[0, '#e0a64a'], [.5, '#a5631e'], [1, '#5e3510']]);
  grad('urchin', [[0, '#6a2a7a'], [1, '#2a0d34']]);
  grad('conch', [[0, '#fff1df'], [.6, '#f2c9a8'], [1, '#c98a6a']]);
  grad('airstone', [[0, '#c9d3d6'], [1, '#7a8a90']]);
  grad('moss', [[0, '#5fae4a'], [1, '#2e6a2a']]);
  // The soft shadow an ornament casts on the sand under it (drawn first, behind it).
  radial('contact', [[0, '#001018', .42], [.6, '#001018', .18], [1, '#001018', 0]]);
  const sand = (h, w, top) => '<ellipse cx="' + f1(w / 2) + '" cy="' + f1(h - top * .55) + '" rx="' + f1(w * .5) + '" ry="' + f1(top * .6) + '" fill="' + url('contact') + '"/>';
  const moss = (d, op = .85) => '<path d="' + d + '" fill="' + url('moss') + '" opacity="' + op + '"/>';
  const ornaments = {
    gemi: { ground: 18, vb: [300, 180], bubble: [212, 120], svg: () =>
      '<g transform="rotate(-6 150 120)">' +
      '<path d="M18 98L282 92C280 128 254 160 196 168L104 170C52 166 22 140 18 98Z" fill="' + url('wood') + '"/>' +
      '<path d="M24 112C80 118 220 114 278 106M30 128C90 134 210 130 270 122M44 144C100 150 200 148 254 140M62 158C110 162 190 162 230 156" stroke="#2a180a" stroke-opacity=".55" stroke-width="2" fill="none"/>' +
      '<path d="M70 98V168M130 96V170M190 94V168M240 92V160" stroke="#2a180a" stroke-opacity=".25" stroke-width="1.5"/>' +
      '<path d="M18 98L282 92C280 128 254 160 196 168L104 170C52 166 22 140 18 98Z" fill="' + url('belly') + '"/>' +
      '<path d="M214 94V60H276V92Z" fill="' + url('wood-lid') + '"/><path d="M214 94V60H276V92" fill="none" stroke="#2a180a" stroke-width="2" stroke-opacity=".6"/>' +
      '<rect x="224" y="68" width="12" height="12" rx="2" fill="#0c1518"/><rect x="246" y="68" width="12" height="12" rx="2" fill="#0c1518"/>' +
      '<path d="M18 98L2 78L44 94Z" fill="#6a4426"/>' +
      '<path d="M128 94L136 20L142 28L139 36L147 31L141 94Z" fill="' + url('wood-lid') + '"/>' +
      '<path d="M108 48L170 40" stroke="#5a3a1e" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M114 50C120 62 114 74 122 86L150 82C146 70 152 58 146 44Z" fill="#d9cfae" opacity=".5"/><path d="M128 60l6 4-4 6z" fill="#1d3a44" opacity=".5"/>' +
      '<path d="M12 98L288 90" stroke="#3a2412" stroke-width="7" stroke-linecap="round"/>' +
      [70, 110, 150, 190].map((x, k) => '<circle cx="' + x + '" cy="' + (126 + (k === 1 || k === 2 ? 5 : 0)) + '" r="8" fill="' + url('porthole') + '" stroke="#b8892e" stroke-width="3"/>').join('') +
      '<path d="M202 120l10-10 8 6 10-4 2 14-8 10-14 2-10-8Z" fill="#081114"/>' +
      moss('M12 96c6-8 14-6 18-2 6-6 14-4 18 0 8-6 18-4 22 2-12 4-40 6-58 0Z') + moss('M150 92c6-6 16-6 20 0 8-6 20-4 24 2-14 4-32 4-44-2Z', .7) +
      moss('M232 60c6-6 16-6 22-2 6-4 14-2 18 2-12 4-28 4-40 0Z', .7) +
      '</g>' },
    kale: { ground: 16, vb: [220, 230], svg: () =>
      '<path d="M62 112H158V220H62Z" fill="' + url('stone-dark') + '"/>' +
      '<path d="M58 112h104v-14h-12v8h-12v-8h-14v8h-12v-8h-14v8h-12v-8h-14v8h-14v-8H58Z" fill="' + url('stone-dark') + '"/>' +
      '<path d="M18 70H72V220H18Z" fill="' + url('stone') + '"/><path d="M14 70h62v-16h-10v8h-10v-8h-12v8h-10v-8h-10v8h-10v-8h-10Z" fill="' + url('stone') + '"/>' +
      '<path d="M150 46H204V220H150Z" fill="' + url('stone') + '"/><path d="M146 46h62v-16h-10v8h-10v-8h-12v8h-10v-8h-10v8h-10v-8h-10Z" fill="' + url('stone') + '"/>' +
      '<path d="M18 54H76V220H18ZM146 30H208V220H146ZM58 98H162V220H58Z" fill="' + url('bricks') + '"/>' +
      '<path d="M18 70H72V220H18ZM150 46H204V220H150Z" fill="' + url('belly') + '" opacity=".8"/>' +
      '<path d="M92 220V178A18 18 0 0 1 128 178V220Z" fill="#081418"/><path d="M92 220V178A18 18 0 0 1 128 178" fill="none" stroke="#3b403e" stroke-width="5"/>' +
      '<path d="M40 110v-14a5 5 0 0 1 10 0v14ZM172 90v-16a5 5 0 0 1 10 0v16ZM40 160v-12a5 5 0 0 1 10 0v12ZM172 150v-14a5 5 0 0 1 10 0v14ZM104 140v-10a6 6 0 0 1 12 0v10Z" fill="#0b171b"/>' +
      '<path d="M52 196l8-12 4 8 6-14M168 120l-6 10 4 6" stroke="#2c302f" stroke-width="1.5" fill="none"/>' +
      moss('M14 58c4-6 12-6 14-2 4-4 10-4 14 0 4-6 14-6 18 0 4-2 10 0 12 4-20 4-40 4-58-2Z') + moss('M146 34c6-6 14-6 18-2 4-4 12-4 16 0 6-4 14-2 18 4-18 4-36 4-52-2Z') +
      moss('M18 200c8-10 20-12 30-4 10-8 20-4 24 6-18 6-38 6-54-2Z', .9) + moss('M150 196c8-8 22-10 30-2 8-6 18-2 24 6-18 6-38 4-54-4Z', .9) },
    sandik: { ground: 14, vb: [170, 140], bubble: [86, 58], svg: () =>
      '<ellipse cx="86" cy="64" rx="56" ry="18" fill="' + url('gold-glow') + '" class="ak-glow"/>' +
      '<path d="M30 64C40 58 60 54 86 54C112 54 132 58 142 64Z" fill="#ffcf3a"/>' +
      [[54, 58], [70, 55], [92, 54], [110, 56], [126, 60], [80, 60], [100, 60]].map(([x, y]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="7" ry="3.5" fill="' + url('gold') + '" stroke="#8a5a10" stroke-width=".8"/>').join('') +
      '<rect x="22" y="64" width="128" height="58" rx="4" fill="' + url('wood') + '"/>' +
      '<path d="M22 78H150M22 92H150M22 106H150" stroke="#2a180a" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<path d="M22 64H150V72H22ZM22 114H150V122H22Z" fill="' + url('gold') + '"/>' +
      '<path d="M34 64H44V122H34ZM128 64H138V122H128Z" fill="' + url('gold') + '"/>' +
      '<g class="ak-lid"><path d="M20 66C20 30 152 30 152 66Z" fill="' + url('wood-lid') + '"/>' +
      '<path d="M20 66C20 30 152 30 152 66" fill="none" stroke="#2a180a" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<path d="M34 30H44V66H34ZM128 30H138V66H128Z" fill="' + url('gold') + '" clip-path="' + url('lid') + '"/>' +
      '<path d="M18 62H154V70H18Z" fill="' + url('gold') + '"/>' +
      '<rect x="78" y="58" width="16" height="20" rx="3" fill="' + url('gold') + '" stroke="#7a4e0c" stroke-width="1.2"/><path d="M86 64v6" stroke="#2a1606" stroke-width="2.4" stroke-linecap="round"/></g>' +
      '<path d="M22 64H150V122H22Z" fill="' + url('belly') + '" opacity=".6"/>' +
      moss('M22 120c8-8 18-8 24-2 6-6 18-6 22 2-16 4-30 4-46 0Z', .8) +
      [[30, 132], [46, 134], [150, 130], [138, 134]].map(([x, y]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="6" ry="2.6" fill="' + url('gold') + '" stroke="#8a5a10" stroke-width=".6"/>').join('') },
    dalgic: { ground: 14, vb: [170, 160], bubble: [117, 10], svg: () =>
      '<path d="M26 154C30 124 54 110 85 110C116 110 140 124 144 154Z" fill="' + url('brass-plate') + '"/>' +
      [[36, 140], [52, 124], [72, 116], [98, 116], [118, 124], [134, 140]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="3.4" fill="#f2d68a" stroke="#6a440e" stroke-width="1"/>').join('') +
      '<rect x="108" y="10" width="16" height="18" rx="3" fill="' + url('brass-plate') + '"/><rect x="104" y="8" width="24" height="5" rx="2" fill="#c89a3a"/>' +
      '<circle cx="85" cy="70" r="52" fill="' + url('brass') + '"/>' +
      '<circle cx="80" cy="76" r="25" fill="' + url('porthole') + '" stroke="#c99a3c" stroke-width="7"/>' +
      '<path d="M68 54V98M80 51V101M92 54V98M56 76H104" stroke="#a8782a" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M66 62C70 56 78 54 84 56" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="132" cy="66" rx="8" ry="15" fill="' + url('porthole') + '" stroke="#c99a3c" stroke-width="5"/>' +
      '<ellipse cx="84" cy="24" rx="15" ry="7" fill="' + url('porthole') + '" stroke="#c99a3c" stroke-width="4"/>' +
      '<g fill="#3f9a7a" opacity=".38"><circle cx="46" cy="96" r="6"/><circle cx="120" cy="100" r="5"/><circle cx="58" cy="42" r="4"/><circle cx="110" cy="40" r="3"/></g>' },
    amfora: { ground: 14, vb: [210, 160], svg: () => {
      const jar = '<path d="M60 20C52 20 50 30 54 36C36 50 30 80 40 110C46 128 54 140 60 146C66 140 74 128 80 110C90 80 84 50 66 36C70 30 68 20 60 20Z" fill="' + url('terra') + '"/>' +
        '<path d="M54 36C40 34 36 44 42 52M66 36C80 34 84 44 78 52" stroke="#9a4520" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M38 70H82V82H38Z" fill="#2a120a" opacity=".75" clip-path="' + url('amf') + '"/>' +
        '<path d="M42 76h4v-3h4v6h4v-6h4v3h4v-3h4v6h4v-6h4v3" stroke="#e08b55" stroke-width="1.4" fill="none" clip-path="' + url('amf') + '"/>' +
        '<path d="M60 20C52 20 50 30 54 36C36 50 30 80 40 110C46 128 54 140 60 146C66 140 74 128 80 110C90 80 84 50 66 36C70 30 68 20 60 20Z" fill="' + url('shade') + '"/>' +
        '<ellipse cx="60" cy="21" rx="7" ry="2.5" fill="#3a170a"/>';
      return '<g transform="translate(0 4)">' + jar + '</g>' +
        '<g transform="translate(100 146) rotate(80) scale(.82)"><g transform="translate(-60 -146)">' + jar + '</g></g>' +
        '<path d="M100 128l12-6 6 8-10 6Z" fill="#a84e26"/><path d="M180 136l10-4 4 6-8 4Z" fill="#b9592c"/>' +
        moss('M40 140c6-6 14-6 18-2 6-4 14-2 16 4-12 4-24 4-34-2Z', .7);
    } },
    mercan: { ground: 14, vb: [250, 180], svg: () =>
      '<g class="ak-sway" style="--d:7s;transform-origin:170px 150px">' +
      '<path d="M170 150C166 110 150 80 130 56M170 150C172 108 176 74 192 44M170 150C182 118 204 96 226 84M150 100C140 90 128 88 116 90M178 96C190 84 204 80 214 66M200 108C214 104 226 108 236 112"' +
      ' stroke="#a64ad8" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M136 64C150 70 176 60 196 50M128 80C150 86 186 78 214 70M132 100C158 104 196 100 230 96M142 118C164 120 198 118 230 110" stroke="#c27ae8" stroke-width="1.4" fill="none" opacity=".7"/></g>' +
      '<path d="M10 172C14 140 40 120 70 124C84 104 120 100 140 116C160 100 200 104 214 126C236 130 248 150 246 172Z" fill="' + url('rock') + '"/>' +
      '<g fill="#c95a9a" opacity=".55"><path d="M40 140c8-6 16-4 20 2-6 4-14 4-20-2Z"/><path d="M150 128c10-6 20-4 24 4-8 4-18 4-24-4Z"/><path d="M200 150c8-4 16-2 18 4-6 4-14 2-18-4Z"/></g>' +
      '<ellipse cx="80" cy="130" rx="38" ry="25" fill="' + url('brain') + '"/>' +
      '<path d="M50 126c6-8 12 2 18-6s12 4 18-4 12 6 18 0M48 136c8-6 14 4 22-4s14 6 22-2 12 4 16 2M56 116c6-4 12 2 18-2s12 2 16-2M58 146c8-4 16 2 24-2s14 2 20-2" stroke="#7a5420" stroke-width="2" fill="none" opacity=".7"/>' +
      '<g stroke-linecap="round" fill="none"><path d="M190 128C190 112 186 100 178 88M190 128C192 112 200 104 210 96M186 108C180 102 176 100 170 100M198 104C200 94 204 88 208 82M178 88C176 80 176 74 178 68M210 96C216 92 222 90 226 88"' +
      ' stroke="#ff6f9f" stroke-width="8"/><path d="M178 68l0 0M208 82l0 0M226 88l0 0M170 100l0 0" stroke="#ffd0e0" stroke-width="9"/></g>' +
      '<g fill="#ff9a3a"><rect x="120" y="108" width="8" height="18" rx="4"/><rect x="130" y="104" width="7" height="22" rx="3.5"/><rect x="139" y="110" width="7" height="16" rx="3.5"/></g>' +
      '<g fill="#ffe0a0"><circle cx="124" cy="110" r="3"/><circle cx="133.5" cy="106" r="2.8"/><circle cx="142.5" cy="112" r="2.8"/></g>' +
      '<path d="M10 172C14 140 40 120 70 124C84 104 120 100 140 116C160 100 200 104 214 126C236 130 248 150 246 172Z" fill="' + url('belly') + '" opacity=".5"/>' },
    kemer: { ground: 12, vb: [270, 180], svg: () =>
      '<path d="M8 172C6 120 20 70 60 46C100 22 170 22 210 46C250 70 264 120 262 172L206 172C206 130 186 100 136 98C86 100 64 130 64 172Z" fill="' + url('rock-warm') + '"/>' +
      '<path d="M22 150C24 110 40 80 70 62C104 42 166 42 200 62C232 80 246 112 248 150M40 120C52 92 80 70 120 64M170 62C200 70 226 90 236 120" stroke="#3a2e24" stroke-opacity=".4" stroke-width="3" fill="none"/>' +
      '<path d="M70 50C100 32 170 30 204 50" stroke="#fff" stroke-opacity=".25" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M8 172C6 120 20 70 60 46C100 22 170 22 210 46C250 70 264 120 262 172L206 172C206 130 186 100 136 98C86 100 64 130 64 172Z" fill="' + url('belly') + '" opacity=".6"/>' +
      moss('M56 48c10-12 26-14 38-6 12-10 30-10 40-2 12-8 30-6 40 4 10-4 22 0 28 8-30 6-110 8-146-4Z') +
      '<g stroke="#4fae5a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M120 34c-2-10 0-18 4-24M126 34c2-8 6-14 12-18M114 36c-6-6-8-12-8-18"/></g>' },
    yildiz: { vb: [100, 70], svg: () => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 15 : 44;
        const x = 50 + Math.cos(a) * r, y = 40 + Math.sin(a) * r * .55;
        d += (i ? 'L' : 'M') + f1(x) + ' ' + f1(y);
      }
      return '<ellipse cx="50" cy="56" rx="40" ry="8" fill="#000" opacity=".15"/>' +
        '<path d="' + d + 'Z" fill="' + url('star') + '" stroke="#b8361a" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="' + d + 'Z" fill="' + url('star') + '" stroke="#ff9a5a" stroke-width="2" stroke-linejoin="round"/>' +
        '<g fill="#ffd2a0" opacity=".85">' + Array.from({ length: 5 }, (_, i) => {
          const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
          return [14, 24, 33].map(r => '<circle cx="' + f1(50 + Math.cos(a) * r) + '" cy="' + f1(40 + Math.sin(a) * r * .55) + '" r="' + (r > 30 ? 1.6 : 2.2) + '"/>').join('');
        }).join('') + '</g><circle cx="50" cy="40" r="4" fill="#ffb070"/>';
    } },
    istiridye: { vb: [110, 84], svg: () =>
      '<ellipse cx="55" cy="74" rx="44" ry="7" fill="#000" opacity=".15"/>' +
      '<path d="M10 64C12 86 98 86 100 64C82 72 28 72 10 64Z" fill="' + url('clam') + '"/>' +
      '<path d="M14 66C40 74 70 74 96 66" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>' +
      '<path d="M16 64C34 58 76 58 94 64C76 68 34 68 16 64Z" fill="' + url('shell-in') + '"/>' +
      '<circle cx="55" cy="60" r="9" fill="' + url('pearl') + '"/>' +
      '<g class="ak-shell"><path d="M10 64C12 30 98 30 100 64C82 58 28 58 10 64Z" fill="' + url('clam') + '"/>' +
      '<path clip-path="' + url('shell') + '" d="M55 63L14 44M55 63L28 34M55 63L44 28M55 63L66 28M55 63L82 34M55 63L96 44" stroke="#5a483c" stroke-opacity=".45" stroke-width="2" fill="none"/>' +
      '<path d="M10 64C12 30 98 30 100 64" fill="none" stroke="#e8dccf" stroke-opacity=".5" stroke-width="2"/></g>' },
    sakayik: { vb: [120, 120], svg: () => {
      const r = seeded(7);
      let tent = '';
      for (let i = 0; i < 18; i++) {
        const x = 37 + i * 2.7, lean = (x - 60) * 1.1 + (r() - .5) * 12, h = 34 + r() * 20;
        tent += '<path class="ak-tent" style="--d:' + (2.4 + r() * 1.6).toFixed(1) + 's;animation-delay:-' + (r() * 3).toFixed(1) + 's;transform-origin:' + f1(x) + 'px 84px" d="M' + f1(x) + ' 84C' +
          f1(x + lean * .2) + ' ' + f1(84 - h * .4) + ' ' + f1(x + lean * .8 - 6) + ' ' + f1(84 - h * .7) + ' ' + f1(x + lean) + ' ' + f1(84 - h) + '" stroke="' + url('anemone') + '" stroke-width="6.5" stroke-linecap="round" fill="none"/>';
      }
      return '<ellipse cx="60" cy="116" rx="30" ry="5" fill="#000" opacity=".15"/>' + tent +
        '<path d="M40 118C40 100 44 90 46 84L74 84C76 90 80 100 80 118Z" fill="' + url('anem-foot') + '"/>' +
        '<ellipse cx="60" cy="84" rx="16" ry="4" fill="#ff8fbf"/><path d="M44 96C54 100 66 100 76 96M42 106C54 110 66 110 78 106" stroke="#fff" stroke-opacity=".2" stroke-width="2" fill="none"/>';
    } },
    yengec: { vb: [100, 70], svg: () => {
      const legs = side => [0, 1, 2, 3].map(k => {
        const sx = side < 0 ? 36 - k * 2 : 64 + k * 2, y = 44 + k * 2;
        const kx = sx + side * (16 + k * 3), ky = y - 6, fx = sx + side * (24 + k * 4), fy = 62;
        return '<path class="ak-leg" style="animation-delay:-' + (k % 2 ? .2 : 0) + 's;transform-origin:' + sx + 'px ' + y + 'px" d="M' + sx + ' ' + y + 'L' + kx + ' ' + ky + 'L' + fx + ' ' + fy + '"/>';
      }).join('');
      return '<ellipse cx="50" cy="64" rx="34" ry="5" fill="#000" opacity=".18"/>' +
        '<g stroke="#b83016" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none">' + legs(-1) + legs(1) + '</g>' +
        '<g class="ak-claw" style="transform-origin:34px 38px"><path d="M34 38C24 30 18 22 18 14" stroke="#c83a1c" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '<path d="M18 16C10 12 8 2 16 0C20 2 22 6 22 10C26 8 28 12 24 16C22 18 20 18 18 16Z" fill="' + url('crab') + '"/></g>' +
        '<g class="ak-claw r" style="transform-origin:66px 38px"><path d="M66 38C76 30 82 22 82 14" stroke="#c83a1c" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '<path d="M82 16C90 12 92 2 84 0C80 2 78 6 78 10C74 8 72 12 76 16C78 18 80 18 82 16Z" fill="' + url('crab') + '"/></g>' +
        '<ellipse cx="50" cy="40" rx="26" ry="15" fill="' + url('crab') + '"/>' +
        '<g fill="#ffb08a" opacity=".6"><circle cx="40" cy="34" r="2"/><circle cx="52" cy="31" r="2.2"/><circle cx="62" cy="35" r="1.8"/><circle cx="46" cy="42" r="1.6"/></g>' +
        '<path d="M44 28V20M56 28V20" stroke="#b83016" stroke-width="2.4"/><circle cx="44" cy="19" r="3.2" fill="#111"/><circle cx="56" cy="19" r="3.2" fill="#111"/>' +
        '<circle cx="43" cy="18" r="1" fill="#fff"/><circle cx="55" cy="18" r="1" fill="#fff"/>';
    } },
    salyangoz: { vb: [100, 70], svg: () =>
      '<ellipse cx="50" cy="64" rx="40" ry="5" fill="#000" opacity=".15"/>' +
      '<path d="M4 62C6 52 16 46 28 46L80 50C90 52 96 58 94 64Z" fill="#c9b89e"/>' +
      '<path d="M16 48C12 40 10 32 8 26M24 46C24 38 26 32 30 26" stroke="#b5a184" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<circle cx="8" cy="25" r="2.6" fill="#2a2418"/><circle cx="30" cy="25" r="2.6" fill="#2a2418"/>' +
      '<circle cx="60" cy="34" r="25" fill="' + url('snail') + '"/>' +
      '<path d="M60 34m0 0a4 4 0 0 1 8 0a8 8 0 0 1 -14 6a12 12 0 0 1 4 -20a16 16 0 0 1 22 14a20 20 0 0 1 -18 22" stroke="#4a2808" stroke-width="2.4" fill="none" opacity=".8"/>' +
      '<circle cx="60" cy="34" r="25" fill="' + url('shade') + '"/>' },
    kestane: { vb: [100, 80], svg: () => {
      let spikes = '';
      for (let i = 0; i <= 26; i++) {
        const a = Math.PI + i / 26 * Math.PI, l = 26 + (i % 3) * 7;
        spikes += 'M' + f1(50 + Math.cos(a) * 18) + ' ' + f1(58 + Math.sin(a) * 14) + 'L' + f1(50 + Math.cos(a) * (18 + l)) + ' ' + f1(58 + Math.sin(a) * (14 + l));
      }
      return '<ellipse cx="50" cy="72" rx="36" ry="5" fill="#000" opacity=".18"/>' +
        '<path d="' + spikes + '" stroke="#3a1246" stroke-width="2.2" stroke-linecap="round"/>' +
        '<ellipse cx="50" cy="60" rx="24" ry="16" fill="' + url('urchin') + '"/>' +
        '<g fill="#b77ac8" opacity=".5"><circle cx="42" cy="52" r="1.6"/><circle cx="52" cy="49" r="1.6"/><circle cx="60" cy="54" r="1.6"/><circle cx="46" cy="60" r="1.4"/></g>';
    } },
    sarmal: { vb: [110, 80], svg: () =>
      '<ellipse cx="56" cy="72" rx="42" ry="6" fill="#000" opacity=".15"/>' +
      '<path d="M8 50C18 30 40 20 64 22L84 14L80 26C92 30 100 40 102 50C96 62 80 70 60 70C36 70 14 64 8 50Z" fill="' + url('conch') + '"/>' +
      '<path d="M84 14L80 26M64 22l-4 -10 10 8M46 24l-6-8 10 6" stroke="#c98a6a" stroke-width="3" stroke-linejoin="round" fill="#f2c9a8"/>' +
      '<path d="M20 50C34 44 60 42 92 46M26 58C44 54 70 54 96 54" stroke="#b97a5a" stroke-opacity=".5" stroke-width="2" fill="none"/>' +
      '<path d="M8 50C16 58 28 62 40 60C30 54 22 50 8 50Z" fill="#ff9e9e"/>' +
      '<path d="M8 50C18 30 40 20 64 22L84 14L80 26C92 30 100 40 102 50C96 62 80 70 60 70C36 70 14 64 8 50Z" fill="' + url('shade') + '"/>' },
    kabarcik: { vb: [70, 40], bubble: [35, 12], strong: true, svg: () =>
      '<ellipse cx="35" cy="36" rx="26" ry="4" fill="#000" opacity=".15"/>' +
      '<path d="M8 32C8 22 20 14 35 14C50 14 62 22 62 32Z" fill="' + url('airstone') + '"/>' +
      '<g fill="#4a5a60" opacity=".45"><circle cx="20" cy="26" r="1.4"/><circle cx="28" cy="22" r="1.2"/><circle cx="38" cy="20" r="1.4"/><circle cx="48" cy="26" r="1.2"/><circle cx="34" cy="28" r="1"/><circle cx="44" cy="30" r="1"/></g>' +
      '<path d="M60 30C66 30 70 28 70 24" stroke="#9fb3b8" stroke-width="2.4" fill="none" opacity=".7"/>' }
  };
  clip('lid', 'M20 66C20 30 152 30 152 66Z');
  clip('shell', 'M10 64C12 30 98 30 100 64C82 58 28 58 10 64Z');
  clip('amf', 'M60 20C52 20 50 30 54 36C36 50 30 80 40 110C46 128 54 140 60 146C66 140 74 128 80 110C90 80 84 50 66 36C70 30 68 20 60 20Z');
  function ornament(k) {
    const o = ornaments[k];
    if (!o) return '';
    return '<svg class="aks aks-' + k + '" viewBox="0 0 ' + o.vb[0] + ' ' + o.vb[1] + '" aria-hidden="true">' +
      (o.ground ? sand(o.vb[1], o.vb[0], o.ground) : '') + o.svg() + '</svg>';
  }
  const ornamentRatio = k => ornaments[k].vb[1] / ornaments[k].vb[0];
  const bubbleAt = k => ornaments[k].bubble ? { x: ornaments[k].bubble[0] / ornaments[k].vb[0], y: ornaments[k].bubble[1] / ornaments[k].vb[1], strong: !!ornaments[k].strong } : null;

  /* ---------- Themes ---------- */
  // Water from the surface down, the light, the sand and its pebbles, the plants and the far rocks.
  const themes = {
    mercan: { water: ['#8fe6f2', '#2fb0d6', '#137fb4', '#0a4f80'], light: '#fff7d8', sand: ['#f6e6bf', '#e5cc94', '#c9a96a'],
      pebbles: ['#f7ecd2', '#e9d4a8', '#d6b98a', '#fff6e4', '#cdb28c', '#f0c9b0'], far: '#1b7fb0',
      plants: [['val', '#5fbf8a', '#2e8a5e'], ['koral', '#ff8fb8', '#d8507e'], ['kilic', '#7ccf72', '#3b8f45'], ['koral', '#ffb36a', '#e2763a'], ['val', '#4fae8a', '#25775a']] },
    vadi: { water: ['#c9ecc8', '#6cc0a0', '#2e8c78', '#13544a'], light: '#f6ffd8', sand: ['#8a7458', '#6c5640', '#4a3a2a'],
      pebbles: ['#9a8468', '#7a6448', '#5c4a36', '#b8a07c', '#6a5a4a', '#a89070'], far: '#2a7a64',
      plants: [['val', '#6fcf5a', '#2f8a3a'], ['kabomba', '#8ee070', '#3e9a3e'], ['kilic', '#5fbf4f', '#2a7a2e'], ['kabomba', '#e8604a', '#a8301e'], ['val', '#88d860', '#3f9a36']] },
    gece: { water: ['#5a8fd6', '#2c5fb0', '#173c80', '#0a1d48'], light: '#dce8ff', sand: ['#c8cfd8', '#9aa4b2', '#6a7484'],
      pebbles: ['#d8dee6', '#aab4c2', '#808a9a', '#eef2f6', '#606a7a', '#b8c4d4'], far: '#1a3f7a',
      plants: [['val', '#3fa07a', '#1f6a52'], ['koral', '#b88cff', '#7a4ad8'], ['kilic', '#4fae7a', '#2a6a4e'], ['koral', '#6fe0ff', '#2a9ac8'], ['val', '#2f9070', '#1a5a46']] },
    gunbatimi: { water: ['#ffd8a0', '#f2a86a', '#3c9cb4', '#0e5670'], light: '#ffe2b0', sand: ['#f8dcae', '#e8b880', '#c88e5a'],
      pebbles: ['#fbe6c4', '#eec08a', '#d89a62', '#fff0da', '#c8865a', '#f4cfa0'], far: '#2a7f96',
      plants: [['val', '#7fcf6a', '#3a8a3e'], ['koral', '#ff7a6a', '#d0403a'], ['kilic', '#8fd46a', '#4a9a3a'], ['koral', '#ffd06a', '#d8902a'], ['val', '#6abf62', '#2f7f3a']] }
  };

  /* ---------- Plants ---------- */
  // One plant is one element; its whole body sways from the roots (a CSS transform, cheap to animate).
  // viewBox 0 0 100 200, roots at the bottom middle.
  function plant([type, light, deep], seed) {
    const r = seeded(seed);
    const g = 'akp' + seed;
    let body = '<defs><linearGradient id="' + g + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + deep + '"/><stop offset="1" stop-color="' + light + '"/></linearGradient></defs>';
    if (type === 'val') {
      for (let i = 0; i < 9; i++) {
        const x0 = 38 + r() * 24, lean = (r() - .5) * 60, h = 110 + r() * 88, w = 3.5 + r() * 2.5;
        const x1 = x0 + lean, y1 = 200 - h, cx = x0 + lean * .2 + (r() - .5) * 30;
        body += '<path d="M' + f1(x0 - w) + ' 200C' + f1(cx - w) + ' ' + f1(200 - h * .5) + ' ' + f1(x1 - w * .5) + ' ' + f1(y1 + 30) + ' ' + f1(x1) + ' ' + f1(y1) +
          'C' + f1(x1 + w * .5) + ' ' + f1(y1 + 30) + ' ' + f1(cx + w) + ' ' + f1(200 - h * .5) + ' ' + f1(x0 + w) + ' 200Z" fill="url(#' + g + ')" opacity="' + (.8 + r() * .2).toFixed(2) + '"/>';
      }
    } else if (type === 'kilic') {
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i / 7 - .5) * 2.1 + (r() - .5) * .2, len = 70 + r() * 50, w = 12 + r() * 8;
        const sx = 50, sy = 196, tx = sx + Math.cos(a) * len, ty = sy + Math.sin(a) * len * 1.25;
        const mx = sx + Math.cos(a) * len * .35, my = sy + Math.sin(a) * len * .45;
        const nx = -Math.sin(a), ny = Math.cos(a);
        const p1x = (mx + tx) / 2 + nx * w, p1y = (my + ty) / 2 + ny * w, p2x = (mx + tx) / 2 - nx * w, p2y = (my + ty) / 2 - ny * w;
        body += '<path d="M' + sx + ' ' + sy + 'L' + f1(mx) + ' ' + f1(my) + 'Q' + f1(p1x) + ' ' + f1(p1y) + ' ' + f1(tx) + ' ' + f1(ty) + 'Q' + f1(p2x) + ' ' + f1(p2y) + ' ' + f1(mx) + ' ' + f1(my) + 'Z" fill="url(#' + g + ')" stroke="' + deep + '" stroke-width="1.5"/>' +
          '<path d="M' + f1(mx) + ' ' + f1(my) + 'L' + f1(tx) + ' ' + f1(ty) + '" stroke="' + light + '" stroke-opacity=".6" stroke-width="1.2"/>';
      }
    } else if (type === 'kabomba') {
      for (let s = 0; s < 4; s++) {
        const x0 = 30 + s * 13 + r() * 8, h = 110 + r() * 80, lean = (r() - .5) * 26;
        body += '<path d="M' + f1(x0) + ' 200Q' + f1(x0 + lean * .3) + ' ' + f1(200 - h * .5) + ' ' + f1(x0 + lean) + ' ' + f1(200 - h) + '" stroke="' + deep + '" stroke-width="2" fill="none"/>';
        // a whorl of fine, curving leaves at every node, smaller towards the tip
        for (let y = 192; y > 200 - h; y -= 9) {
          const t = (200 - y) / h, x = x0 + lean * t * t + lean * .3 * t * (1 - t) * 2, w = 7 + (1 - t) * 6;
          let d = '';
          for (const side of [-1, 1]) for (const a of [-.75, -.3, .15]) {
            const ex = x + side * Math.cos(a) * w, ey = y + Math.sin(a) * w;
            d += 'M' + f1(x) + ' ' + f1(y) + 'Q' + f1(x + side * w * .55) + ' ' + f1(y + Math.sin(a) * w * .2 - 3) + ' ' + f1(ex) + ' ' + f1(ey);
          }
          body += '<path d="' + d + '" stroke="url(#' + g + ')" stroke-width="1.7" stroke-linecap="round" fill="none" opacity=".92"/>';
        }
      }
    } else if (type === 'koral') {
      // A soft coral: a fleshy stalk that branches into rounded lobes.
      const lobe = (x, y, rr) => '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(rr) + '" ry="' + f1(rr * .9) + '"/>';
      let branches = '', lobes = '';
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i / 5 - .5) * 1.6 + (r() - .5) * .3, len = 50 + r() * 50;
        const tx = 50 + Math.cos(a) * len, ty = 196 + Math.sin(a) * len * 1.3;
        branches += 'M50 196Q' + f1(50 + Math.cos(a) * len * .3) + ' ' + f1(196 + Math.sin(a) * len * .7) + ' ' + f1(tx) + ' ' + f1(ty);
        lobes += lobe(tx, ty, 9 + r() * 5);
      }
      body += '<path d="' + branches + '" stroke="url(#' + g + ')" stroke-width="10" stroke-linecap="round" fill="none"/>' +
        '<g fill="' + light + '">' + lobes + '</g><g fill="#fff" opacity=".35">' + lobes.replace(/rx="([\d.]+)"/g, (m, v) => 'rx="' + f1(v * .35) + '"').replace(/ry="([\d.]+)"/g, (m, v) => 'ry="' + f1(v * .35) + '"') + '</g>';
    }
    return '<svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + body + '</svg>';
  }

  // The far wall of the tank: rocks and fronds in the colour of the water, softened by the depth.
  function backdrop(theme, seed) {
    const r = seeded(seed * 31 + 5);
    let d = 'M0 400V' + (250 + r() * 40);
    for (let x = 0; x <= 1000; x += 90) d += 'Q' + (x + 45) + ' ' + f1(180 + r() * 90) + ' ' + (x + 90) + ' ' + f1(230 + r() * 60);
    d += 'V400Z';
    let fronds = '';
    for (let i = 0; i < 14; i++) {
      const x = r() * 1000, h = 90 + r() * 150, lean = (r() - .5) * 80;
      fronds += '<path d="M' + f1(x) + ' 400Q' + f1(x + lean * .4) + ' ' + f1(400 - h * .6) + ' ' + f1(x + lean) + ' ' + f1(400 - h) + '" stroke-width="' + f1(6 + r() * 8) + '"/>';
    }
    return '<svg viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="' + theme.far + '" stroke-linecap="round" opacity=".55">' + fronds + '</g>' +
      '<path d="' + d + '" fill="' + theme.far + '" opacity=".7"/></svg>';
  }

  /* ---------- Textures drawn once into canvases ---------- */
  // Caustics: the bright net that sunlight through rippling water throws on the floor (a tileable Voronoi net).
  let causticUrl = '';
  function caustics() {
    if (causticUrl) return causticUrl;
    const size = 256, canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const r = seeded(11), pts = [];
    for (let i = 0; i < 22; i++) pts.push([r() * size, r() * size]);
    const all = [];
    for (const [x, y] of pts) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) all.push([x + ox * size, y + oy * size]);
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let d1 = 1e9, d2 = 1e9;
      for (const [px, py] of all) {
        const d = (px - x) * (px - x) + (py - y) * (py - y);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1);
      const v = Math.max(0, 1 - edge / 7);
      const k = (y * size + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(Math.pow(v, 2.2) * 255);
    }
    ctx.putImageData(img, 0, 0);
    try { causticUrl = canvas.toDataURL(); } catch { causticUrl = ''; }
    return causticUrl;
  }
  // The floor of the tank: sand and pebbles, smaller towards the back, under a wavy top edge.
  // Returns the canvas and the height of its top edge at a point (0-1 across), in px from the canvas top.
  function floor(theme, seed, width, height) {
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    const r = seeded(seed * 7 + 3);
    const waves = [0, 1, 2].map(() => [r() * 6.28, 1 + r() * 2.5, .04 + r() * .05]);
    const top = t => height * (.2 + waves.reduce((s, [p, f, a]) => s + Math.sin(t * f * 3.14 + p) * a, 0) + .14 * Math.pow(Math.abs(t - .5) * 2, 2) * -1);
    if (!ctx) return { canvas, top };
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) ctx.lineTo(x, top(x / width));
    ctx.lineTo(width, height);
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, theme.sand[0]);
    fill.addColorStop(.5, theme.sand[1]);
    fill.addColorStop(1, theme.sand[2]);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // grains of sand, then pebbles that grow towards the glass
    for (let i = 0; i < width * height / 7; i++) {
      ctx.fillStyle = r() < .5 ? '#ffffff' : '#000000';
      ctx.globalAlpha = .05 + r() * .07;
      ctx.fillRect(r() * width, r() * height, 1.2, 1.2);
    }
    const count = Math.round(width * height / 55);
    for (let i = 0; i < count; i++) {
      const t = r();
      const x = r() * width, y0 = top(x / width), y = y0 + Math.pow(r(), .8) * (height - y0);
      const depth = (y - y0) / Math.max(1, height - y0);
      const size = (1.2 + depth * 5.5) * (.6 + r() * .8);
      const color = theme.pebbles[Math.floor(t * theme.pebbles.length)];
      ctx.globalAlpha = .9;
      ctx.fillStyle = '#000';
      ctx.globalAlpha = .22;
      ctx.beginPath(); ctx.ellipse(x + size * .25, y + size * .35, size, size * .7, 0, 0, 6.29); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x, y, size, size * .72, (r() - .5) * .8, 0, 6.29); ctx.fill();
      ctx.globalAlpha = .45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(x - size * .3, y - size * .28, size * .38, size * .22, 0, 0, 6.29); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // the floor darkens towards the back edge and at the very front (seen through the glass)
    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, 'rgba(0,20,40,.35)');
    shade.addColorStop(.35, 'rgba(0,20,40,0)');
    shade.addColorStop(.88, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,10,20,.35)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    // a soft lit rim along the top edge of the sand
    ctx.beginPath();
    for (let x = 0; x <= width; x += 8) ctx[x ? 'lineTo' : 'moveTo'](x, top(x / width) + 1);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    return { canvas, top };
  }

  /* ---------- Defs in the page ---------- */
  const holder = document.createElementNS(NS, 'svg');
  holder.setAttribute('width', '0');
  holder.setAttribute('height', '0');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = '<defs>' + defs.join('') + '</defs>';
  document.body.append(holder);

  return { fish, ratio, kinds: Object.keys(kinds), ornament, ornamentRatio, bubbleAt, themes, plant, backdrop, caustics, floor, seeded };
})();
