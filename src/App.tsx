import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { 
  Code2, 
  Eye, 
  Upload, 
  Trash2, 
  Copy, 
  Download, 
  Check, 
  Layout, 
  Smartphone, 
  Monitor,
  FileText,
  Loader2,
  ClipboardPaste
} from 'lucide-react';

const DEFAULT_CODE = `<!DOCTYPE html>
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
            padding: 2rem;
            border-radius: 1.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
        }
        .badge {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #1e1b4b; }
        p { color: #64748b; line-height: 1.6; margin-bottom: 2rem; font-size: 0.95rem; }
        button {
            background: #4f46e5;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
            background: #4338ca;
        }
        @media (min-width: 640px) {
            h1 { font-size: 2.5rem; }
            .card { padding: 3rem; }
            button { width: auto; }
        }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">Live Studio</span>
        <h1>Mingalar Par! ✨</h1>
        <p>This is your professional Real-time HTML Playground. Switch between Editor and Preview via the bottom navigation on mobile.</p>
        <button onclick="alert('JavaScript is fully supported!')">Interactive Action</button>
    </div>
</body>
</html>`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [previewScale, setPreviewScale] = useState<'mobile' | 'desktop'>('desktop');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync viewMode on window resize to disable split on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'split') {
        setViewMode('editor');
      }
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setCode(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (!code.trim() || !iframeRef.current) return;
    
    setIsExporting(true);
    try {
      const iframeBody = iframeRef.current.contentWindow?.document.body;
      if (!iframeBody) throw new Error("Iframe content not accessible");

      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: 'document.pdf',
        image: { type: 'jpeg' as const, quality: 1.0 },
        html2canvas: { 
          scale: 4,
          useCORS: true,
          allowTaint: true,
          windowWidth: 1200,
          logging: false,
          letterRendering: true,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const,
          autoPaging: 'text' as const
        }
      };

      await html2pdf().from(iframeBody).set(opt).save();
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('PDF Export failed. Ensuring the preview is fully loaded might help.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (code.trim() && !window.confirm('This will replace your current code. Continue?')) {
          return;
        }
        setCode(text);
      }
    } catch (err) {
      if (code.trim()) {
        if (window.confirm('Direct paste is blocked by browser security. Would you like to clear the editor so you can paste manually (Ctrl+V)?')) {
          setCode('');
          setTimeout(() => textareaRef.current?.focus(), 100);
        }
      } else {
        textareaRef.current?.focus();
        alert('Direct paste blocked. Please use Ctrl+V (Cmd+V).');
      }
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the editor?')) {
      setCode('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-brand-bg text-brand-text">
      {/* Header */}
      <header className="h-16 md:h-14 px-4 md:px-5 bg-brand-sidebar border-b border-brand-border flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-8 md:h-8 bg-brand-accent rounded-lg md:rounded-md flex items-center justify-center font-bold text-white text-base md:text-sm shadow-sm shadow-brand-accent/20">
            &lt;/&gt;
          </div>
          <div className="flex flex-col">
            <h1 className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest leading-none">CODEFLOW STUDIO</h1>
            <span className="text-[8px] md:text-[9px] text-white/70 font-medium uppercase tracking-tighter opacity-80">Mobile Professional</span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          {/* Layout Controls - Desktop Only */}
          <div className="hidden md:flex bg-brand-bg/50 p-1 rounded-md gap-1 border border-brand-border">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition-all ${viewMode === 'split' ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text-dim hover:text-brand-text'}`}
              title="Split View"
              aria-label="Toggle split view"
            >
              <Layout size={20} />
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`p-1.5 rounded transition-all ${viewMode === 'editor' ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text-dim hover:text-brand-text'}`}
              title="Editor Only"
              aria-label="Toggle editor view"
            >
              <Code2 size={20} />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded transition-all ${viewMode === 'preview' ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text-dim hover:text-brand-text'}`}
              title="Preview Only"
              aria-label="Toggle preview view"
            >
              <Eye size={20} />
            </button>
          </div>

          <div className="h-5 w-px bg-brand-border hidden md:block" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1 md:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".html,.htm,.txt"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold hover:bg-brand-border/30 transition-colors"
              aria-label="Open File"
            >
              <Upload size={20} />
              <span className="hidden md:inline uppercase text-xs">Open File</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold transition-colors hover:bg-brand-border/30 disabled:opacity-50"
              aria-label="Export PDF"
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
              <span className="hidden md:inline uppercase text-xs">{isExporting ? '...' : 'PDF'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-4 md:py-1.5 bg-brand-accent rounded-lg md:rounded text-white font-bold hover:bg-brand-accent/90 transition-colors shadow-lg shadow-brand-accent/20"
              aria-label="Deploy Live"
            >
              <Download size={20} />
              <span className="hidden md:inline uppercase text-xs">Deploy</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 relative pb-16 md:pb-0">
        {/* Editor Pane */}
        {(viewMode === 'editor' || (viewMode === 'split' && window.innerWidth >= 768)) && (
          <motion.div 
            initial={false}
            animate={{ width: viewMode === 'split' ? '50%' : '100%' }}
            className={`flex flex-col bg-brand-editor border-r border-brand-border relative h-full shrink-0`}
          >
            <div className="h-10 md:h-9 px-4 bg-brand-sidebar border-b border-brand-border flex items-center justify-between shrink-0">
              <span className="text-[10px] md:text-[11px] font-bold text-brand-text-dim uppercase tracking-widest flex items-center gap-2">
                index.html
              </span>
              <div className="flex items-center gap-1 md:gap-2">
                <button 
                  onClick={handlePaste}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center hover:bg-brand-border/50 rounded transition-colors text-brand-text-dim hover:text-brand-text"
                  title="Paste & Replace All"
                  aria-label="Paste and replace current code"
                >
                  <ClipboardPaste size={18} />
                </button>
                <button 
                  onClick={handleCopy}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center hover:bg-brand-border/50 rounded transition-colors text-brand-text-dim hover:text-brand-text"
                  title="Copy to Clipboard"
                  aria-label="Copy code to clipboard"
                >
                  {copied ? <Check size={18} className="text-brand-accent" /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={handleClear}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center hover:bg-red-500/10 rounded transition-colors text-brand-text-dim hover:text-red-400"
                  title="Clear Editor"
                  aria-label="Clear code editor"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden group">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="absolute inset-0 w-full h-full p-6 font-mono text-sm leading-relaxed resize-none bg-brand-editor text-brand-text focus:outline-none focus:ring-0 selection:bg-brand-accent/40"
                placeholder="<!-- Paste your HTML here... -->"
              />
            </div>
          </motion.div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || (viewMode === 'split' && window.innerWidth >= 768)) && (
          <motion.div 
            initial={false}
            animate={{ width: viewMode === 'split' ? '50%' : '100%' }}
            className={`flex flex-col bg-brand-bg relative h-full shrink-0`}
          >
            <div className="h-10 md:h-9 px-4 bg-brand-sidebar border-b border-brand-border flex items-center justify-between shrink-0">
               <span className="text-[10px] md:text-[11px] font-bold text-brand-text-dim uppercase tracking-widest flex items-center gap-2">
                Live Preview
              </span>
              
              <div className="hidden md:flex items-center gap-4">
                <div className="flex bg-brand-bg p-0.5 rounded border border-brand-border">
                  <button 
                    onClick={() => setPreviewScale('desktop')}
                    className={`p-1 rounded transition-all ${previewScale === 'desktop' ? 'bg-brand-accent text-white shadow' : 'text-brand-text-dim hover:text-brand-text'}`}
                    aria-label="Switch to desktop preview scale"
                  >
                    <Monitor size={14} />
                  </button>
                  <button 
                    onClick={() => setPreviewScale('mobile')}
                    className={`p-1 rounded transition-all ${previewScale === 'mobile' ? 'bg-brand-accent text-white shadow' : 'text-brand-text-dim hover:text-brand-text'}`}
                    aria-label="Switch to mobile preview scale"
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className={`flex-1 flex items-center justify-center overflow-auto bg-brand-bg ${viewMode === 'preview' ? 'p-0 md:p-8' : 'p-4 md:p-8'}`}>
              <motion.div 
                layout
                initial={false}
                animate={{ 
                  width: (previewScale === 'mobile' && window.innerWidth >= 768) ? '375px' : '100%',
                  height: (previewScale === 'mobile' && window.innerWidth >= 768) ? '667px' : '100%',
                }}
                className={`bg-white shadow-2xl rounded-sm overflow-hidden transition-all duration-300 ${(previewScale === 'mobile' && window.innerWidth >= 768) ? 'max-h-[calc(100%-40px)] my-5' : 'w-full h-full'}`}
              >
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  srcDoc={code}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-sidebar border-t border-brand-border flex items-center z-30 px-2 shadow-2xl">
        <button
          onClick={() => setViewMode('editor')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all h-full ${viewMode === 'editor' ? 'text-brand-accent font-bold' : 'text-brand-text-dim'}`}
          aria-label="Switch to editor tab"
        >
          <Code2 size={24} />
          <span className="text-[10px] uppercase tracking-wider">Editor</span>
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all h-full ${viewMode === 'preview' ? 'text-brand-accent font-bold' : 'text-brand-text-dim'}`}
          aria-label="Switch to preview tab"
        >
          <Eye size={24} />
          <span className="text-[10px] uppercase tracking-wider">Preview</span>
        </button>
      </nav>

      {/* Desktop Footer Only */}
      <footer className="hidden md:flex h-7 bg-brand-accent text-white px-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/10 rounded">
            Line 1, Col 1
          </span>
          <span className="opacity-80">
            ● Live Sync Active
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider">
          <span>UTF-8</span>
          <span>HTML5 / CSS3</span>
        </div>
      </footer>
    </div>
  );
}
