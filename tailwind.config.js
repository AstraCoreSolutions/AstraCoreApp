/**
 * @type {import('tailwindcss').Config}
 *
 * Tailwind configuration for AstraCore.  It scans the `app` and `components`
 * directories to generate utility classes at build time.  You can extend
 * the default theme here to suit your brand.
 */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
