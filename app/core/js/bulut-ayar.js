// The Firebase project the game copies its progress to (core/js/sync.js) and the Yönetici sayfası
// reads it from (admin/). These values are public by design: what may be read or written is decided
// by the Firestore rules in the Firebase console (see README).
const bulutAyar = {
  apiKey: 'AIzaSyB-5Yn45OWUTgcn5SOLNdSYAKSi-w3jjsk',
  projectId: 'bilgi-adasi-15c4e',
  // The Web client ID of the project's Google sign-in (Firebase → Authentication → Sign-in method →
  // Google → Web SDK configuration). Empty: the Yönetici sayfası asks Firebase for it.
  googleClientId: '210565937802-jdv0g8bc7n537c21vviavhsjcftqs9uk.apps.googleusercontent.com'
};

// A device's kimlik: six letters and digits (K7Q-X2M) worked out from its anonymous Firebase uid, so every device
// has one on its own, the same on the admin page (which filters by it) and in the game's Settings (to tell which
// tablet is which). Letters that look alike (I/1, O/0) are left out.
function cihazKimligi(uid) {
  if (!uid) return '';
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 2166136261;
  for (const ch of String(uid)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  let g = h ^ 0x9e3779b9;
  for (const ch of String(uid)) g = Math.imul(g ^ ch.charCodeAt(0), 2246822519) >>> 0;
  let code = '';
  for (let i = 0; i < 6; i++) {
    const n = i < 3 ? h : g;
    code += abc[(n >>> (i % 3) * 5) & 31];
  }
  return code.slice(0, 3) + '-' + code.slice(3);
}
