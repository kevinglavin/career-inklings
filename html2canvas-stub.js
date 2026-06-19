// Stub for html2canvas. jsPDF references it via a dynamic import for its `.html()` method,
// which this app never calls (the PDF report is built with the text-based jsPDF API).
// Aliased in vite.config.ts so the real ~200 KB library is kept out of the bundle.
export default function html2canvas() {
  return Promise.reject(new Error('html2canvas is intentionally disabled in this build.'));
}
