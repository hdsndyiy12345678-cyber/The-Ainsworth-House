declare global {
  interface Window {
    __AINSWORTH_ASSETS__?: Record<string, string>;
    __AINSWORTH_STANDALONE__?: boolean;
  }
}
export const art = (name: string) =>
  window.__AINSWORTH_ASSETS__?.[name] || `/art/${name}`;
export function installArtTokens() {
  document.documentElement.style.setProperty(
    "--journal-art",
    `url("${art("journal.webp")}")`,
  );
  document.documentElement.style.setProperty(
    "--paper-art",
    `url("${art("paper.webp")}")`,
  );
  document.documentElement.style.setProperty(
    "--wood-art",
    `url("${art("wood.webp")}")`,
  );
}
