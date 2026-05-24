"use client";

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ChevronLeft, Upload, Copy, Check, Sparkles, Bold, Italic, Code, Link as LinkIcon, Quote, Image as ImageIcon, Heading1, Heading2, Eye, Layout, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

// Heuristic-based language detector for code blocks
function detectLanguage(code: string): string {
  const trimmed = code.trim();
  
  if (/package\s+\w+/.test(trimmed) && /import\s*\(|import\s+"/.test(trimmed)) return 'go';
  if (/func\s+\w+\(/.test(trimmed) && (/:=/.test(trimmed) || /struct\s*\{/.test(trimmed))) return 'go';
  
  if (/fn\s+\w+\(/.test(trimmed) && (/(let\s+mut|match\s+|impl\s+|pub\s+struct)/.test(trimmed) || /println!/.test(trimmed))) return 'rust';
  if (/use\s+std::/.test(trimmed) || /cargo\s+/.test(trimmed)) return 'rust';

  if (/#include\s+<\w+>/.test(trimmed) || /std::cout/.test(trimmed) || /int\s+main\s*\(/.test(trimmed)) return 'cpp';

  if (/def\s+\w+\(/.test(trimmed) && (/:$/m.test(trimmed) || /self\./.test(trimmed) || /import\s+\w+/.test(trimmed))) {
    if (!/function|const|let|var/.test(trimmed)) return 'python';
  }
  if (/elif\s+/.test(trimmed) || /import\s+numpy|import\s+pandas/.test(trimmed)) return 'python';

  if (/<!DOCTYPE\s+html>/i.test(trimmed) || (/<div|<p|<html|<body|<script/i.test(trimmed) && !/import|const|let/.test(trimmed))) return 'html';

  if (/^[.#]?\w+[\s,]*\{[^}]*\}/m.test(trimmed) && (/:[ \w-]+;/i.test(trimmed) || /color:|background:|margin:/i.test(trimmed))) return 'css';

  if (/import\s+.*\s+from\s+['"].*['"]/.test(trimmed) || /const\s+\w+\s*=/.test(trimmed) || /let\s+\w+\s*=/.test(trimmed) || /console\.log\(/.test(trimmed) || /export\s+default\s+/.test(trimmed)) {
    if (/:\s*(string|number|boolean|any|interface|type)\b/.test(trimmed) || /as\s+\w+/.test(trimmed)) {
      return 'typescript';
    }
    return 'javascript';
  }

  if (/^(npm|yarn|pnpm|pip|cargo|git|cd|mkdir|rm|ls|echo|curl|wget)\s/m.test(trimmed) || trimmed.startsWith('$ ')) return 'bash';

  return 'text';
}

const SUPPORTED_LANGUAGES = [
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'text', label: 'Plain Text' }
];

// Custom code block renderer with editable language select dropdown and copy button
function CustomCodeBlock({ children, initialLang }: { children: string; initialLang: string }) {
  const [selectedLang, setSelectedLang] = useState(initialLang);
  const [copied, setCopied] = useState(false);

  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-card-border shadow-2xl bg-[#0d0d0d] text-neutral-300">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-card-border font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 text-[11px] uppercase tracking-wider">Language:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-transparent text-neutral-300 hover:text-white border-0 py-0.5 px-1 font-medium font-mono focus:ring-0 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-[#111] text-neutral-300">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Highlighted Code */}
      <SyntaxHighlighter
        language={selectedLang}
        style={vscDarkPlus}
        PreTag="div"
        codeTagProps={{
          style: {
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.6'
          }
        }}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: 'transparent'
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export default function ConverterClient() {
  const [markdown, setMarkdown] = useState("");
  const [layoutMode, setLayoutMode] = useState<"edit" | "preview" | "split">("split");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Draft Saved");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("pawan_blog_draft");
    if (savedDraft) {
      setMarkdown(savedDraft);
    }
  }, []);

  // Autosave draft to LocalStorage
  useEffect(() => {
    setIsSaving(true);
    const timeout = setTimeout(() => {
      localStorage.setItem("pawan_blog_draft", markdown);
      setIsSaving(false);
      setSaveStatus("Saved locally");
    }, 600);

    return () => clearTimeout(timeout);
  }, [markdown]);

  // Read stats from markdown
  const wordCount = markdown.trim() === "" ? 0 : markdown.trim().split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMarkdown(String(event.target.result));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Check if dropping a markdown file or image files
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type.startsWith("image/") || file.name.endsWith(".svg")) {
        insertImageFile(file);
      } else {
        processFile(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Insert markdown syntax helper
  const insertMarkdown = (syntaxBefore: string, syntaxAfter: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    const replacement = syntaxBefore + selectedText + syntaxAfter;
    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    
    setMarkdown(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxBefore.length, start + syntaxBefore.length + selectedText.length);
    }, 0);
  };

  // Convert image/svg file to object URL and insert in markdown
  const insertImageFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const imageMarkdown = `\n![${file.name}](${url})\n`;
    
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = textarea.value;
      
      const newText = currentText.substring(0, start) + imageMarkdown + currentText.substring(end);
      setMarkdown(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
      }, 0);
    } else {
      setMarkdown((prev) => prev + imageMarkdown);
    }
  };

  // Textarea paste handler to support pasting image files
  const handlePaste = (e: any) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1 || items[i].name?.endsWith(".svg")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          insertImageFile(file);
        }
      }
    }
  };

  // Textarea drag-over logic for direct dropping
  const handleTextareaDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.name.endsWith(".svg"))) {
      e.preventDefault();
      insertImageFile(file);
    }
  };

  return (
    <div className={`w-full mx-auto pb-10 flex flex-col ${layoutMode === "split" ? "max-w-[100%] px-4" : "max-w-[700px] px-0"}`}>
      {/* Top Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-card-border pb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="p-1.5 rounded-lg border border-card-border hover:bg-pill-bg text-muted hover:text-foreground transition-all"
            title="Back to home"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              Draft Writer <span className="text-[9px] px-2 py-0.5 bg-pill-bg border border-pill-border text-muted font-mono rounded-full font-normal uppercase tracking-widest">Client-Only</span>
            </h1>
            {/* Autosave badge */}
            <div className="flex items-center gap-1.5 text-xs text-muted font-mono mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
              <span>{isSaving ? "saving..." : saveStatus}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Stats badge */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-muted border border-card-border px-3 py-1.5 rounded-lg bg-card-bg/20">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
            <span>{readTime} min read</span>
          </div>

          {/* Segmented Layout Selector */}
          <div className="flex border border-card-border rounded-lg overflow-hidden bg-card-bg/30 p-0.5">
            <button
              onClick={() => setLayoutMode("edit")}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                layoutMode === "edit" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setLayoutMode("split")}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                layoutMode === "split" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setLayoutMode("preview")}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                layoutMode === "preview" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Preview containers */}
      <div className={`w-full flex ${layoutMode === "split" ? "flex-col md:flex-row gap-6 h-[calc(100vh-170px)]" : "flex-col"}`}>
        
        {/* Editor Column */}
        {(layoutMode === "edit" || layoutMode === "split") && (
          <div className={`flex flex-col flex-1 ${layoutMode === "split" ? "h-full min-w-0" : ""}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border border-card-border bg-card-bg/40 p-1.5 rounded-t-xl select-none">
              <button
                onClick={() => insertMarkdown("**", "**")}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown("*", "*")}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown("# ")}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown("## ")}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown("[text](", ")")}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown("> ")}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Blockquote"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertMarkdown("```\n", "\n```")}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Code Block"
              >
                <Code className="w-4 h-4" />
              </button>
              
              <div className="w-[1px] h-4 bg-card-border mx-1" />
              
              {/* Upload image button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded hover:bg-pill-bg text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Upload Image/SVG"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              
              {/* Clear draft */}
              {markdown && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to clear this draft?")) {
                      setMarkdown("");
                    }
                  }}
                  className="p-1.5 rounded hover:bg-pill-bg text-red-500 hover:text-red-400 transition-colors cursor-pointer ml-auto"
                  title="Clear Draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type.startsWith("image/") || file.name.endsWith(".svg")) {
                    insertImageFile(file);
                  } else {
                    processFile(file);
                  }
                }
              }}
              accept=".md,.txt,.markdown,image/*,.svg"
              className="hidden"
            />

            {/* Drag Zone Drop Area wrapper */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex-1 flex flex-col min-h-[250px] relative"
            >
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onPaste={handlePaste}
                onDrop={handleTextareaDrop}
                placeholder="# Setup your blog draft here...&#10;&#10;Drag and drop images, SVGs, or markdown files directly into this area! Use the toolbar above to style your content."
                className={`w-full flex-1 p-4 rounded-b-xl border border-t-0 border-card-border bg-card-bg/20 text-foreground font-mono text-sm focus:outline-none focus:border-card-border transition-all resize-none leading-relaxed ${
                  layoutMode === "split" ? "h-full" : "h-[450px]"
                }`}
              />

              {/* Drag Over Overlay */}
              {isDragOver && (
                <div className="absolute inset-0 bg-background/80 border-2 border-dashed border-foreground rounded-b-xl flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-30">
                  <div className="p-3 rounded-full bg-pill-bg border border-pill-border">
                    <Upload className="w-6 h-6 text-foreground animate-bounce" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Drop your markdown file, image, or SVG to insert!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Column */}
        {(layoutMode === "preview" || layoutMode === "split") && (
          <div 
            className={`flex-1 overflow-y-auto min-w-0 ${
              layoutMode === "split" 
                ? "h-full border border-card-border rounded-xl p-6 bg-card-bg/5" 
                : "border-t border-card-border pt-10"
            }`}
          >
            {/* Split Screen Header */}
            {layoutMode === "split" && (
              <div className="flex items-center gap-2 mb-6 border-b border-card-border pb-3 text-xs font-mono text-muted uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-muted" />
                <span>Live Rendering Preview</span>
              </div>
            )}

            <div className="blog-content prose max-w-none">
              {markdown.trim() === "" ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted font-mono text-sm gap-2">
                  <Sparkles className="w-5 h-5 text-neutral-600" />
                  <span>Preview is empty. Start typing to see it render beautifully!</span>
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-[26px] md:text-[32px] font-semibold text-foreground mt-8 mb-4 tracking-tight leading-tight" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-[18px] md:text-[21px] font-semibold text-foreground mt-8 mb-4 tracking-tight" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-[15px] md:text-[17px] font-semibold text-foreground mt-6 mb-3 tracking-tight" {...props} />,
                    p: ({node, ...props}) => <p className="text-muted leading-relaxed text-[15px] mb-5 tracking-tight" {...props} />,
                    li: ({node, ...props}) => <li className="text-muted leading-relaxed text-[15px] mb-2 list-none flex gap-3"><span className="text-neutral-500 mt-1.5 text-xs">•</span><span {...props} /></li>,
                    code: ({node, className, children, ...props}: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isBlock = !!match || String(children).includes('\n') || String(children).length > 60;
                      
                      if (!isBlock) {
                        return (
                          <code 
                            className="inline px-1.5 py-0.5 rounded bg-pill-bg text-foreground text-[0.9em] border border-pill-border font-mono align-baseline mx-0.5" 
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      const initialDetectedLang = match ? match[1] : detectLanguage(String(children));
                      return (
                        <CustomCodeBlock initialLang={initialDetectedLang}>
                          {children}
                        </CustomCodeBlock>
                      );
                    },
                    blockquote: ({node, ...props}) => (
                      <blockquote className="my-6 p-5 rounded-2xl bg-pill-bg border border-pill-border relative overflow-hidden group" {...props}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-muted" />
                        <div className="text-[15px] text-foreground italic leading-relaxed relative z-10" />
                      </blockquote>
                    ),
                    hr: ({node, ...props}) => <hr className="my-8 border-card-border" {...props} />,
                    img: ({node, ...props}: any) => (
                      <div className="my-6 rounded-2xl overflow-hidden border border-card-border bg-pill-bg p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="w-full object-contain max-h-[400px] rounded-xl" {...props} alt={props.alt || "blog image"} />
                      </div>
                    ),
                    a: ({node, ...props}: any) => (
                      <a className="text-foreground underline decoration-dotted underline-offset-4 decoration-muted hover:text-accent transition-colors" {...props} />
                    )
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
