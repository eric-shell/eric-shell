// Index page only. `Note` (the detail route) is imported directly by App.tsx —
// re-exporting it here would pull the whole detail route, and with it the
// markdown components, into the chunk someone gets for the list.
export { default } from './Notes'
