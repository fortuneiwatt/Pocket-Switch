"use client";

import { useState, useCallback, useRef } from "react";
import { replaceAllOccurrences, type FileConversionResult } from "@/lib/parser";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB — generous for .env/config files, guards against accidental huge uploads
const ACCEPTED_EXTENSIONS = [
  ".env",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".json",
  ".txt",
  ".yaml",
  ".yml",
  ".toml",
];

interface LoadedFile {
  name: string;
  size: number;
  content: string;
}

type UploadState = "idle" | "dragging" | "error" | "result";

export function FileUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [result, setResult] = useState<FileConversionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((rawFile: File) => {
    if (rawFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File is too large (${Math.round(
          rawFile.size / 1024
        )}KB). Max size is 1MB — this tool is built for config files, not entire codebases.`
      );
      setState("error");
      return;
    }

    const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((ext) =>
      rawFile.name.toLowerCase().endsWith(ext)
    );
    if (!hasAcceptedExtension) {
      setErrorMessage(
        `Unsupported file type. Try a .env, .js, .ts, .py, .json, or similar text-based config file.`
      );
      setState("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setFile({ name: rawFile.name, size: rawFile.size, content });

      const conversionResult = replaceAllOccurrences(content);
      if (conversionResult.replacementCount === 0) {
        setErrorMessage(
          "No Infura, Alchemy, or QuickNode URLs were found in this file."
        );
        setState("error");
        return;
      }

      setResult(conversionResult);
      setState("result");
    };
    reader.onerror = () => {
      setErrorMessage("Couldn't read that file. Make sure it's a text file.");
      setState("error");
    };
    reader.readAsText(rawFile);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setState("idle");
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  }

  function handleDownload() {
    if (!result || !file) return;
    const blob = new Blob([result.convertedContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name; // same filename — ready to drop back into the project
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.convertedContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function reset() {
    setFile(null);
    setResult(null);
    setErrorMessage(null);
    setState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="max-w-3xl mx-auto">
      {state !== "result" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setState("dragging");
          }}
          onDragLeave={() => setState("idle")}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl px-6 py-12 text-center cursor-pointer transition-colors",
            state === "dragging"
              ? "border-accent bg-accent-soft/20"
              : state === "error"
              ? "border-danger/40 bg-danger/5"
              : "border-border hover:border-border-hover bg-surface"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="text-3xl mb-3">📄</div>
          <p className="font-display text-sm font-semibold text-foreground mb-1">
            Drop a config file here, or click to browse
          </p>
          <p className="text-xs text-muted">
            .env, .js, .ts, .py, .json — converts every Infura/Alchemy URL
            found inside
          </p>

          {state === "error" && errorMessage && (
            <p className="mt-4 text-sm text-danger font-medium">
              {errorMessage}
            </p>
          )}
        </div>
      )}

      {state === "result" && result && file && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-success-border bg-success-bg">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-success/15 flex items-center justify-center text-sm flex-shrink-0">
                ✓
              </div>
              <div>
                <div className="font-display text-sm font-semibold text-success-text">
                  {result.replacementCount} URL
                  {result.replacementCount !== 1 ? "s" : ""} converted in{" "}
                  {file.name}
                </div>
                <div className="text-[11px] text-success-text/70">
                  {result.chainsFound.map((c) => c.chain.name).join(", ")}
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs text-success-text/70 hover:text-success-text font-display"
            >
              Upload another
            </button>
          </div>

          <div className="px-5 py-5 max-h-80 overflow-y-auto">
            <pre className="font-mono-code text-[12px] text-foreground/80 whitespace-pre-wrap break-all leading-relaxed">
              {result.convertedContent}
            </pre>
          </div>

          <div className="flex gap-3 px-5 py-3.5 border-t border-border bg-surface-raised">
            <button
              onClick={handleDownload}
              className="flex-1 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-display font-semibold transition-colors"
            >
              ↓ Download converted file
            </button>
            <button
              onClick={handleCopy}
              className={cn(
                "px-4 py-2.5 rounded-lg text-sm font-display font-medium border transition-colors",
                copied
                  ? "bg-success-bg border-success-border text-success-text"
                  : "border-border-hover text-muted-lighter hover:text-foreground"
              )}
            >
              {copied ? "Copied" : "Copy text"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
