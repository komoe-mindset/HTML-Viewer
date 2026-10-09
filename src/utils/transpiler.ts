import * as Babel from '@babel/standalone';

export interface TranspileResult {
  success: boolean;
  transpiledCode?: string;
  error?: string;
}

/**
 * Detects whether code is standard HTML or React/TypeScript TSX.
 */
export function detectCodeLanguage(code: string): 'html' | 'tsx' {
  const trimmed = code.trim();
  
  // Explicit HTML document markers
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    (trimmed.includes('<body') && trimmed.includes('</body>'))
  ) {
    return 'html';
  }

  // Common React/TSX patterns
  const isReact = 
    /\bimport\s+.*\bfrom\s+['"]react['"]/.test(trimmed) ||
    /\bimport\s+.*\bfrom\s+['"]/.test(trimmed) ||
    /\bexport\s+default\b/.test(trimmed) ||
    /\buseState\s*[<(]/.test(trimmed) ||
    /\buseEffect\s*\(/.test(trimmed) ||
    /\bReact\.[A-Za-z]+/.test(trimmed) ||
    /\binterface\s+[A-Z]/.test(trimmed) ||
    /\btype\s+[A-Z].*=/.test(trimmed) ||
    /\bclassName\s*=\s*[{'"]/.test(trimmed) ||
    /<[A-Z][A-Za-z0-9]*\b/.test(trimmed);

  if (isReact) {
    return 'tsx';
  }

  // If it starts with standard HTML tag and lacks React keywords
  if (trimmed.startsWith('<') && !trimmed.startsWith('<>') && !trimmed.startsWith('</')) {
    return 'html';
  }

  return 'tsx';
}

/**
 * Transpiles TSX/React code into browser-executable JavaScript using @babel/standalone.
 */
export function transpileTsx(code: string): TranspileResult {
  try {
    // Strip CSS imports so runtime does not fail
    const sanitizedCode = code.replace(/^\s*import\s+['"][^'"]+\.css['"];?\s*$/gm, '');

    // Babel Standalone transform configuration:
    // - presets: ['react', 'typescript']
    // - parserOpts: { plugins: ['jsx', 'typescript'] }
    // Eliminates "@babel/preset-typescript: The .allExtensions and .isTSX options have been removed"
    // Also use 'transform-modules-commonjs' to map standard ES module imports to window/UMD/require
    const result = Babel.transform(sanitizedCode, {
      presets: ['react', 'typescript'],
      plugins: ['transform-modules-commonjs'],
      parserOpts: { plugins: ['jsx', 'typescript'] },
      filename: 'component.tsx',
    });

    return {
      success: true,
      transpiledCode: result.code || '',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Generates an isolated, responsive HTML preview document with injected scripts.
 */
export function generatePreviewDocument(
  code: string,
  mode: 'auto' | 'html' | 'tsx'
): { html: string; isReact: boolean; error?: string } {
  const language = mode === 'auto' ? detectCodeLanguage(code) : mode;

  if (language === 'html') {
    let htmlContent = code;
    // Inject Tailwind CDN if not present in head
    if (!htmlContent.includes('cdn.tailwindcss.com')) {
      if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', '<head>\n    <script src="https://cdn.tailwindcss.com"></script>');
      } else if (htmlContent.includes('<html>')) {
        htmlContent = htmlContent.replace('<html>', '<html>\n<head>\n    <script src="https://cdn.tailwindcss.com"></script>\n</head>');
      } else {
        htmlContent = `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="p-4 bg-white text-slate-800 antialiased">\n${htmlContent}\n</body>\n</html>`;
      }
    }
    return { html: htmlContent, isReact: false };
  }

  // React / TSX Mode
  const transpileRes = transpileTsx(code);

  if (!transpileRes.success) {
    const safeError = (transpileRes.error || 'Unknown compilation error')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-6 font-mono text-sm">
  <div class="max-w-2xl mx-auto bg-red-950/80 border border-red-500/50 rounded-xl p-5 shadow-2xl">
    <div class="flex items-center gap-2 text-red-400 font-bold mb-3 text-base">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      <span>Babel Transpilation Error</span>
    </div>
    <p class="text-xs text-red-200/80 mb-3">Fix the syntax or type error below to restore live preview:</p>
    <pre class="bg-black/50 p-4 rounded-lg text-xs text-red-300 overflow-x-auto border border-red-900/50 leading-relaxed font-mono whitespace-pre-wrap">${safeError}</pre>
  </div>
</body>
</html>`;
    return { html: errorHtml, isReact: true, error: transpileRes.error };
  }

  // Escaping script tag closing sequences if present
  const safeScript = (transpileRes.transpiledCode || '').replace(/<\/script>/gi, '<\\/script>');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>

  <!-- Import map for modern browser ES modules via esm.sh -->
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18.3.1",
        "react/": "https://esm.sh/react@18.3.1/",
        "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
        "react/jsx-dev-runtime": "https://esm.sh/react@18.3.1/jsx-dev-runtime",
        "react-dom": "https://esm.sh/react-dom@18.3.1",
        "react-dom/": "https://esm.sh/react-dom@18.3.1/",
        "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
        "lucide-react": "https://esm.sh/lucide-react@0.344.0"
      }
    }
  </script>

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React 18 & ReactDOM 18 UMD Scripts -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- Lucide React Icons UMD Script -->
  <script src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #ffffff;
      color: #0f172a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    #error-display {
      display: none;
      padding: 20px;
      margin: 16px;
      border-radius: 8px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body class="antialiased">
  <div id="root"></div>
  <div id="error-display"></div>

  <script>
    (function() {
      // Global module environment shims
      window.process = { env: { NODE_ENV: 'production' } };
      window.exports = {};
      window.module = { exports: window.exports };

      // Ensure React default and named imports work seamlessly
      if (window.React) {
        if (!window.React.default) window.React.default = window.React;
        // Expose common React hooks to window for direct access
        window.useState = window.React.useState;
        window.useEffect = window.React.useEffect;
        window.useRef = window.React.useRef;
        window.useMemo = window.React.useMemo;
        window.useCallback = window.React.useCallback;
        window.useContext = window.React.useContext;
        window.useReducer = window.React.useReducer;
        window.createContext = window.React.createContext;
        window.Fragment = window.React.Fragment;
      }
      if (window.ReactDOM && !window.ReactDOM.default) {
        window.ReactDOM.default = window.ReactDOM;
      }

      // Built-in jsx-runtime helper for React 18
      var jsxRuntime = {
        jsx: function(type, props, key) {
          if (!props) props = {};
          if (key !== undefined) props = Object.assign({}, props, { key: key });
          var children = props.children;
          var restProps = Object.assign({}, props);
          delete restProps.children;
          if (Array.isArray(children)) {
            return React.createElement.apply(React, [type, restProps].concat(children));
          } else if (children !== undefined) {
            return React.createElement(type, restProps, children);
          }
          return React.createElement(type, restProps);
        },
        jsxs: function(type, props, key) {
          return jsxRuntime.jsx(type, props, key);
        },
        Fragment: window.React ? window.React.Fragment : 'Fragment'
      };
      window.ReactJSXRuntime = jsxRuntime;

      // Lucide icon fallback proxy for any unbundled or dynamic icons
      var lucideProxy = new Proxy(window.LucideReact || {}, {
        get: function(target, prop) {
          if (target && target[prop]) return target[prop];
          return function(props) {
            props = props || {};
            var size = props.size || 20;
            var className = props.className || '';
            var title = String(prop);
            return React.createElement('span', {
              className: 'inline-flex items-center justify-center ' + className,
              style: Object.assign({}, props.style, { width: size + 'px', height: size + 'px', verticalAlign: 'middle' }),
              title: title
            }, React.createElement('svg', {
              viewBox: '0 0 24 24',
              width: size,
              height: size,
              stroke: 'currentColor',
              strokeWidth: 2,
              fill: 'none',
              strokeLinecap: 'round',
              strokeLinejoin: 'round'
            }, React.createElement('circle', { cx: 12, cy: 12, r: 9 }), React.createElement('path', { d: 'M12 8v8M8 12h8' })));
          };
        }
      });
      window.LucideIcons = lucideProxy;

      // Browser CommonJS / UMD require shim mapping module imports to globals
      window.require = function(moduleName) {
        if (moduleName === 'react') return window.React;
        if (moduleName === 'react/jsx-runtime' || moduleName === 'react/jsx-dev-runtime') return window.ReactJSXRuntime;
        if (moduleName === 'react-dom' || moduleName === 'react-dom/client') return window.ReactDOM;
        if (moduleName === 'lucide-react') return window.LucideReact || window.LucideIcons;
        if (typeof moduleName === 'string' && moduleName.endsWith('.css')) return {};
        // Generic fallback to window object if exists
        if (window[moduleName]) return window[moduleName];
        return {};
      };

      function renderError(err) {
        var errBox = document.getElementById('error-display');
        if (errBox) {
          errBox.style.display = 'block';
          errBox.textContent = 'Runtime Exception in Component:\\n' + (err.stack || err.message || String(err));
        }
        console.error(err);
      }

      window.onerror = function(message, source, lineno, colno, error) {
        renderError(error || message);
        return false;
      };

      try {
        // Execute transpiled React code
        ${safeScript}

        // Locate root component
        var Component = window.exports.default || 
                        (window.module && window.module.exports && window.module.exports.default) || 
                        (window.module && window.module.exports);

        // Fallbacks for unnamed or global components
        if (!Component || (typeof Component !== 'function' && typeof Component !== 'object')) {
          if (typeof window.App === 'function') Component = window.App;
          else if (typeof App === 'function') Component = App;
        }

        var rootContainer = document.getElementById('root');

        if (Component && rootContainer) {
          if (window.ReactDOM.createRoot) {
            var root = window.ReactDOM.createRoot(rootContainer);
            root.render(window.React.createElement(Component));
          } else {
            window.ReactDOM.render(window.React.createElement(Component), rootContainer);
          }
        } else if (rootContainer) {
          rootContainer.innerHTML = 
            '<div class="p-8 max-w-md mx-auto text-center font-sans">' +
            '<div class="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 font-bold text-xl">!</div>' +
            '<h3 class="text-base font-semibold text-slate-800 mb-1">No Exported Component Found</h3>' +
            '<p class="text-xs text-slate-500">Add <code>export default function App() { return &lt;div&gt;...&lt;/div&gt;; }</code> to render your component.</p>' +
            '</div>';
        }
      } catch (err) {
        renderError(err);
      }
    })();
  </script>
</body>
</html>`;

  return { html, isReact: true };
}
