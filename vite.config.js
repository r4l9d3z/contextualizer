import { defineConfig } from 'vite';

export default defineConfig({
  base: '/contextualizer/',
  plugins: [
    {
      name: 'remove-crossorigin',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          // Remove crossorigin from all tags in the built HTML.
          // Vite adds crossorigin to <link rel="stylesheet"> and <script type="module">
          // for CORS credential handling, but for same-origin GitHub Pages assets this
          // is unnecessary. Worse, iOS Safari (14 and older) in private mode silently
          // fails to load resources that have the crossorigin attribute, leaving the
          // page completely unstyled and non-functional.
          // The attribute may appear as `crossorigin`, `crossorigin=""`, or
          // `crossorigin="anonymous"` — strip all forms.
          return html.replace(/ crossorigin(?:="[^"]*")?/g, '');
        }
      }
    }
  ]
});
