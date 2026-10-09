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
  ClipboardPaste,
  ExternalLink,
  Printer,
  Box
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
  const [toast, setToast] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  // Default view mode to 'split' on desktop & tablet (>=768px), and 'editor' on mobile (<768px)
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'editor';
    }
    return 'split';
  });
  const [previewScale, setPreviewScale] = useState<'mobile' | 'desktop'>('desktop');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync mobile state and viewMode on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile && viewMode === 'split') {
        setViewMode('editor');
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
        setToast('Project Saved Locally!');
        setTimeout(() => setToast(null), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code]); // Re-bind if code (or handleDownload dependencies) changes

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
    setToast('Preparing High-Fidelity Print...');
    
    try {
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) throw new Error("Iframe not accessible");

      // Give a tiny bit of time for the toast to show
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Better Idea: Use Browser Native Print for High Fidelity
      // This preserves fonts (Myanmar script), text selection, and vectors.
      iframeWindow.focus();
      iframeWindow.print();
      
      setToast('Print Dialog Opened');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Print failed:', err);
      alert('Printing failed. Please ensure the preview is fully loaded.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenReadable = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    // Opening in a new tab allows the user to see the "Readable file link"
    // and use the browser's native features (Share, Translate, Save).
    window.open(url, '_blank');
    setToast('Opened in Reader View');
    setTimeout(() => setToast(null), 3000);
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard API not supported in this environment');
      }

      const text = await navigator.clipboard.readText();
      if (typeof text === 'string' && text.length > 0) {
        setCode(text);
        setToast('HTML Pasted Successfully');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast('Clipboard is empty');
        setTimeout(() => setToast(null), 3000);
        textareaRef.current?.focus();
      }
    } catch (err) {
      console.warn('Clipboard read error or permission denied:', err);
      textareaRef.current?.focus();
      setToast('Clipboard blocked: Press Ctrl+V (or Cmd+V) to paste');
      setTimeout(() => setToast(null), 4000);
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
              onClick={handleOpenReadable}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold hover:bg-brand-border/30 transition-colors"
              aria-label="Open Reader View"
              title="Open in Full Read Mode"
            >
              <ExternalLink size={20} />
              <span className="hidden md:inline uppercase text-xs">Reader Link</span>
            </motion.button>

            {/* 3D Viewer External Link */}
            <motion.a
              href="https://3d-viewer.komoe.org/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold hover:bg-brand-border/30 hover:text-white transition-colors"
              aria-label="Open 3D Viewer"
              title="Open 3D Viewer (https://3d-viewer.komoe.org/)"
            >
              <Box size={20} className="text-cyan-400" />
              <span className="hidden md:inline uppercase text-xs">3D Viewer</span>
            </motion.a>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold transition-colors hover:bg-brand-border/30 disabled:opacity-50"
              aria-label="Print Document"
              title="Print to PDF (High Quality)"
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
              <span className="hidden md:inline uppercase text-xs">{isExporting ? '...' : 'Print'}</span>
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
      <main className="flex-1 flex flex-col md:flex-row min-h-0 relative pb-16 md:pb-0 overflow-hidden">
        {/* Editor Pane */}
        {(viewMode === 'editor' || (viewMode === 'split' && !isMobile)) && (
          <div 
            className={`flex flex-col bg-brand-editor border-r border-brand-border relative h-full min-w-0 transition-all duration-200 ${
              viewMode === 'split' && !isMobile ? 'w-full md:w-1/2 md:basis-1/2 flex-1' : 'w-full flex-1'
            }`}
          >
            <div className="h-10 md:h-9 px-4 bg-brand-sidebar border-b border-brand-border flex items-center justify-between shrink-0">
              <span className="text-[10px] md:text-[11px] font-bold text-brand-text-dim uppercase tracking-widest flex items-center gap-2">
                index.html
              </span>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button 
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-md text-xs font-semibold shadow-sm hover:shadow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-sidebar active:scale-95 cursor-pointer"
                  title="Paste from Clipboard"
                  aria-label="Paste HTML code from clipboard"
                >
                  <span aria-hidden="true" className="text-xs">📋</span>
                  <span>Paste HTML</span>
                </button>
                <button 
                  onClick={handleCopy}
                  className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center hover:bg-brand-border/50 rounded transition-colors text-brand-text-dim hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-sidebar cursor-pointer"
                  title="Copy to Clipboard"
                  aria-label="Copy code to clipboard"
                >
                  {copied ? <Check size={18} className="text-brand-accent" /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={handleClear}
                  className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center hover:bg-red-500/10 rounded transition-colors text-brand-text-dim hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-brand-sidebar cursor-pointer"
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
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || (viewMode === 'split' && !isMobile)) && (
          <div 
            className={`flex flex-col bg-brand-bg relative h-full min-w-0 transition-all duration-200 ${
              viewMode === 'split' && !isMobile ? 'w-full md:w-1/2 md:basis-1/2 flex-1' : 'w-full flex-1'
            }`}
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

            <div className={`flex-1 flex items-center justify-center overflow-auto bg-brand-bg ${viewMode === 'preview' ? 'p-0 md:p-8' : 'p-2 md:p-4'}`}>
              <div 
                className={`bg-white shadow-2xl rounded-sm overflow-hidden transition-all duration-300 ${
                  (previewScale === 'mobile' && !isMobile) 
                    ? 'w-[375px] h-[667px] max-h-[calc(100%-20px)] my-2' 
                    : 'w-full h-full'
                }`}
              >
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  srcDoc={code}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="flex md:hidden fixed bottom-0 left-0 w-full h-16 bg-brand-sidebar border-t border-brand-border flex items-center z-50 shadow-2xl">
        <button
          onClick={() => setViewMode('editor')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all h-full ${viewMode === 'editor' ? 'text-brand-accent font-bold' : 'text-brand-text-dim'}`}
          aria-label="Switch to editor tab"
        >
          <Code2 size={24} />
          <span className="text-[10px] uppercase tracking-wider">Code Editor</span>
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all h-full ${viewMode === 'preview' ? 'text-brand-accent font-bold' : 'text-brand-text-dim'}`}
          aria-label="Switch to preview tab"
        >
          <Eye size={24} />
          <span className="text-[10px] uppercase tracking-wider">Live Preview</span>
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
          <a
            href="https://3d-viewer.komoe.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
            title="Open 3D Viewer"
          >
            <Box size={12} />
            <span>3D Viewer</span>
          </a>
          <span className="opacity-40">•</span>
          <span>UTF-8</span>
          <span>HTML5 / CSS3</span>
        </div>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-brand-accent text-white rounded-full shadow-2xl font-semibold text-xs flex items-center gap-2 border border-white/20 tracking-wide"
          >
            <Check size={14} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
