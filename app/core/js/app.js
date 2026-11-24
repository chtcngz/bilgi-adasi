// Shared state and helpers every island relies on. Loaded first, before any other script.
const $ = id => document.getElementById(id);
// The player playing now (set by core/js/profiles.js) and whether the browser refused to save.
let activeProfile;
let storageFailed = false;
