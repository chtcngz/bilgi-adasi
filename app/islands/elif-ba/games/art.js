// Artwork shared by Elif Ba's games: the turtle, the hearts, the speaker and the result stars.
const elifArt = (() => {
  const heart = '<svg viewBox="0 0 32 30" aria-hidden="true">' +
    '<path class="ghost" d="M16 7C14.4 3.2 11.6 1.5 8.6 1.5 4.4 1.5 1.5 4.6 1.5 8.8 1.5 15.6 8.6 21.8 16 28.2 23.4 21.8 30.5 15.6 30.5 8.8 30.5 4.6 27.6 1.5 23.4 1.5 20.4 1.5 17.6 3.2 16 7Z"/>' +
    '<path class="half l" d="M16 7C14.4 3.2 11.6 1.5 8.6 1.5 4.4 1.5 1.5 4.6 1.5 8.8 1.5 15.6 8.6 21.8 16 28.2L14 21 17.4 15 14.2 10Z"/>' +
    '<path class="half r" d="M16 7C17.6 3.2 20.4 1.5 23.4 1.5 27.6 1.5 30.5 4.6 30.5 8.8 30.5 15.6 23.4 21.8 16 28.2L14 21 17.4 15 14.2 10Z"/>' +
    '<ellipse class="shine" cx="8.6" cy="8" rx="3.3" ry="2" transform="rotate(-35 8.6 8)"/></svg>';
  const speaker = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 19h8l11-9v28l-11-9H7z" fill="currentColor" ' +
    'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><g fill="none" stroke="currentColor" stroke-width="3.6" ' +
    'stroke-linecap="round"><path class="arc" d="M32 18.5c2.6 3 2.6 8 0 11"/><path class="arc" d="M36.5 13.5c5.2 5.8 5.2 15.2 0 21"/>' +
    '<path class="arc" d="M41 8.5c7.8 8.5 7.8 22.5 0 31"/></g></svg>';
  const star = 'M12 2.6l2.8 5.9 6.5.8-4.8 4.5 1.2 6.4L12 17.1l-5.7 3.1 1.2-6.4-4.8-4.5 6.5-.8z';
  // The island's turtle, in the yellow scarf it wears on the cove's picture. `id` keeps its
  // gradients apart from another game's turtle: a gradient inside a closed dialog does not paint.
  function turtle(id) {
    const hex = (cx, cy, r) => 'M' + Array.from({ length: 6 }, (_, k) => {
      const a = Math.PI / 3 * k - Math.PI / 2;
      return (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    }).join('L') + 'Z';
    let scutes = '';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) scutes += hex(48 + col * 27 + (row % 2) * 13.5, 50 + row * 23.4, 13.4);
    }
    const dome = 'M62 128C62 66 96 46 122 46 150 46 176 74 176 128Z';
    return '<svg viewBox="0 0 180 150" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + '-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a9d5a"/><stop offset="1" stop-color="#22764a"/></linearGradient>' +
      '<radialGradient id="' + id + '-scute" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#86d895"/><stop offset="1" stop-color="#4aac66"/></radialGradient>' +
      '<radialGradient id="' + id + '-skin" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#d9f7c4"/><stop offset=".65" stop-color="#a9e090"/><stop offset="1" stop-color="#8dcf77"/></radialGradient>' +
      '<clipPath id="' + id + '-dome"><path d="' + dome + '"/></clipPath></defs>' +
      '<path d="' + dome + '" fill="url(#' + id + '-shell)"/>' +
      '<path d="' + scutes + '" fill="url(#' + id + '-scute)" clip-path="url(#' + id + '-dome)"/>' +
      '<ellipse cx="114" cy="61" rx="24" ry="8" fill="#fff" opacity=".25" transform="rotate(-16 114 61)"/>' +
      '<path d="M62 128C62 66 96 46 122 46 150 46 176 74 176 128" fill="none" stroke="#1b6a3e" stroke-width="3"/>' +
      '<ellipse cx="74" cy="117" rx="27" ry="18" fill="url(#' + id + '-skin)"/>' +
      '<g class="flipper"><path d="M42 104C26 102 11 90 6 74 5 67 11 64 16 68 24 79 35 88 50 94Z" fill="url(#' + id + '-skin)" stroke="#6db558" stroke-width="2"/>' +
      '<ellipse cx="20" cy="80" rx="3" ry="2" fill="#86c96e"/><ellipse cx="31" cy="90" rx="2.5" ry="1.8" fill="#86c96e"/></g>' +
      '<path d="M40 100C54 116 88 118 102 102L104 112C90 128 52 126 38 110Z" fill="#f7c948" stroke="#e0a630" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M62 114 82 115 72 133Z" fill="#f2b636" stroke="#e0a630" stroke-width="2" stroke-linejoin="round"/>' +
      '<ellipse cx="56" cy="78" rx="34" ry="29" fill="url(#' + id + '-skin)" stroke="#6db558" stroke-width="2"/>' +
      '<g fill="#86c96e" opacity=".8"><ellipse cx="52" cy="56" rx="6" ry="4"/><ellipse cx="66" cy="54" rx="4" ry="3"/>' +
      '<ellipse cx="40" cy="60" rx="3.5" ry="2.5"/><ellipse cx="75" cy="62" rx="3" ry="2.2"/></g>' +
      '<g class="eyes"><ellipse cx="44" cy="76" rx="9.5" ry="11" fill="#fff"/><ellipse cx="68" cy="75" rx="9" ry="10.5" fill="#fff"/>' +
      '<ellipse cx="43" cy="77.5" rx="7.4" ry="8.6" fill="#5b3418"/><ellipse cx="67" cy="76.5" rx="7" ry="8.2" fill="#5b3418"/>' +
      '<ellipse cx="43" cy="78" rx="4.2" ry="5" fill="#1d120a"/><ellipse cx="67" cy="77" rx="4" ry="4.8" fill="#1d120a"/>' +
      '<circle cx="40" cy="74" r="2.8" fill="#fff"/><circle cx="64" cy="73" r="2.6" fill="#fff"/>' +
      '<circle cx="45.5" cy="81.5" r="1.3" fill="#fff"/><circle cx="69.5" cy="80.5" r="1.2" fill="#fff"/></g>' +
      '<g class="glad" fill="none" stroke="#3a2414" stroke-width="3.5" stroke-linecap="round"><path d="M37 79Q44 70 51 79"/><path d="M61 78Q68 69 75 78"/></g>' +
      '<g fill="#ff9a8b" opacity=".6"><ellipse cx="33" cy="90" rx="6.5" ry="4"/><ellipse cx="80" cy="89" rx="6" ry="3.8"/></g>' +
      '<g class="mouth"><path d="M48 89Q56 101 64 89 56 92 48 89Z" fill="#7c2d2a"/><ellipse cx="56" cy="95.4" rx="4" ry="2.1" fill="#f07b7b"/></g>' +
      '<path class="frown" d="M49 97Q56 91 63 97" fill="none" stroke="#7c2d2a" stroke-width="3" stroke-linecap="round"/></svg>';
  }
  return { turtle, heart, speaker, star };
})();
