// Drawings shared by the maps (Elif Ba Adası's map and the grades' Keşif Haritası): smooth paths, palms, lighthouses,
// boats, gulls, clouds, waves and the sea, as SVG strings in a 400-wide frame. Their motion is in core/css/harita.css.
const haritaSanat = (() => {
  const r1 = n => Math.round(n * 10) / 10;
  /* ---------- Paths ---------- */
  // A smooth path through points (Catmull-Rom), as cubic segments [p0, c1, c2, p3].
  function curve(points) {
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      segments.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
    }
    return segments;
  }
  const pathOf = segments => 'M' + segments[0][0].map(r1).join(' ') + segments.map(([, a, b, c]) => 'C' + [a, b, c].map(p => p.map(r1).join(' ')).join(' ')).join('');
  function along([p0, c1, c2, p3], n) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n, u = 1 - t;
      return [0, 1].map(a => u * u * u * p0[a] + 3 * u * u * t * c1[a] + 3 * u * t * t * c2[a] + t * t * t * p3[a]);
    });
  }

  /* ---------- Artwork ---------- */
  const palm = (x, y, s = 1, flip = false) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')">' +
    '<path d="M0 2C2-8 4-16 2-26" stroke="#9a6a3c" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
    '<g class="map-fronds" fill="#41a35c"><path d="M2-26C-8-32-18-30-22-24c8-3 16-3 24-2z"/><path d="M2-26c6-8 18-8 22-2-8-2-14-1-22 2z"/>' +
    '<path d="M2-26c-5 3-10 9-11 16 5-6 8-10 11-16z"/><path d="M2-26c8 3 12 8 14 14-5-5-9-9-14-14z"/></g></g>';
  const lighthouse = (x, y, s = 1) => '<g class="map-lighthouse" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle cx="0" cy="-40" r="16" fill="#fff6b8" opacity=".55"/>' +
    '<path d="M-8 2-5.5-34H5.5L8 2Z" fill="#fff" stroke="#b94040" stroke-width="2"/><path d="M-7.2-8H7.2L6.6-17H-6.6ZM-6-25H6L5.6-31H-5.6Z" fill="#e05a5a"/>' +
    '<rect x="-6.5" y="-43" width="13" height="9" rx="2" fill="#ffe38a" stroke="#c98a1f" stroke-width="1.6"/><path d="M-9-43 0-50 9-43Z" fill="#b94040"/></g>';
  const rainbow = (x, y, s = 1) => '<g class="map-rainbow" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="none" stroke-width="4.5" stroke-linecap="round">' +
    ['#e05a5a', '#f2a93b', '#ffd863', '#41a35c', '#3c8fd8', '#8a5ad8'].map((color, n) => '<path d="M' + (-40 + n * 4.5) + ' -8a' + (40 - n * 4.5) + ' ' + (34 - n * 4.5) +
    ' 0 0 1 ' + (80 - n * 9) + ' 0" stroke="' + color + '"/>').join('') + '</g>';
  const boat = (x, y, s = 1, flip = false) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')"><g class="map-boat">' +
    '<path d="M-12 0H12L7 7H-7Z" fill="#b5652b" stroke="#7a3f17" stroke-width="1.6"/>' +
    '<path d="M0-1V-24" stroke="#7a3f17" stroke-width="1.8"/><path d="M1.5-23 13-4H1.5Z" fill="#fffdf6" stroke="#d8d2c4" stroke-width="1"/>' +
    '<path d="M-1.5-18-9-4H-1.5Z" fill="#ffd863"/></g></g>';
  const moon = (x, y, s = 1) => '<g class="map-moon" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle r="17" fill="#fff6b8" opacity=".45"/>' +
    '<path d="M4-12A13 13 0 1 0 4 12A10 10 0 1 1 4-12Z" fill="#ffe38a" stroke="#c98a1f" stroke-width="1.6"/></g>';
  const sun = (x, y, s = 1) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="map-sun"><circle r="20" fill="#fff3b0" opacity=".5"/>' +
    '<g class="map-sun-rays" stroke="#ffc93c" stroke-width="3" stroke-linecap="round">' + Array.from({ length: 8 }, (_, n) => {
      const a = n * Math.PI / 4, c = Math.cos(a), d = Math.sin(a);
      return '<path d="M' + r1(c * 15) + ' ' + r1(d * 15) + 'L' + r1(c * 21) + ' ' + r1(d * 21) + '"/>';
    }).join('') + '</g><circle r="11" fill="#ffd863" stroke="#f2a93b" stroke-width="2"/></g></g>';
  // A dolphin leaping out of the water, facing right (flip: left).
  const dolphin = (x, y, s = 1, flip = false) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')"><g class="map-dolphin">' +
    '<path d="M-2-7-5-13 3-9Z" fill="#4f84cf"/><path d="M-12 7C-8-6 4-10 12-4L18-2 12-1C4-4-5 0-10 9L-14 12-13 7-18 4Z" fill="#5b93dd" stroke="#2d5c9e" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path d="M0-3C4-4 8-3 11-1" fill="none" stroke="#dff0ff" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="-4" r="1.1" fill="#1d3557"/></g>' +
    '<path class="map-splash" d="M-16 14q4-4 8 0M8 14q4-4 8 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>';
  const gulls = (x, y, s = 1) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="map-gulls" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M-10 0q5-6 10 0q5-6 10 0"/><path d="M8-14q4-5 8 0q4-5 8 0"/></g></g>';
  const cloud = (x, y, s = 1) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse rx="34" ry="12" cy="4"/><circle cx="-14" cy="-4" r="13"/>' +
    '<circle cx="8" cy="-9" r="16"/><circle cx="24" cy="0" r="10"/></g>';
  const twinkle = ([x, y], n) => '<path class="map-twinkle" style="--n:' + n + '" d="M' + x + ' ' + (y - 6) + 'l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6Z"/>';
  const mosque = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><rect x="-13" y="-14" width="26" height="15" rx="2" fill="#fff6e6" stroke="#c98a4a" stroke-width="1.6"/>' +
    '<path d="M-11-14a11 11 0 0 1 22 0Z" fill="#7cc6e8" stroke="#3a7fa8" stroke-width="1.6"/><rect x="15" y="-38" width="6" height="39" rx="1.5" fill="#fff6e6" stroke="#c98a4a" stroke-width="1.6"/>' +
    '<path d="M14-38l4-9 4 9Z" fill="#7cc6e8" stroke="#3a7fa8" stroke-width="1.2"/><path d="M-3-6a3 3 0 0 1 6 0v6h-6Z" fill="#c98a4a"/></g>';
  const wave = ([x, y]) => '<path d="M' + x + ' ' + y + 'q7-6 14 0t14 0"/>';
  const waves = list => '<g class="map-waves" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55">' + list.map(wave).join('') + '</g>';
  const sea = (id, colors, W = 400, H = 680) => '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + colors.map((c, n) =>
    '<stop offset="' + n / (colors.length - 1) + '" stop-color="' + c + '"/>').join('') + '</linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#' + id + ')"/>';
  const compass = (x, y) => '<g class="map-compass" transform="translate(' + x + ' ' + y + ')"><circle r="25" fill="#fffdf6" opacity=".9" stroke="#c98a4a" stroke-width="2.4"/>' +
    '<circle r="18" fill="none" stroke="#e8d7b0" stroke-width="1.5"/><g class="map-needle"><path d="M0-21 5 0H-5Z" fill="#e05a5a"/><path d="M0 21 5 0H-5Z" fill="#9ab7c0"/></g>' +
    '<path d="M-21 0 0-4V4ZM21 0 0-4V4Z" fill="#d8c8a2"/><circle r="3" fill="#fff" stroke="#c98a4a" stroke-width="1.5"/></g>';
  const whale = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><g class="map-whale"><g class="map-spout" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">' +
    '<path d="M-12-16v-12M-12-26c-3-6-8-8-12-6M-12-26c3-6 8-8 12-6"/></g>' +
    '<path d="M-34 2C-34-16 6-20 22-6c6 5 12 0 16-10 4 8 2 16-6 20C14 14-34 16-34 2Z" fill="#3a7fa8"/>' +
    '<path d="M-30 6C-20 12 6 12 18 6C6 14-24 14-30 6Z" fill="#c7e6f2"/><circle cx="-22" cy="-4" r="2.4" fill="#173f40"/></g></g>';
  return { r1, curve, pathOf, along, palm, lighthouse, rainbow, boat, moon, sun, dolphin, gulls, cloud, twinkle, mosque, wave, waves, sea, compass, whale };
})();
