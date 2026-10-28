import { defineConfig } from 'vite';
import path from 'node:path';
import pkg from './package.json' with { type: 'json' };
import { devServer } from './build/dev-server.mjs';

const self = { name: pkg.name, file: path.basename(pkg.main) };
const externals = ['perun-core', 'spatial'];

// The shell loads only scripts, so each imported sheet becomes a <style>, as style-loader did.
// The id must not end in `.css`, or Vite's CSS plugin claims it.
const STYLE = '\0lpis-style:';
const injectStyles = () => ({
  name: 'lpis:inject-styles',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (!importer || !source.endsWith('.css')) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    return resolved && `${STYLE}${resolved.id}.js`;
  },
  load(id) {
    if (!id.startsWith(STYLE)) return null;
    const sheet = JSON.stringify(id.slice(STYLE.length, -'.js'.length) + '?inline');
    return `import css from ${sheet};\ndocument.head.appendChild(document.createElement('style')).textContent = css;`;
  },
});

export default defineConfig(({ mode }) => {
  const production = mode === 'production';

  return {
    plugins: [injectStyles(), devServer(self)],
    // React comes from perun-core, so no react/jsx-runtime; the dev server's NODE_ENV would add __source/__self.
    oxc: { jsx: { runtime: 'classic', development: false } },
    build: {
      outDir: path.dirname(pkg.main),
      // Also holds index.html and config.js.
      emptyOutDir: false,
      // perun-core's own bundle needs ES2020.
      target: 'es2020',
      sourcemap: true,
      cssMinify: false,
      minify: production,
      lib: {
        entry: production ? 'frontend/index.js' : 'frontend/client.js',
        name: self.name,
        formats: ['umd'],
        fileName: () => self.file,
      },
      rolldownOptions: {
        external: externals,
        output: {
          globals: Object.fromEntries(externals.map(name => [name, name])),
          // `window.lpis.__esModule`, as webpack set it.
          esModule: true,
          // `frontend/...` rather than `../../frontend/...`, so DevTools keeps the sources under /lpis/.
          sourcemapPathTransform: source => source.replace(/^(\.\.\/)+/, ''),
        },
      },
    },
  };
});
