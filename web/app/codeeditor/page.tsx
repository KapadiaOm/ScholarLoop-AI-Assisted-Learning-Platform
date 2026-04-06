"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Sparkles,
  Code2,
  Terminal,
  Loader2,
  Copy,
  Check,
  Trash2,
  Download,
  Zap,
  FileCode,
  Keyboard,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

// Language definitions
const LANGUAGES = [
  { id: "python", label: "Python", icon: "🐍", ext: ".py", color: "#3572A5" },
  { id: "java", label: "Java", icon: "☕", ext: ".java", color: "#B07219" },
  { id: "c", label: "C", icon: "⚙️", ext: ".c", color: "#555555" },
  { id: "cpp", label: "C++", icon: "⚡", ext: ".cpp", color: "#F34B7D" },
] as const;

type LangId = (typeof LANGUAGES)[number]["id"];

const DEFAULT_CODE: Record<LangId, string> = {
  python: `# Write your Python code here\nprint("Hello, World!")`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
};

export default function CodeEditorPage() {
  const [language, setLanguage] = useState<LangId>("python");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stdinInput, setStdinInput] = useState("");
  const [lineCount, setLineCount] = useState(1);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLineCount(code.split("\n").length);
  }, [code]);

  const handleEditorScroll = useCallback(() => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleLanguageChange = (langId: LangId) => {
    setLanguage(langId);
    setCode(DEFAULT_CODE[langId]);
    setOutput("");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setOutput("");
    try {
      const res = await fetch(apiUrl("/api/v1/codeeditor/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), language }),
      });
      if (!res.ok) {
        const err = await res.json();
        setOutput(`❌ Generation Error: ${err.detail || "Unknown error"}`);
        return;
      }
      const data = await res.json();
      setCode(data.code);
    } catch (e: any) {
      setOutput(`❌ Network Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("⏳ Running...\n");
    try {
      const res = await fetch(apiUrl("/api/v1/codeeditor/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, stdin_input: stdinInput }),
      });
      const data = await res.json();
      let result = "";
      if (data.stdout) result += data.stdout;
      if (data.stderr) result += (result ? "\n" : "") + "⚠️ " + data.stderr;
      if (data.error) result += (result ? "\n" : "") + "❌ " + data.error;
      if (!result.trim()) result = "✅ Program finished with no output.";
      result += `\n\n[exit code: ${data.return_code}]`;
      setOutput(result);
    } catch (e: any) {
      setOutput(`❌ Network Error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setCode(DEFAULT_CODE[language]);
    setOutput("");
  };

  const handleDownload = () => {
    const lang = LANGUAGES.find((l) => l.id === language)!;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code${lang.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentLang = LANGUAGES.find((l) => l.id === language)!;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0a0e1a] text-slate-800 dark:text-white overflow-hidden transition-colors duration-300">
      {/* ─── Top Header ─── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0d1225] flex-shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${currentLang.color}88, ${currentLang.color}44)`,
              boxShadow: `0 0 20px ${currentLang.color}22`,
            }}
          >
            <Code2 className="w-4 h-4 text-white/90" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-800 dark:text-white/90 tracking-wide">
              Code Studio
            </h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-white/[0.04] border border-indigo-100 dark:border-white/[0.06]">
              <Zap className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
              <span className="text-[10px] text-indigo-600 dark:text-slate-400 font-medium">AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Language + Run Controls */}
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LangId)}
            className="appearance-none pl-3 pr-7 py-1.5 rounded-md bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-white/80 cursor-pointer focus:outline-none hover:bg-slate-50 dark:hover:bg-white/[0.1] transition-all"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 6px center",
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08]" />

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-all disabled:opacity-40 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] shadow-sm"
          >
            {isRunning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {isRunning ? "Running" : "Run"}
          </button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ─── Left Panel — AI Prompt ─── */}
        <div className="w-[340px] border-r border-slate-200 dark:border-white/[0.06] flex flex-col bg-slate-50/50 dark:bg-[#0b1020] flex-shrink-0 transition-colors">
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-violet-500 dark:text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
                AI Assistant
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            {/* Prompt Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe the ${currentLang.label} program you want...`}
                className="min-h-[160px] rounded-lg bg-white dark:bg-[#111733] border border-slate-200 dark:border-white/[0.06] p-3 text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none focus:outline-none focus:border-indigo-400 dark:focus:border-violet-500/40 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-0 transition-all leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleGenerate();
                  }
                }}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[13px] text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-indigo-600 dark:bg-violet-600 hover:bg-indigo-500 dark:hover:bg-violet-500 active:scale-[0.98] shadow-md shadow-indigo-500/20 dark:shadow-violet-900/30"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Code
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-600">
              <Keyboard className="w-3 h-3" />
              <span>Ctrl + Enter</span>
            </div>

            {/* Stdin Section */}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/[0.04]">
              <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Input (stdin)
              </label>
              <textarea
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                placeholder="Program input..."
                className="w-full mt-2 h-16 rounded-lg bg-white dark:bg-[#111733] border border-slate-200 dark:border-white/[0.06] p-2.5 text-xs text-slate-600 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-700 resize-none focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500/30 transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* ─── Right Panel — Editor + Output ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Tab Bar */}
          <div className="flex items-center justify-between px-1 py-0 border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-[#0c1020] transition-colors">
            {/* File Tab */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-indigo-500 dark:border-violet-500/70 bg-white/60 dark:bg-white/[0.02]">
                <FileCode className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium font-mono">
                  main{currentLang.ext}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-600 font-mono ml-1">
                  {code.split("\n").length}L
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 pr-2">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-white/[0.05] text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Reset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="flex-1 flex overflow-hidden min-h-0 relative bg-white dark:bg-[#0f1628] transition-colors">
            {/* Line Numbers Gutter */}
            <div
              ref={lineNumbersRef}
              className="w-14 flex-shrink-0 overflow-hidden border-r border-slate-100 dark:border-white/[0.04] select-none bg-slate-50/80 dark:bg-[#0c1222]"
            >
              <div className="py-3 text-right pr-4">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div
                    key={i}
                    className="text-[11px] leading-[1.6rem] text-slate-300 dark:text-slate-700 font-mono"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Textarea */}
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleEditorScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 bg-transparent py-3 px-4 text-[13px] text-slate-800 dark:text-sky-300/90 font-mono resize-none focus:outline-none leading-[1.6rem] overflow-auto"
              style={{
                tabSize: 4,
                caretColor: "#6366f1",
              }}
            />

            {/* Generating Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#0a0e1a]/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white dark:bg-[#111733]/90 border border-slate-200 dark:border-white/[0.06] shadow-lg dark:shadow-none">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-violet-500/10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-500 dark:text-violet-400 animate-spin" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Generating {currentLang.label} code...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ─── Output Console ─── */}
          <div className="h-44 border-t border-slate-200 dark:border-white/[0.06] flex flex-col bg-slate-50 dark:bg-[#080c16] flex-shrink-0 transition-colors">
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#0a0f1d]">
              <Terminal className="w-3 h-3 text-slate-400 dark:text-slate-600" />
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Output
              </span>
              {isRunning && (
                <Loader2 className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400 animate-spin ml-auto" />
              )}
              {!isRunning && output && (
                <span className="ml-auto text-[9px] text-slate-400 dark:text-slate-600 font-mono">
                  {output.includes("exit code: 0") ? "✓ success" : "✗ error"}
                </span>
              )}
            </div>
            <pre className="flex-1 px-4 py-3 text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-auto whitespace-pre-wrap leading-relaxed">
              {output || (
                <span className="text-slate-400 dark:text-slate-700 italic">
                  Press Run to execute your code...
                </span>
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
