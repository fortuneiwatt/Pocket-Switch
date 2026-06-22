# Pocket Switch

**Switch from Infura or Alchemy to Pocket Network in 60 seconds.**

Pocket Switch is a migration tool that helps Web3 developers replace centralized RPC providers such as Infura and Alchemy with Pocket Network's decentralized infrastructure.

Built for the Built On Pocket Hackathon (BoP) 2026.

---

## Live Demo

**Application:** https://pocket-switch.onrender.com

**GitHub Repository:** https://github.com/fortuneiwatt/pocket-switch


---

# The Problem

Most Web3 developers default to centralized RPC providers such as Infura and Alchemy.

While these services are widely adopted, they introduce several risks:

* Single points of failure
* API key management overhead
* Rate limits and pricing restrictions
* Regional censorship exposure
* Vendor lock-in

Historical outages and access restrictions have demonstrated how a single provider can impact thousands of applications simultaneously.

Pocket Network solves the infrastructure problem through decentralized RPC access, but many developers never switch because migration requires research, configuration changes, and uncertainty about compatibility.

The problem is no longer the technology.

The problem is migration friction.

---

# The Solution

Pocket Switch removes that friction.

Developers simply paste an existing Infura or Alchemy RPC URL—or an entire code snippet—and Pocket Switch automatically:

1. Detects the provider
2. Detects the blockchain network
3. Generates the equivalent Pocket Network endpoint
4. Produces ready-to-use code snippets
5. Allows one-click copying into existing projects

No documentation reading.

No account creation.

No API key setup.

No backend processing.

Just paste, copy, and switch.

---

# How Pocket Network Powers This Project

Pocket Network is not an optional integration.

It is the core output of the application.

Every successful conversion produces a real Pocket Network RPC endpoint:

| Chain    | Pocket Endpoint                    |
| -------- | ---------------------------------- |
| Ethereum | https://eth.api.pocket.network     |
| Polygon  | https://poly.api.pocket.network    |
| Arbitrum | https://arb-one.api.pocket.network |
| Base     | https://base.api.pocket.network    |

Generated code snippets directly call Pocket Network endpoints using standard JSON-RPC.

Example output:

```typescript
import { JsonRpcProvider } from "ethers";

const provider = new JsonRpcProvider(
  "https://eth.api.pocket.network"
);

const blockNumber = await provider.getBlockNumber();
```

### Why Pocket Network Is Required

Pocket Network's public endpoint architecture makes the "switch in 60 seconds" experience possible.

Unlike centralized providers, Pocket:

* Requires no API key
* Requires no account creation
* Uses decentralized infrastructure
* Eliminates a single point of failure

Without Pocket Network, Pocket Switch would have no destination provider to convert developers toward.

The project's entire value proposition depends on Pocket's decentralized RPC infrastructure.

---

# Features

## Smart Converter

Detects supported Infura and Alchemy URLs or code snippets and converts them into Pocket Network equivalents.

## Multi-Framework Output

Generates ready-to-use examples for:

* ethers.js
* viem
* wagmi
* web3.py
* curl

## Chain Explorer

Searchable directory of Pocket-supported chains with copyable endpoints.

## Why Switch?

Evidence-based comparison between:

* Infura
* Alchemy
* Pocket Network

## Privacy First

All parsing and generation runs locally in the browser.

No pasted URLs, code snippets, or API keys are transmitted, logged, or stored.

---

# Current Status

## Completed MVP Functionality

✅ Provider detection engine

✅ Chain detection engine

✅ Pocket endpoint generation

✅ Multi-framework code generation

✅ Chain Explorer

✅ Why Switch comparison page

✅ Automated testing

✅ Public deployment

---

# Detection Coverage

Pocket Switch currently includes:

* 60+ Pocket-supported chains in the Chain Explorer
* 25 verified auto-detectable mainnet chains
* Verified Infura detection patterns
* Verified Alchemy detection patterns
* Automated collision testing

For the complete breakdown, see:

**COVERAGE.md**

---

# Architecture

```text
User Input
     │
     ▼
Parser Engine
(provider + chain detection)
     │
     ▼
chains.json
(source of truth)
     │
     ▼
Generator Engine
     │
     ▼
Pocket Network Output
(ethers.js, viem, wagmi,
web3.py, curl)
```

Core files:

```text
src/lib/parser.ts
src/lib/generator.ts
src/lib/chains.json
```

---

# Technology Stack

| Layer         | Technology     |
| ------------- | -------------- |
| Framework     | Next.js 14     |
| Language      | TypeScript     |
| Styling       | Tailwind CSS   |
| Highlighting  | Shiki          |
| Testing       | Vitest         |
| Hosting       | Render         |
| AI Assistance | Claude, Cursor |

---

# Built During the Built On Pocket Hackathon

## Pre-Existing Work

None.

This project did not exist before the Built On Pocket Hackathon.

No code, repository, prototype, or previous version existed before the event.

---

## Week 1 (June 8–14)

* Finalized project concept
* Researched Pocket-supported chains
* Built initial chains.json dataset
* Designed application architecture
* Submitted project proposal

---

## Week 2 (June 15–21)

* Built parser.ts detection engine
* Built generator.ts framework output engine
* Built Converter UI
* Built Chain Explorer
* Built Why Switch page
* Expanded verified provider detection coverage
* Added automated testing
* Fixed Ethereum pattern collision bug
* Deployed public MVP

---

## Week 3 (Planned)

* Expand Alchemy chain coverage
* External developer testing
* Mobile responsiveness improvements
* Additional chain verification

---

## Week 4 (Planned)

* Final polish
* Final documentation
* Demo video
* Final submission

---

# Testing

Automated tests currently verify:

* Provider detection
* Chain detection
* Generator output correctness
* Collision prevention
* Regression protection

A real detection bug was discovered and fixed during testing:

Ethereum's original detection pattern incorrectly matched multiple other Infura chains due to substring overlap.

The parser was redesigned to use a longest-match-wins strategy to prevent future collisions.

Full details are documented in COVERAGE.md.

---

# Known Limitations

Current limitations are intentionally documented transparently:

* Detection coverage currently covers 25 of 55 verified mainnet chains
* Some newer Alchemy-supported chains still require verified URL pattern research
* External user testing remains limited
* Mobile optimization is still in progress

These limitations affect detection coverage only.

All chains listed in the Chain Explorer still map to valid Pocket Network endpoints.

---

# Screenshots

<img width="1909" height="913" alt="Screenshot 2026-06-22 143342" src="https://github.com/user-attachments/assets/efad50e5-897c-49b0-982c-4789d87108e3" />
<img width="1904" height="955" alt="Screenshot 2026-06-22 143326" src="https://github.com/user-attachments/assets/d698e877-2d68-492e-8041-904bcf435067" />
<img width="1902" height="899" alt="Screenshot 2026-06-22 143308" src="https://github.com/user-attachments/assets/97aba9c4-0030-4117-a699-fe58a86dd892" />
<img width="1919" height="970" alt="Screenshot 2026-06-22 143248" src="https://github.com/user-attachments/assets/052dd80a-1a17-4aeb-b5e5-0d20e611ebfe" />

Suggested additions:

* Homepage / Converter
* Successful conversion output
* Chain Explorer
* Why Switch page

---

# AI Usage Disclosure

This project was built with AI assistance for:

* Architecture planning
* Code generation
* Debugging
* Documentation

All chain mappings, Pocket endpoints, and provider patterns were independently verified against official documentation rather than relying solely on AI-generated outputs.

---

# Why This Matters

Pocket Network already solves the infrastructure problem.

Pocket Switch solves the adoption problem.

By reducing migration from minutes or hours to seconds, Pocket Switch helps lower the barrier for developers to move from centralized RPC providers to Pocket's decentralized infrastructure.

Every successful conversion creates a simpler path toward increased Pocket Network usage and ecosystem growth.

---

# License

MIT
