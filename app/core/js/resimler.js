// Resimler: İngilizce Koyu's pictures from the owner's picture sheets (assets/images/ingilizce/<name>.webp, 256×256 with a
// clear background; the house and animal cards keep their own coloured card). They join kelimeResimleri as [[y-<name>]],
// drawn in the same 64×64 box. A picture no word uses yet (meal-bowl, girl-smiling, hug, snowman, thumbs-up, the -2s) can still be chosen on kontrol.html.
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
    'funny', 'garden', 'goldfish', 'happy',
    // family (girl-smiling is not given to a word yet)
    'album', 'baby', 'girl-flower', 'boy-hoodie', 'boy-and-sister', 'dad-and-son', 'girl-smiling', 'girl-teddy', 'family', 'grandfather',
    'grandmother', 'kids-thumbs-up',
    // people and feelings
    'hungry', 'lovely', 'lunch-kids', 'mother', 'snack-time', 'photo', 'tall-short', 'sister', 'sorry',
    // clothes, the body, a few words; the second choice of a word ends in -2 or -3, and some wait for a word
    'cake', 'cake-slice', 'cheer-up', 'cheer-up-2', 'clothes', 'clothes-2', 'clothes-3', 'coat', 'coat-2', 'cold', 'snowman', 'dark', 'dark-2',
    'dear', 'hug', 'dress', 'dress-2', 'ear', 'ear-2', 'eye', 'face', 'face-2', 'gift', 'gift-2', 'glasses', 'glasses-2', 'gloves', 'gloves-2',
    'great', 'thumbs-up', 'hair', 'hair-2',
    // the body, clothes, weather
    'puppet', 'mouth', 'nose', 'rain', 'scarf', 'shirt', 'shoes', 'tall-boys', 'show', 'small', 'snow', 'trousers', 't-shirt', 'umbrella', 'umbrella-2',
    // the body, people, clothes; the classroom
    'arm', 'birthday', 'blond', 'blonde', 'body', 'break-time', 'hand', 'hot', 'hat', 'jacket', 'head', 'leg',
    'window', 'sun', 'wall', 'well-done', 'whiteboard', 'pencils'
  ];
  const more = {};
  for (const name of names) {
    const src = 'assets/images/ingilizce/' + name + '.webp?v=' + V;
    more['y-' + name] = '<image href="' + src + '" xlink:href="' + src + '" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>';
  }
  kelimeResimleri.ekle(more);
})();
