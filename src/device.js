export function isMobileExperience() {
  return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
}
