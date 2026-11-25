// Shared state and helpers every island relies on. Loaded first, before any other script.
const $ = id => document.getElementById(id);
// The player playing now (set by core/js/profiles.js) and whether the browser refused to save.
let activeProfile;
let storageFailed = false;
// TEMPORARY, for development: a player named "admin" sees every island and has every game, step,
// cove, stop and exam unlocked, so everything can be tried out. Remove before release (grep devAll).
const devAll = () => /^adm[iıİI]n$/i.test(activeProfile?.name.trim() ?? '');
