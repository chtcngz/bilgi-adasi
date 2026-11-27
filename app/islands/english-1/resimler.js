// English, Ada 1 (İlk Adımlar): drawn pictures for the alphabet and the ordinal numbers, added to kelimeResimleri
// (core/js/kelime-resimleri.js) like the other drawings, so a question writes them as [[harf-b]] or [[sira-4]].
//   harf-a … harf-z   a letter tile: the capital and the small letter ("Bb"), every tile its own colour
//   sira-4 … sira-10  a ribbon badge with "4th" … "10th" (first, second and third are the 🥇 🥈 🥉 medals)
(() => {
  const INK = '#33413f';
  const FONT = 'Nunito, Arial Rounded MT Bold, Arial, sans-serif';
  const COLOURS = ['#ff6b6b', '#ff922b', '#f59f00', '#51cf66', '#20c997', '#22b8cf', '#339af0', '#5c7cfa', '#845ef7', '#cc5de8', '#f06595'];
  const text = (x, y, size, body) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="' + FONT + '" font-weight="900" font-size="' + size +
    '" fill="#fff" stroke="' + INK + '" stroke-width="1.3" paint-order="stroke">' + body + '</text>';
  const tile = (letter, colour) => '<rect x="5" y="5" width="54" height="54" rx="13" fill="' + colour + '" stroke="' + INK + '" stroke-width="2.5"/>' +
    '<rect x="11" y="9" width="42" height="9" rx="4.5" fill="#fff" opacity=".3"/>' +
    text(32, 45, 30, letter + '<tspan font-size="24">' + letter.toLowerCase() + '</tspan>');
  const badge = (label, colour) => '<path d="M20 36L12 60l10-4 6 8 6-22zM44 36l8 24-10-4-6 8-6-22z" fill="#e5484d" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<circle cx="32" cy="27" r="23" fill="' + colour + '" stroke="' + INK + '" stroke-width="2.5"/><circle cx="32" cy="27" r="17" fill="#fff" opacity=".25"/>' +
    text(32, 35, label.length > 3 ? 18 : 21, label.replace(/(\d+)(\D+)/, '$1<tspan font-size="13" dy="-7">$2</tspan>'));
  const more = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter, n) => { more['harf-' + letter.toLowerCase()] = tile(letter, COLOURS[n % COLOURS.length]); });
  for (let n = 4; n <= 10; n++) more['sira-' + n] = badge(n + 'th', COLOURS[(n * 3) % COLOURS.length]);
  kelimeResimleri.ekle(more);
})();
