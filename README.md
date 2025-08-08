# Dead by Daylight Loadout Optimizer

Windows-first desktop app built with Tauri + React + TypeScript + Vite. Offline-first with optional dataset updates from community JSON feeds.

## Features
- Loadout builder for Survivor/Killer: character, item, 2 add-ons, 4 perks, offering
- Data-driven rules for repair speed, healing speed, item charge usage, skill-check effects
- Deterministic calculations and an optional Monte Carlo simulation (10k trials default)
- Skill checks: Great/Good/Fail sliders (must sum to 100%), Stake Out conversion, ping/input lag adjustment, Hyperfocus stacks EV
- Dataset updater: fetch → validate (Zod) → normalize → save; icons cached locally; meta version tracked
- Export share-code (URL-safe base64 JSON)

## Requirements
- Node.js 18+
- pnpm 9+
- Rust toolchain (stable) for Tauri (Windows build requires MSVC tools)

## Quick Start (Web Dev)
```bash
pnpm i
pnpm dev
```
Visit http://localhost:1420.

## Desktop (Tauri) Dev
Install Rust. On Windows, install the Visual Studio Build Tools (C++ tools). Then:
```bash
pnpm i
pnpm tauri:dev
```

## Build Desktop App
```bash
pnpm tauri:build
```
Artifacts will appear under `src-tauri/target/`.

## Offline Data & Updates
- Default offline data is packaged under `public/data/...` and `public/assets/...`.
- The app reads constants and the compiled dataset at runtime; no Dead by Daylight constants are hardcoded.
- Update sources in `data/sources.json`. Example:
```json
[
  { "name": "Local Sample", "url": "http://localhost:1420/data/compiled/dataset.json" }
]
```
- Run the updater:
```bash
pnpm update:dataset
```
This validates using `src/lib/schema.ts` and writes to `data/compiled/*.json`. Icons are saved to `assets/icons/`. If a fetch fails, previous compiled data remains intact.

## Data Model (Plain Language)
- Entities: Perk, Add-On, Item, Offering, Character, Patch metadata
- Fields: stable ID, name, description, rarity, icon, role/type, rules/effects array, sources
- Rules: target stat (repair speed, heal speed, item charge rate, etc.), value (percent/absolute), combination method (additive/multiplicative/override), conditions, optional stack info with caps
- Skill-check rules can trigger on Great/Good/Fail/continuous, adjust tokens (Hyperfocus, Stake Out), modify skill windows or intervals, and scale other effects based on token count

See type definitions in `src/lib/types.ts` and Zod schemas in `src/lib/schema.ts`.

## Constants
- See `public/data/constants.json`. Contains base repair/heal times, skill-check windows, and multipliers.
- Changing values here updates outputs without code changes.

## Calculation Engine
- Deterministic (`src/lib/calc/deterministic.ts`):
  - Gathers rules from loadout entities
  - Applies effects in order: override → additive → multiplicative → caps → clamp
  - Applies ping-adjusted Great% and Stake Out tokens before computing expected Hyperfocus stacks
- Simulation (`src/lib/calc/simulation.ts`):
  - Tick-based loop (skill-check interval)
  - Samples outcomes with ping-adjusted percents; upgrades Goods to Greats while Stake Out tokens remain
  - Tracks Hyperfocus stacks and progress until completion; aggregates avg/p50/p90

## UI
- Left pane: Loadout builder with icons and rarity styling
- Right pane: Summary (repair/heal/item), Skill Check card (sliders, Stake Out tokens, Hyperfocus EV), Assumptions (injury, teammates, sim controls)
- Top bar: dataset version, update button, share-code export

## Share Code
- Export copies the base64 JSON to clipboard. Includes loadout and assumptions (sliders, ping, sim, Stake Out tokens).

## Testing
```bash
pnpm test
```
Included tests:
- Rule combining order
- Stake Out remapping
- Hyperfocus EV monotonicity

## Contributing
- Keep all gameplay values in the dataset or `constants.json`. Do not hardcode numbers in logic.
- Extend schemas and rules to add new effects. Update tests accordingly.

## License
MIT