/** @type {import('tailwindcss').Config} */
export default {
  // Scan every place a class name can appear so unused utilities are purged
  // and dynamic ones (e.g. the bg-[#...] literals in constants.ts) are kept.
  content: [
    './index.html',
    './*.{ts,tsx,js}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
