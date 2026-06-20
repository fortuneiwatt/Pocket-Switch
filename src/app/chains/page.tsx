import { ChainExplorer } from "@/components/ChainExplorer";

export default function ChainsPage() {
  return (
    <div className="px-6 py-12">
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1.5">
          Supported Chains
        </h1>
        <p className="text-muted-lighter text-sm">
          All blockchains available on Pocket Network. Click copy to grab
          the endpoint.
        </p>
      </div>
      <ChainExplorer />
    </div>
  );
}
