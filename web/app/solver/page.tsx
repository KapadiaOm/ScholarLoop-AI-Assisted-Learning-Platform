"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Calculator, Bot, User, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { apiUrl } from "@/lib/api";
import { processLatexContent } from "@/lib/latex";
import { getTranslation } from "@/lib/i18n";
import { useGlobal } from "@/context/GlobalContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLE_PROBLEMS = [
  "Solve ∫ x² sin(x) dx",
  "Find dy/dx if y = e^(3x) · ln(x)",
  "Prove A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)",
  "Solve the ODE: dy/dx + 2y = e^(-x)",
  "Find eigenvalues of [[3,1],[0,2]]",
  "Evaluate lim (x→0) sin(x)/x",
];

export default function SmartSolverPage() {
  const { uiSettings } = useGlobal();
  const t = (key: string) => getTranslation(uiSettings.language, key);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "56px";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = Math.min(scrollHeight, 180) + "px";
    }
  }, [input]);

  const handleSend = async (overrideInput?: string) => {
    const question = (overrideInput || input).trim();
    if (!question || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    try {
      // Build history for context (last 6 messages)
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(apiUrl("/api/v1/solve/direct"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "No solution was returned." },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Error:** ${err.message || "Failed to connect to the solver. Please check if the backend is running."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setIsLoading(false);
    setInput("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0c1222] animate-fade-in">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t("Smart Solver")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Calculus • Algebra • Sets • ODEs • Physics • Step-by-step solutions
              </p>
            </div>
          </div>
          {hasMessages && (
            <button
              onClick={clearChat}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {!hasMessages ? (
            /* Empty state with example problems */
            <div className="flex flex-col items-center justify-center min-h-[55vh]">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                What would you like to solve?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-center max-w-lg mb-10 leading-relaxed">
                I can solve derivatives, integrals, differential equations, set theory proofs, 
                matrix operations, physics problems, and any technical question — step by step.
              </p>

              {/* Example problems grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {EXAMPLE_PROBLEMS.map((problem, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(problem)}
                    className="text-left px-4 py-3 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/5 transition-all group text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {problem}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6 pb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-600/20"
                        : "bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-h2:text-lg prose-h3:text-base prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-strong:text-slate-900 dark:prose-strong:text-white">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                        >
                          {processLatexContent(msg.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">
                      Solving step-by-step...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} className="h-2" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-6 py-4 bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your math problem or technical question here..."
            className="w-full pl-5 pr-14 py-4 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition-all min-h-[56px] text-[15px] leading-relaxed"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-blue-600 active:scale-95 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
