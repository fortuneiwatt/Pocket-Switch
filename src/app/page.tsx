import { Converter } from "@/components/converter/Converter";

export default function Home() {
  return (
    <>
      <section className="text-center max-w-2xl mx-auto px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 bg-surface border border-accent-soft rounded-full px-3.5 py-1.5 text-xs text-accent-text font-display mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse" />
          60+ blockchains · No API key · Free forever
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
          Switch to <span className="text-accent">Pocket</span>
          <br />
          in 60 seconds
        </h1>
        <p className="text-muted-lighter text-base leading-relaxed max-w-md mx-auto">
          Paste your Infura or Alchemy URL or code snippet. Get the exact
          Pocket Network replacement for your framework — ready to copy and
          paste.
        </p>
      </section>

      <Converter />
    </>
  );
}
