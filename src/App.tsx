import { useState, useRef, ChangeEvent, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Tablet,
  Monitor, 
  Loader2,
  ExternalLink,
  Printer,
  Box,
  RotateCcw,
  Sparkles,
  FileCode2
} from 'lucide-react';
import { generatePreviewDocument, detectCodeLanguage } from './utils/transpiler';
import { DEFAULT_REACT_CODE, DEFAULT_HTML_CODE } from './utils/templates';

type ViewportMode = 'mobile' | 'tablet' | 'desktop';
type FileType = 'App.tsx' | 'index.html';

export default function App() {
  const [currentFile, setCurrentFile] = useState<FileType>('App.tsx');
  const [code, setCode] = useState<string>(DEFAULT_REACT_CODE);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isExporting, setIsExporting] = useState(false);

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

  // Transpile and generate isolated preview document
  const { html: previewHtml, isReact, error: transpileError } = useMemo(() => {
    const detected = detectCodeLanguage(code);
    const mode = currentFile.endsWith('.tsx') ? 'tsx' : detected === 'tsx' ? 'tsx' : 'html';
    return generatePreviewDocument(code, mode);
  }, [code, currentFile]);

  // Keyboard Shortcuts (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
        setToast('Project Saved Locally!');
        setTimeout(() => setToast(null), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, currentFile]);

  const handleSwitchTemplate = (targetFile: FileType) => {
    if (targetFile === currentFile) return;

    if (code.trim().length > 0 && code !== DEFAULT_REACT_CODE && code !== DEFAULT_HTML_CODE) {
      const confirmed = window.confirm(`Switch to ${targetFile}? Any unsaved changes in ${currentFile} will be replaced with the default ${targetFile} template.`);
      if (!confirmed) return;
    }

    setCurrentFile(targetFile);
    if (targetFile === 'App.tsx') {
      setCode(DEFAULT_REACT_CODE);
      setToast('Switched to React (TSX) Sandbox');
    } else {
      setCode(DEFAULT_HTML_CODE);
      setToast('Switched to HTML5 Template');
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleResetTemplate = () => {
    if (window.confirm(`Reset ${currentFile} to default starter template?`)) {
      if (currentFile === 'App.tsx') {
        setCode(DEFAULT_REACT_CODE);
      } else {
        setCode(DEFAULT_HTML_CODE);
      }
      setToast('Template Reset');
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isTsx = fileName.endsWith('.tsx') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.js');
    const targetFile: FileType = isTsx ? 'App.tsx' : 'index.html';

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCurrentFile(targetFile);
        setCode(content);
        setToast(`Loaded ${fileName}`);
        setTimeout(() => setToast(null), 3000);
      }
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
    const isTsxFile = currentFile.endsWith('.tsx') || isReact;
    const downloadName = isTsxFile ? 'App.tsx' : 'index.html';
    const mimeType = isTsxFile ? 'text/typescript' : 'text/html';

    const blob = new Blob([code], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
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

      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setToast('Opened in Full Reader View');
    setTimeout(() => setToast(null), 3000);
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard API not supported in this environment');
      }

      const text = await navigator.clipboard.readText();
      if (typeof text === 'string' && text.length > 0) {
        const detected = detectCodeLanguage(text);
        if (detected === 'tsx' && currentFile !== 'App.tsx') {
          setCurrentFile('App.tsx');
        } else if (detected === 'html' && currentFile !== 'index.html') {
          setCurrentFile('index.html');
        }
        setCode(text);
        setToast(`${detected === 'tsx' ? 'React TSX' : 'HTML'} Pasted Successfully`);
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
            <h1 className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest leading-none">
              CODEFLOW STUDIO
            </h1>
            <span className="text-[8px] md:text-[9px] text-white/70 font-medium uppercase tracking-tighter opacity-80">
              HTML5 & React TSX Previewer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Layout Controls - Desktop & Tablet */}
          <div className="hidden md:flex bg-brand-bg/50 p-1 rounded-md gap-1 border border-brand-border">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition-all ${viewMode === 'split' ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text-dim hover:text-brand-text'}`}
              title="Split View (Editor & Live Preview)"
              aria-label="Toggle split view"
            >
              <Layout size={18} />
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`p-1.5 rounded transition-all ${viewMode === 'editor' ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text-dim hover:text-brand-text'}`}
              title="Editor Only"
              aria-label="Toggle editor view"
            >
              <Code2 size={18} />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded transition-all ${viewMode === 'preview' ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text-dim hover:text-brand-text'}`}
              title="Preview Only"
              aria-label="Toggle preview view"
            >
              <Eye size={18} />
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
              accept=".html,.htm,.tsx,.jsx,.ts,.js,.txt"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold hover:bg-brand-border/30 transition-colors"
              aria-label="Open File"
              title="Upload HTML or .tsx File"
            >
              <Upload size={18} />
              <span className="hidden md:inline uppercase text-xs">Open File</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenReadable}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold hover:bg-brand-border/30 transition-colors"
              aria-label="Open Reader View"
              title="Open Rendered Preview in New Tab"
            >
              <ExternalLink size={18} />
              <span className="hidden md:inline uppercase text-xs">Reader View</span>
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
              <Box size={18} className="text-cyan-400" />
              <span className="hidden md:inline uppercase text-xs">3D Viewer</span>
            </motion.a>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-3 md:py-1.5 bg-transparent border border-brand-border rounded-lg md:rounded text-brand-text font-semibold transition-colors hover:bg-brand-border/30 disabled:opacity-50"
              aria-label="Print Document"
              title="Print Preview to PDF"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
              <span className="hidden md:inline uppercase text-xs">{isExporting ? '...' : 'Print'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="w-12 h-12 md:w-auto md:h-auto flex items-center justify-center md:gap-2 md:px-4 md:py-1.5 bg-brand-accent rounded-lg md:rounded text-white font-bold hover:bg-brand-accent/90 transition-colors shadow-lg shadow-brand-accent/20"
              aria-label="Save Code"
              title={`Download ${currentFile}`}
            >
              <Download size={18} />
              <span className="hidden md:inline uppercase text-xs">Save</span>
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
            {/* Editor Sub-Header Toolbar */}
            <div className="h-11 md:h-10 px-3 md:px-4 bg-brand-sidebar border-b border-brand-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {/* File / Language Switcher */}
                <div className="flex items-center bg-brand-bg/70 p-0.5 rounded border border-brand-border">
                  <button
                    onClick={() => handleSwitchTemplate('App.tsx')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      currentFile === 'App.tsx'
                        ? 'bg-brand-accent text-white font-bold shadow-sm'
                        : 'text-brand-text-dim hover:text-brand-text'
                    }`}
                    title="React 18 + TypeScript TSX Component"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>App.tsx</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTemplate('index.html')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      currentFile === 'index.html'
                        ? 'bg-brand-accent text-white font-bold shadow-sm'
                        : 'text-brand-text-dim hover:text-brand-text'
                    }`}
                    title="Standard HTML5 Document"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span>index.html</span>
                  </button>
                </div>

                {/* Status Indicator */}
                {transpileError ? (
                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded hidden sm:inline-flex items-center gap-1">
                    ⚠️ Syntax Error
                  </span>
                ) : isReact ? (
                  <span className="text-[10px] font-medium text-cyan-400/90 hidden lg:inline-flex items-center gap-1">
                    ⚡ Babel Live TSX
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-400/90 hidden lg:inline-flex items-center gap-1">
                    ● HTML5 Live
                  </span>
                )}
              </div>

              {/* Editor Quick Actions */}
              <div className="flex items-center gap-1.5 md:gap-2">
                <button 
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-md text-xs font-semibold shadow-sm hover:shadow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-sidebar active:scale-95 cursor-pointer"
                  title="Paste from Clipboard"
                  aria-label="Paste code from clipboard"
                >
                  <span aria-hidden="true" className="text-xs">📋</span>
                  <span>Paste Code</span>
                </button>
                <button 
                  onClick={handleResetTemplate}
                  className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center hover:bg-brand-border/50 rounded transition-colors text-brand-text-dim hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-sidebar cursor-pointer"
                  title="Reset to Template"
                  aria-label="Reset code to default template"
                >
                  <RotateCcw size={16} />
                </button>
                <button 
                  onClick={handleCopy}
                  className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center hover:bg-brand-border/50 rounded transition-colors text-brand-text-dim hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-sidebar cursor-pointer"
                  title="Copy to Clipboard"
                  aria-label="Copy code to clipboard"
                >
                  {copied ? <Check size={16} className="text-brand-accent" /> : <Copy size={16} />}
                </button>
                <button 
                  onClick={handleClear}
                  className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center hover:bg-red-500/10 rounded transition-colors text-brand-text-dim hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-brand-sidebar cursor-pointer"
                  title="Clear Editor"
                  aria-label="Clear code editor"
                >
                  <Trash2 size={16} />
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
                placeholder={currentFile === 'App.tsx' ? '// Paste your React/TypeScript component here...' : '<!-- Paste your HTML here... -->'}
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
            {/* Preview Toolbar with Viewport Toggle Controls */}
            <div className="h-11 md:h-10 px-3 md:px-4 bg-brand-sidebar border-b border-brand-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-[11px] font-bold text-brand-text-dim uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Preview
                </span>
                <span className="text-[10px] font-mono text-brand-text-dim/80 hidden sm:inline-block">
                  ({viewport === 'mobile' ? '375 × 667' : viewport === 'tablet' ? '768 × 920' : '100% Fluid'})
                </span>
              </div>
              
              {/* Viewport Toggle Controls (Mobile, Tablet, Desktop) */}
              <div className="flex items-center gap-2">
                <div className="flex bg-brand-bg/80 p-0.5 rounded border border-brand-border items-center">
                  <button 
                    onClick={() => setViewport('mobile')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      viewport === 'mobile' 
                        ? 'bg-brand-accent text-white font-bold shadow-sm' 
                        : 'text-brand-text-dim hover:text-brand-text'
                    }`}
                    title="Mobile Viewport (375px)"
                    aria-label="Switch to Mobile Viewport (375px)"
                  >
                    <Smartphone size={14} />
                    <span className="hidden sm:inline text-[11px]">Mobile</span>
                  </button>
                  <button 
                    onClick={() => setViewport('tablet')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      viewport === 'tablet' 
                        ? 'bg-brand-accent text-white font-bold shadow-sm' 
                        : 'text-brand-text-dim hover:text-brand-text'
                    }`}
                    title="Tablet Viewport (768px)"
                    aria-label="Switch to Tablet Viewport (768px)"
                  >
                    <Tablet size={14} />
                    <span className="hidden sm:inline text-[11px]">Tablet</span>
                  </button>
                  <button 
                    onClick={() => setViewport('desktop')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      viewport === 'desktop' 
                        ? 'bg-brand-accent text-white font-bold shadow-sm' 
                        : 'text-brand-text-dim hover:text-brand-text'
                    }`}
                    title="Desktop Viewport (100% Fluid)"
                    aria-label="Switch to Desktop Viewport (100% Fluid)"
                  >
                    <Monitor size={14} />
                    <span className="hidden sm:inline text-[11px]">Desktop</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Isolated Preview Sandbox Container */}
            <div className={`flex-1 flex items-center justify-center overflow-auto bg-brand-bg ${viewMode === 'preview' ? 'p-0 md:p-6' : 'p-2 md:p-4'}`}>
              <div 
                className={`bg-white shadow-2xl transition-all duration-300 flex flex-col ${
                  viewport === 'mobile' && !isMobile
                    ? 'w-[375px] h-[667px] max-h-[calc(100%-20px)] rounded-2xl border-4 border-slate-700 overflow-hidden my-auto'
                    : viewport === 'tablet' && !isMobile
                      ? 'w-[768px] h-[920px] max-h-[calc(100%-20px)] rounded-2xl border-4 border-slate-700 overflow-hidden my-auto'
                      : 'w-full h-full rounded-sm overflow-hidden'
                }`}
              >
                {/* Device Frame Header Bar for Mobile/Tablet */}
                {(viewport === 'mobile' || viewport === 'tablet') && !isMobile && (
                  <div className="h-6 bg-slate-800 text-slate-400 px-3 flex items-center justify-between text-[10px] font-mono shrink-0 select-none border-b border-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {viewport === 'mobile' ? 'Mobile (375 × 667)' : 'Tablet (768 × 920)'}
                    </span>
                    <span className="text-slate-400">Sandbox Preview</span>
                  </div>
                )}
                
                {/* Isolated Preview Iframe */}
                <iframe
                  ref={iframeRef}
                  title="Isolated Responsive Preview Sandbox"
                  srcDoc={previewHtml}
                  className="w-full flex-1 border-none bg-white"
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
            {currentFile}
          </span>
          <span className="opacity-90">
            ● {isReact ? 'React 18 + TSX Live' : 'HTML5 Live Sync'}
          </span>
          <span className="opacity-75">
            Viewport: {viewport.toUpperCase()}
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
          <span>Babel Standalone</span>
          <span className="opacity-40">•</span>
          <span>Tailwind CSS</span>
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
