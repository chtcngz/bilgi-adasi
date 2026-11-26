// Yiyecekler: İngilizce Koyu's food pictures (assets/images/ingilizce/<name>.webp, cut from the owner's food picture,
// 256×256 with a clear background). They join kelimeResimleri as [[y-<name>]], drawn in the same 64×64 box.
(() => {
  const V = 1;   // bump when the pictures change
  const names = ['apples', 'bananas', 'beans', 'bread', 'breakfast', 'broccoli', 'carrots', 'cauliflower', 'cherries', 'chicken', 'coffee',
    'courgette', 'cucumber', 'yummy', 'dinner', 'drink', 'eggs', 'fish', 'fruit', 'garlic', 'grapes', 'lettuce'];
  const more = {};
  for (const name of names) {
    const src = 'assets/images/ingilizce/' + name + '.webp?v=' + V;
    more['y-' + name] = '<image href="' + src + '" xlink:href="' + src + '" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>';
  }
  kelimeResimleri.ekle(more);
})();
