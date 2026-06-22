# Pocket Switch — Project Documentation

*Maintained throughout the Built On Pocket Hackathon. Last updated: Week 2.*

---

## Project Name

**Pocket Switch**

## Team

**Team Argentina**


## Problem Statement

Most Web3 developers default to centralized RPC providers — Infura and
Alchemy — for blockchain data access, not because they're technically
superior, but because they're the default everyone already uses. This
creates real, documented risk:

- **Single points of failure.** Infura's 2020 outage broke MetaMask for a
  large share of its users simultaneously, because one company's
  infrastructure failure cascaded across the ecosystem.
- **Censorship exposure.** Infura blocked access for users in sanctioned
  regions (Venezuela, Iran, Syria, Cuba) in 2022 — apps stopped working
  overnight with no warning, purely due to centralized control.
- **Account and API key friction.** Both require signup, key management,
  and are subject to rate limits and pricing changes outside the
  developer's control.

Pocket Network solves the underlying infrastructure problem — a
decentralized network of 5,000+ independent node operators serving 60+
chains, with no API key and no single point of failure. **The technology
gap isn't the barrier. The migration friction is.** Developers with
existing Infura/Alchemy code have no fast, reliable way to convert it to
Pocket's equivalent, so most never bother.

## Solution Overview

**Pocket Switch is a converter tool that closes that gap directly.** A
developer pastes their existing Infura or Alchemy RPC URL — or a full code
snippet using it — and the tool:

1. Detects which provider and which blockchain the input belongs to
2. Generates the exact Pocket Network replacement, correctly formatted for
   their framework (ethers.js, viem, wagmi, web3.py, or curl)
3. Provides a one-click copy so they can paste it straight into their
   project

No documentation reading, no account creation, no guessing Pocket's URL
pattern. The entire detection and code generation runs client-side in the
browser — no server calls, no logging of pasted input or API keys.

The project also includes a **Chain Explorer** (searchable directory of
every Pocket-supported chain with its endpoint) and a **Why Switch?** page
(a sourced, honest comparison of Infura vs Alchemy vs Pocket).

## Target Users

- **Primary:** Web3 developers currently using Infura or Alchemy who are
  open to switching but have been blocked by migration friction
- **Secondary:** Developers starting a new project who haven't committed
  to a provider yet — the Chain Explorer and framework-ready code snippets
  make Pocket the easiest first choice
- **Tertiary:** Technical decision-makers (founders, leads) evaluating RPC
  infrastructure options who want an honest, fact-based comparison

---

## How This Project Uses Pocket Network

This is the core of the project — Pocket Network isn't a peripheral
integration, it's the entire output of the tool.

### Where Pocket RPC is used

Every chain in the project's data layer (`src/lib/chains.json`) maps
directly to a real, live Pocket Network endpoint following Pocket's
official public RPC pattern:

```
https://{chain-slug}.api.pocket.network
```

For example:
- Ethereum → `https://eth.api.pocket.network`
- Polygon → `https://poly.api.pocket.network`
- Arbitrum → `https://arb-one.api.pocket.network`
- Base → `https://base.api.pocket.network`

These are the **literal endpoints generated as output** every time a
developer uses the converter. The tool's entire purpose is to produce
correct Pocket Network RPC URLs and working code that calls them.

### Why Pocket is required

Pocket Network's no-API-key, decentralized public endpoint
(`api.pocket.network`) is what makes the "60 seconds" claim possible at
all. If the target were another centralized provider, the tool would just
be moving a developer from one account-gated, centralized service to
another — solving nothing. Pocket's architecture (5,000+ independent node
operators, no signup, no API key) is the *only* reason this migration can
be frictionless. The project's value proposition is structurally dependent
on Pocket's specific decentralized model — not just any RPC provider.

### Relevant code references

- `src/lib/chains.json` — the canonical mapping of every supported chain to
  its real Pocket Network endpoint, sourced from
  [docs.pocket.network/developers/supported-chains](https://docs.pocket.network/developers/supported-chains)
- `src/lib/generator.ts` — generates framework-specific code (ethers.js,
  viem, wagmi, web3.py, curl) that calls the Pocket endpoint directly,
  matching Pocket's documented integration examples
- `src/lib/parser.ts` — detection engine that identifies the source
  provider/chain so the correct Pocket endpoint can be generated

Example generated output (Ethereum, ethers.js):
```javascript
import { JsonRpcProvider } from "ethers";
const provider = new JsonRpcProvider("https://eth.api.pocket.network");
const blockNumber = await provider.getBlockNumber();
```

### How the project would be impacted without Pocket

Without Pocket Network, this project has no reason to exist. There would
be no destination endpoint to convert *to* — the entire premise is
migrating developers onto Pocket's specific decentralized, no-API-key
infrastructure. Every piece of generated output, every chain in the
explorer, and every comparison on the "Why Switch?" page is built entirely
around Pocket's actual public RPC service.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (React, App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Syntax highlighting | Shiki |
| Testing | Vitest |
| Deployment | Render |
| AI-assisted development | Claude (Anthropic), Cursor AI |

**AI Usage Disclosure:** Built with AI assistance for code generation,
architecture planning, debugging, and chain-pattern research, consistent
with the hackathon's stated rules permitting AI-assisted development. All
chain data and provider URL patterns were cross-checked against official
Pocket Network and Infura documentation rather than AI-generated guesses —
see `COVERAGE.md` for the verification methodology.

---

## Repository & Demo Links

- **GitHub:** `https://github.com/fortuneiwatt/pocket-switch` *(public)*
- **Live demo:** [pocket-switch.onrender.com](https://pocket-switch.onrender.com/)

---

## Pre-Existing Work Disclosure

**100% of this project was started and built during the Built On Pocket
Hackathon timeline (June 8 onward).** No pre-existing code, repository, or
prior version of this tool existed before the event. Planning and chain
data research began in the lead-up to registration, but no application
code was written before Week 1.

---

## Weekly Progress Updates

### Week 1 (June 8–14) — Planning
- Finalized project concept: Infura/Alchemy → Pocket Network converter
- Researched and built initial `chains.json` data file covering 60+ chains
  with verified Pocket Network endpoints
- Scaffolded Next.js 14 + TypeScript + Tailwind project structure
- Submitted Week 1 proposal

### Week 2 (June 15–21) — MVP
- Built core detection engine (`parser.ts`) — identifies Infura/Alchemy
  provider and chain from pasted URLs or code snippets
- Built code generator (`generator.ts`) — produces correct, working code
  for 5 frameworks (ethers.js, viem, wagmi, web3.py, curl)
- Built the Converter UI, Chain Explorer page, and Why Switch comparison
  page
- **Expanded and verified provider detection coverage** from ~10 to 25 of
  55 mainnet chains, sourcing every pattern directly from official
  Infura/MetaMask documentation rather than guessing
- **Found and fixed a real detection bug**: an overly broad Ethereum
  pattern was silently misdetecting other Infura chains (Arbitrum,
  Base, Avalanche, etc.) as Ethereum. Fixed via pattern correction and a
  longest-match-wins algorithm change in the parser
- Added an automated test suite (Vitest, 11 passing tests) including a
  general collision-detection test across all chain data to prevent this
  bug class from recurring
- Documented detection coverage honestly in `COVERAGE.md`, distinguishing
  verified-working chains from listed-but-undetectable ones
- **Deployed live to Render**: [pocket-switch.onrender.com](https://pocket-switch.onrender.com/)
  — verified accessible without authentication for judge review

### Week 3 (June 22–28) — *(planned)*
- Expand Alchemy pattern coverage for remaining chains (Sonic, Ink, Taiko,
  etc.) once subdomain patterns are verified against live dashboard access
- Real-world testing with external developers using their actual RPC URLs
- Mobile responsiveness pass

### Week 4 (June 29 – July 3) — *(planned)*
- Final polish, full documentation pass
- Final demo video and submission

---

## Honest Known Limitations

In the interest of the transparency this update requests, here is what is
**not** yet true about this project:

- Detection coverage is 25 of 55 mainnet chains (45%), not all 60+ — see
  `COVERAGE.md` for the exact breakdown and reasoning
- No real external user testing has been conducted yet beyond the
  developer's own testing
- Mobile responsiveness has not been formally verified yet
