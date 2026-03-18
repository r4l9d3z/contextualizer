import { defineConfig } from 'vite';

export default defineConfig({
  base: '/contextualizer/',
  plugins: [
    {
      name: 'remove-css-crossorigin',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          // Remove crossorigin from <link rel="stylesheet"> — it's not needed for
          // same-origin CSS and triggers CORS-mode fetching that can silently fail
          // on older iOS Safari versions, causing the stylesheet to not load at all.
          return html.replace(/<link rel="stylesheet" crossorigin /g, '<link rel="stylesheet" ');
        }
      }
    }
  ]
});
