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
