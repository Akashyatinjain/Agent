// Tailwind v4 is handled via @tailwindcss/vite plugin in vite.config.js
// PostCSS is only needed for autoprefixer and other non-Tailwind plugins
export default {
  plugins: {
    autoprefixer: {},
  },
}
