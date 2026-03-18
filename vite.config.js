import { defineConfig } from 'vite';

export default defineConfig({
  base: '/contextualizer/',
  plugins: [
    {
      name: 'fix-head',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          // 1. Strip Vite-added crossorigin from asset tags.
          //    Vite adds crossorigin to <script type="module"> and <link rel="stylesheet">
          //    for CORS credential handling, but for same-origin GitHub Pages assets this
          //    is unnecessary. Worse, iOS Safari (14 and older) in private mode silently
          //    fails to load resources that have the crossorigin attribute, leaving the
          //    page completely unstyled and non-functional.
          //    Preserve crossorigin on <link rel="preconnect"> (needed for CORS font preconnection).
          html = html.replace(/ crossorigin(?:="[^"]*")?/g, (match, offset) => {
            const before = html.slice(0, offset);
            const tagStart = before.lastIndexOf('<');
            const tagSnippet = html.slice(tagStart, offset);
            return tagSnippet.includes('preconnect') ? match : '';
          });

          // 2. Move CSS <link> before the <script type="module"> in <head>.
          //    Conventional ordering: render-blocking CSS should precede deferred scripts
          //    so the browser's preload scanner processes the stylesheet first.
          html = html.replace(
            /(\s+)(<script type="module" src="[^"]+"><\/script>)(\s+)(<link rel="stylesheet" href="[^"]+">)/,
            '$1$4$3$2'
          );

          return html;
        }
      }
    }
  ]
});
