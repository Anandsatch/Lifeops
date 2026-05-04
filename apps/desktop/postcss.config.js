// postcss-import must run before tailwindcss so Tailwind's preflight sees
// the inlined design-system tokens. Vite handles @import natively for its
// own bundling, but PostCSS plugins (Tailwind) need the imports inlined
// first or @tailwind directives evaluate against a partial source.
export default {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
