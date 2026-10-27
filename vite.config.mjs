import { defineConfig, transformWithOxc } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { devServer } from './build/dev-server.mjs';

// One UMD file, backend/www/lpis.js, published as `window.lpis`. `pnpm dev` serves
// it behind the shell the way a deployment does: see build/dev-server.mjs.
const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'));
const self = { name: pkg.name, file: path.basename(pkg.main) };

const frontend = path.resolve(import.meta.dirname, 'frontend') + path.sep;

// oxc takes the language from the extension, and ui/Init.js holds JSX.
const jsxInJs = () => ({
  name: 'lpis:jsx-in-js',
  enforce: 'pre',
  transform(code, id) {
    if (!id.startsWith(frontend) || !id.endsWith('.js')) return null;
    return transformWithOxc(code, id, { lang: 'jsx', jsx: { runtime: 'classic' } });
  },
});

// The id must not end in `.css`, or Vite's CSS handling claims the generated module.
const STYLE = '\0lpis-style:';
const AS_JS = '.js';
const INSERT = '\0lpis-style-insert';

// One <style> per imported sheet, appended to <head> when its module evaluates, as
// style-loader did. Vite would extract a single .css file, and the shell loads
// only scripts. Taken from svarog-spatial's vite.config.mjs.
function stylePerSheet() {
  return {
    name: 'lpis:style-per-sheet',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source === INSERT) return INSERT;
      if (!importer || !source.endsWith('.css')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved && STYLE + resolved.id + AS_JS;
    },
    load(id) {
      if (id === INSERT) {
        return [
          'export default function insert(css) {',
          '  const style = document.createElement("style");',
          '  style.textContent = css;',
          '  document.head.appendChild(style);',
          '}'
        ].join('\n');
      }
      if (!id.startsWith(STYLE)) return null;
      const sheet = id.slice(STYLE.length, -AS_JS.length);
      return [
        `import insert from ${JSON.stringify(INSERT)};`,
        `import css from ${JSON.stringify(sheet + '?inline')};`,
        'insert(css);'
      ].join('\n');
    },
    transform(code, id) {
      if (!id.endsWith('.css?inline')) return null;
      return { code: squeeze(code), map: null };
    }
  };
}

const SEPARATORS = '{};,';

// Comments and runs of whitespace out, every token as written. A minifier respells
// values (lightningcss turns `background: transparent` into `background: 0 0`).
function squeeze(css) {
  let out = '';
  let space = false;
  const put = (text) => {
    if (space && out && !SEPARATORS.includes(out.at(-1)) && !SEPARATORS.includes(text[0])) out += ' ';
    space = false;
    out += text;
  };
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") {
      let end = i + 1;
      while (end < css.length && css[end] !== c) end += css[end] === '\\' ? 2 : 1;
      put(css.slice(i, end + 1));
      i = end + 1;
    } else if (c === '\\') {
      put(css.slice(i, i + 2));
      i += 2;
    } else if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? css.length : end + 2;
      if (!space && out && i < css.length && !/[\s{};,]/.test(out.at(-1) + css[i])) put('/**/');
    } else if (/\s/.test(c)) {
      space = true;
      i += 1;
    } else {
      put(c);
      i += 1;
    }
  }
  return out;
}

// Map sources as `frontend/...`, so DevTools keeps them under `/lpis/` instead of
// mixing them with other plugins' files of the same name.
const sourcePath = (source, map) =>
  path.relative(import.meta.dirname, path.resolve(path.dirname(map), source)).split(path.sep).join('/');

// The shell's own bundles, external in dev too so dev catches what production would.
const externals = ['perun-core', 'spatial'];

export default defineConfig(({ mode }) => {
  const production = mode === 'production';

  return {
    publicDir: false,
    plugins: [jsxInJs(), stylePerSheet(), devServer(self)],
    // React comes from perun-core; the automatic runtime would import react/jsx-runtime.
    // `development` is pinned: the dev server's NODE_ENV would add __source/__self props.
    oxc: { jsx: { runtime: 'classic', development: false } },
    build: {
      outDir: 'backend/www',
      // The directory also holds index.html and config.js.
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
      rollupOptions: {
        external: externals,
        output: {
          globals: Object.fromEntries(externals.map(name => [name, name])),
          // `window.lpis.__esModule`, as webpack set it.
          esModule: true,
          sourcemapPathTransform: sourcePath,
        },
      },
    },
  };
});
