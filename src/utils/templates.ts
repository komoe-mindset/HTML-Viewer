export const DEFAULT_REACT_CODE = `import React, { useState } from 'react';
import { Sparkles, Heart, RefreshCw, Smartphone, Tablet, Monitor } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
}

export default function App() {
  const [likes, setLikes] = useState<number>(42);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'features'>('overview');

  const stats: StatItem[] = [
    { label: 'Speed', value: '< 20ms' },
    { label: 'Transpiler', value: 'Babel Standalone' },
    { label: 'React Engine', value: 'v18.3 UMD' },
  ];

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white relative">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
              <Sparkles size={14} className="text-amber-300" />
              React 18 & TypeScript Sandbox
            </span>
            <button
              onClick={handleLike}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 \${
                hasLiked
                  ? 'bg-rose-500 text-white scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }\`}
              title="Give a Like"
            >
              <Heart size={14} className={hasLiked ? 'fill-white' : ''} />
              <span>{likes}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Interactive TSX Component
          </h1>
          <p className="text-indigo-100/90 text-sm leading-relaxed">
            Write full React components with hooks, TypeScript interfaces, and Tailwind CSS. All compiled live right in your browser!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={\`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 \${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }\`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={\`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 \${
              activeTab === 'features'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }\`}
          >
            Features
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-xs text-slate-500 font-medium mb-1">{stat.label}</span>
                    <span className="block text-sm sm:text-base font-bold text-slate-800">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">
                  ✓
                </div>
                <div className="text-xs text-indigo-950 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Live Viewport Testing</span>
                  Use the toggle buttons in the toolbar (Mobile, Tablet, Desktop) to test how your layout responds across various screen widths!
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span><strong>Babel In-Browser:</strong> Instant JSX & TS transpilation</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span><strong>Tailwind CSS 3.x CDN:</strong> Complete utility classes included</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span><strong>React 18 Sandbox:</strong> Isolated iframe execution</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Try editing code in the editor!</span>
            <button
              onClick={() => {
                setLikes(42);
                setHasLiked(false);
              }}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <RefreshCw size={12} />
              Reset State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

export const DEFAULT_HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello From HTML Editor</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
        }
        .card {
            background: white;
            padding: 2.5rem;
            border-radius: 1.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            max-width: 520px;
            width: 100%;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.8);
        }
    </style>
</head>
<body>
    <div class="card">
        <span class="inline-block bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Live HTML5 & CSS3
        </span>
        <h1 class="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Mingalar Par! ✨
        </h1>
        <p class="text-slate-600 text-sm leading-relaxed mb-6">
            This workspace now supports both standard HTML and React/TypeScript (.tsx) code. Test responsiveness using Mobile, Tablet, and Desktop viewport controls!
        </p>
        <button 
            onclick="alert('JavaScript & Tailwind CSS are working perfectly!')"
            class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
            Interactive Action
        </button>
    </div>
</body>
</html>`;
