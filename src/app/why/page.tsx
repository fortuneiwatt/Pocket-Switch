import { cn } from "@/lib/utils";

type RowValue = { text: string; tone: "yes" | "no" | "neutral" };

interface CompareCard {
  name: string;
  tag: string;
  featured?: boolean;
  rows: { label: string; value: RowValue }[];
}

const CARDS: CompareCard[] = [
  {
    name: "Infura",
    tag: "ConsenSys · Est. 2016",
    rows: [
      { label: "API Key", value: { text: "Required", tone: "no" } },
      { label: "Centralized", value: { text: "Yes", tone: "no" } },
      { label: "Censorship risk", value: { text: "Proven", tone: "no" } },
      {
        label: "Free limit",
        value: { text: "3M credits/day", tone: "neutral" },
      },
      { label: "Paid from", value: { text: "$225/mo", tone: "neutral" } },
      { label: "Chains", value: { text: "~20", tone: "neutral" } },
      { label: "Open source", value: { text: "No", tone: "no" } },
    ],
  },
  {
    name: "Alchemy",
    tag: "Independent · Est. 2019",
    rows: [
      { label: "API Key", value: { text: "Required", tone: "no" } },
      { label: "Centralized", value: { text: "Yes", tone: "no" } },
      { label: "Censorship risk", value: { text: "Yes", tone: "no" } },
      {
        label: "Free limit",
        value: { text: "30M CU/mo", tone: "neutral" },
      },
      { label: "Paid from", value: { text: "$49/mo", tone: "neutral" } },
      { label: "Chains", value: { text: "~25", tone: "neutral" } },
      { label: "Open source", value: { text: "No", tone: "no" } },
    ],
  },
  {
    name: "Pocket Network",
    tag: "Decentralized · Est. 2017",
    featured: true,
    rows: [
      { label: "API Key", value: { text: "Not needed", tone: "yes" } },
      { label: "Centralized", value: { text: "No", tone: "yes" } },
      { label: "Censorship risk", value: { text: "None", tone: "yes" } },
      {
        label: "Free limit",
        value: { text: "Unlimited public", tone: "yes" },
      },
      { label: "Paid from", value: { text: "Free", tone: "yes" } },
      { label: "Chains", value: { text: "60+", tone: "yes" } },
      { label: "Open source", value: { text: "Yes", tone: "yes" } },
    ],
  },
];

const TONE_CLASS: Record<RowValue["tone"], string> = {
  yes: "text-success-text",
  no: "text-danger",
  neutral: "text-muted-lighter",
};

export default function WhyPage() {
  return (
    <div className="px-6 py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-white mb-1.5">
        Why switch?
      </h1>
      <p className="text-muted-lighter text-sm mb-10">
        The facts, plainly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {CARDS.map((card) => (
          <div
            key={card.name}
            className={cn(
              "bg-surface border rounded-2xl overflow-hidden",
              card.featured ? "border-accent-soft" : "border-border"
            )}
          >
            <div className="px-5 pt-5 pb-4 border-b border-border">
              {card.featured && (
                <span className="inline-block bg-accent-soft text-accent-text text-[10px] font-display font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide mb-2">
                  Recommended
                </span>
              )}
              <div className="font-display text-lg font-bold text-foreground mb-0.5">
                {card.name}
              </div>
              <div className="text-[11px] text-muted font-display">
                {card.tag}
              </div>
            </div>
            <div className="py-1">
              {card.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-5 py-2.5 border-b border-surface-raised last:border-none"
                >
                  <span className="text-[13px] text-muted-light">
                    {row.label}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-display font-medium",
                      TONE_CLASS[row.value.tone]
                    )}
                  >
                    {row.value.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 text-sm text-muted-lighter leading-relaxed max-w-2xl">
        <p>
          Infura and Alchemy both route every request through a single
          company&apos;s servers. That means one outage, one policy change,
          or one government order can affect every app relying on them — this
          has already happened. Infura blocked access for users in
          sanctioned regions, and a 2020 Infura outage broke MetaMask for a
          large share of its users simultaneously.
        </p>
        <p>
          Pocket Network routes the same JSON-RPC requests through 5,000+
          independent node operators with no single owner. There&apos;s no
          API key to create, no account to sign up for, and no company that
          can block your traffic.
        </p>
        <p>
          The technology has always been better. Pocket Switch just removes
          the friction of actually making the change — paste your existing
          code, copy the replacement, done.
        </p>
      </div>
    </div>
  );
}
