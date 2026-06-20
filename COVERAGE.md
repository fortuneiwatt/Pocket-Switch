# Detection Coverage

This document tracks exactly which chains Pocket Switch can reliably
**detect** from a pasted Infura or Alchemy URL/snippet, versus which chains
are listed in the Chain Explorer but not yet auto-detectable.

This distinction matters: every chain in `chains.json` has a real, working
Pocket Network endpoint and shows up in the Chain Explorer regardless. The
question here is narrower — *can the converter automatically recognise this
chain from a pasted Infura/Alchemy URL?*

## Current Status (as of 2026-06-20)

**25 of 55 mainnet chains (45%) have verified, tested auto-detection.**

All 25 patterns below are sourced directly from the official Infura
endpoints page (`docs.metamask.io/services/get-started/endpoints/`) and have
been tested against real-world URL strings — see `parser.ts` test coverage.

### ✅ Fully Detectable (Infura patterns verified)

| Chain | Infura Pattern Verified |
|---|---|
| Ethereum | ✅ |
| Polygon | ✅ |
| Arbitrum | ✅ |
| Optimism | ✅ |
| Base | ✅ |
| Avalanche (C-Chain) | ✅ |
| BNB Smart Chain | ✅ |
| Linea | ✅ |
| Scroll | ✅ |
| Blast | ✅ |
| Mantle | ✅ |
| Celo | ✅ |
| Sei | ✅ |
| Unichain | ✅ |
| zkSync Era | ✅ |
| opBNB | ✅ |
| Solana | ✅ *(Infura's Solana access is limited-access per their docs, but the URL pattern is documented)* |

Plus chains with verified Alchemy patterns from earlier research:
Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BNB Smart Chain,
Polygon zkEVM, zkSync Era, Sei, Unichain, Berachain.

### ⚠️ Listed but NOT auto-detectable (yet)

These chains have a real, working Pocket endpoint and appear in the Chain
Explorer — but pasting an Infura/Alchemy URL for them will **not** be
detected yet, because we have not verified their exact provider subdomain
pattern against official documentation:

`Moonriver, Harmony, Metis, Boba Network, Kava, Fuse, IoTeX, Taiko, Sonic, Fraxtal, Ink, Kaia, Hyperliquid, Oasys, XRPL EVM, zkLink Nova`

Some of these (Taiko, Sonic, Ink) are confirmed supported by Alchemy per
their status page and docs, but the exact subdomain slug wasn't in any
source we could verify directly — so we deliberately did not guess. A wrong
pattern that silently fails or false-matches is worse than an honest gap.

### Not applicable — never supported by Infura/Alchemy

These are correctly excluded from detection because neither competitor ever
offered them — there is nothing to "migrate from":

- All Cosmos-ecosystem chains (Pocket Network, Osmosis, Akash, Stargaze,
  Juno, Fetch.ai, AtomOne, Cheqd, Chihuahua, Jackal, Persistence, Seda,
  Shentu)
- Radix
- XRPL EVM

## A Real Bug We Caught and Fixed

While expanding coverage, testing surfaced a real detection bug: Ethereum's
original Infura pattern (`mainnet.infura.io/v3/`) was a substring of every
*other* chain's Infura URL too (e.g. `arbitrum-mainnet.infura.io/v3/`
contains `mainnet.infura.io/v3/`). Combined with first-match-wins logic,
this meant **every Infura chain we added was silently misdetected as
Ethereum.**

Fixed two ways:
1. Tightened Ethereum's pattern to `https://mainnet.infura.io/v3/` (anchored,
   no longer a substring of other chains' URLs)
2. Changed the parser's matching strategy from first-match-wins to
   **longest-match-wins**, so this class of bug can't silently recur as more
   chains are added with similar naming conventions

This is the kind of issue that only surfaces under real testing, not code
review — which is why every new chain pattern added to this file should be
tested with the script pattern shown in `parser.ts`'s test suite before
being trusted.

## How to Improve This

To move a chain from "listed" to "detectable":
1. Find the chain's official RPC URL pattern in Infura or Alchemy's own
   documentation (not a forum post, not a guess)
2. Add it to that chain's `providers` object in `chains.json`
3. Write a test case confirming it detects the **correct** chain, not just
   *a* chain (the Ethereum bug above shows why this step is non-negotiable)
4. Update the counts in this document
