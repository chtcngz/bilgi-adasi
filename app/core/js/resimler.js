// Resimler: İngilizce Koyu's pictures from the owner's picture sheets (assets/images/ingilizce/<name>.webp, 256×256 with a
// clear background; the house and animal cards keep their own coloured card). They join kelimeResimleri as [[y-<name>]],
// drawn in the same 64×64 box. A picture no word uses yet (meal-bowl) can still be chosen on kontrol.html.
(() => {
  const V = 2;   // bump when the pictures change
  const names = [
    // food, first sheet
    'apples', 'bananas', 'beans', 'bread', 'breakfast', 'broccoli', 'carrots', 'cauliflower', 'cherries', 'chicken', 'coffee',
    'courgette', 'yummy', 'dinner', 'drink', 'eggs', 'fish', 'fruit', 'garlic', 'grapes', 'lettuce',
    // food, second sheet
    'lunch', 'meat', 'milk', 'oranges', 'pears', 'peppers', 'potatoes', 'spinach', 'strawberries', 'tea', 'thirsty', 'tomatoes',
    'vegetable', 'water', 'meal-bowl',
    // home and pets
    'house', 'kitchen', 'paw', 'dog', 'rabbit', 'bedroom', 'sitting-room', 'cat',
    // home and pets, second sheet (bedroom, cat, dog and cucumber were drawn again)
    'balcony', 'bathroom', 'beak', 'bed', 'bird', 'claw', 'coffee-table', 'cucumber', 'dance', 'dining-room', 'doorbell', 'dollhouse', 'find',
    'funny', 'garden', 'goldfish', 'happy'
  ];
  const more = {};
  for (const name of names) {
    const src = 'assets/images/ingilizce/' + name + '.webp?v=' + V;
    more['y-' + name] = '<image href="' + src + '" xlink:href="' + src + '" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>';
  }
  kelimeResimleri.ekle(more);
})();
