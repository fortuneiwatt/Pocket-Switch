"use client";

import { useState } from "react";
import { Converter } from "@/components/converter/Converter";
import { FileUpload } from "@/components/converter/FileUpload";
import { cn } from "@/lib/utils";

type Mode = "paste" | "file";

export function ConverterModeToggle() {
  const [mode, setMode] = useState<Mode>("paste");

  return (
    <div>
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-surface border border-border rounded-full p-1">
          <button
            onClick={() => setMode("paste")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-display font-medium transition-colors",
              mode === "paste"
                ? "bg-accent text-white"
                : "text-muted-lighter hover:text-foreground"
            )}
          >
            Paste code
          </button>
          <button
            onClick={() => setMode("file")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-display font-medium transition-colors",
              mode === "file"
                ? "bg-accent text-white"
                : "text-muted-lighter hover:text-foreground"
            )}
          >
            Upload file
          </button>
        </div>
      </div>

      {mode === "paste" ? <Converter /> : <FileUpload />}
    </div>
  );
}
