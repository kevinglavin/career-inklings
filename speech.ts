// Read-aloud via the browser's built-in Web Speech API (no dependencies).
export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, lang: string = 'en') {
  try {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel(); // stop anything already playing
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'es' ? 'es-ES' : 'en-US';
    u.rate = 0.95;
    synth.speak(u);
  } catch { /* speech not available — fail silently */ }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}
