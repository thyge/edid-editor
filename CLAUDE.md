# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side Vue 3 application for viewing and editing EDID (Extended Display Identification Data), CEA-861 extension blocks, and DisplayID data. All EDID decoding and encoding logic lives in `packages/edidts/src/` and is framework-agnostic; the Vue layer in `src/components/` provides the UI. The root `package.json` depends on the local `packages/edidts` workspace package.

## Development Commands

- `npm run dev` — Start the Vite development server.
- `npm run build` — Type-check with `vue-tsc` and build for production with Vite.
- `npm run preview` — Preview the production build locally.

The `edidts` package has its own scripts (run from `packages/edidts/`):

- `npm run build` — Type-check with `tsc` and build with Vite (produces `dist/index.js` + dts).
- `npx vitest run` — Run the library's test suite (no `test` script wired up; use vitest directly).

There is no test runner or linter configured for the Vue app.

## Architecture

### EDID Library (`packages/edidts/src/`)

The core data model is byte-oriented: each class parses a `Uint8Array` via a static `decode()` method and serializes back via a static `encode()`. `EEDID` is the top-level container; `EDID` is the base block; per-spec extension types live alongside.

- **`eedid/eedid.ts`** — `EEDID` class: top-level container with `base: EDID`, `extensions: Extension[]`, `checksum`, `isValid`. `EEDID.decode/encode/blank` handle the full blob, slicing 128-byte blocks and routing each one to the dispatcher in `extension.ts`.
- **`eedid/extension.ts`** — Extension dispatcher. `Extension = CEAExtension | DisplayIdExtension | OpaqueExtension`. The CEA arm (`tag === 0x02`) delegates to `cta/extension-block.ts`; the DisplayID arm (`tag === 0x70`) delegates to `displayid/section.ts`; everything else is preserved as `OpaqueExtension` raw bytes. Also exports `getCEAExtension(eedid)` for the common "find the CTA-861 block" pattern. VTB (`0x10`) and Block Map (`0xF0`) are CTA-internal types handled inside the CTA parser; they are surfaced to EEDID consumers as opaque.
- **`eedid/index.ts`** — Public surface for the EEDID module: re-exports `EEDID`, the `Extension` union, type guards, and `getCEAExtension`.
- **`edid/`** — `EDID` class, base-block only (128 bytes). Contains `header`, `videoInput`, `screenSize`, `gamma`, `featureSupport`, `colorCharacteristics`, `establishedTimings`, `standardTimings`, `detailedTimings`, and `displayDescriptors`. The four 18-byte descriptor slots after byte 54 are parsed as either `DetailedTimingDescriptor` or display descriptors (tagged text blocks). `EDID.encode` writes 128 bytes; `EDID.decode` consumes only the first 128 bytes. Extension-block handling moved up into `EEDID`.
- **`cta/`** — CTA-861 codec. `extension-block.ts` (`ExtensionBlockParser`) owns the 0x02/0x10/0xF0 dispatch. `video-timing-block.ts` is CTA-internal (the VTB arm). `cta-extended-blocks.ts` parses the per-extended-tag data blocks (video, audio, speaker, VSDB, etc.). HDMI 1.4 / HDMI 2.0 VSDBs are decoded as `VendorSpecificDataBlock` variants.
- **`displayid/`** — DisplayID 2.0 section parser. `section.ts` decodes/encodes a single `DisplayIdSection`; `blocks.ts` and `product-identification.ts` define the per-tag block types. `bytesInSection` declares the section's total length including the 4-byte section header and trailing 1-byte section checksum; the chain-walk `extensionCount` byte is preserved but not walked by the encoder (single-section case only).
- **`common/`** — Shared binary helpers: `detailed-timing-descriptor.ts` (18-byte DTD codec shared between EDID and CEA), `cvt-timing-generator.ts` (CVT-RB timing math), `checksum.ts` (8-bit checksum used by EDID blocks), `bintools.ts` (IeeeOUI read/write), `pnp-registry.ts`. Display descriptor factory lives in `edid/display-descriptor.ts`.

State flow: UI mutates fields on the `useEDID` composable's `edid.value` instance (an `EEDID` with `base: EDID` and `extensions: Extension[]`) → `App.vue`'s `syncEdid()` calls `EEDID.encode()` → raw bytes are recalculated → checksums updated. Vue does not deeply track individual `Uint8Array` element changes, so the store reassigns `edidData.value` to a fresh `Uint8Array` to trigger reactivity.

### UI Structure

- **`App.vue`** — Root layout with `TopNav`, `LeftNav`, and `HexViewer`. A hardcoded EDID hex string is parsed on mount for demo/development purposes. All EDID mutations route through `syncEdid()` which calls `EEDID.encode()` and assigns the result to `edidData.value` (which `HexViewer` renders).
- **`src/composables/useEDID.ts`** — Single composable that owns the EEDID instance (`edid: Ref<EEDID | null>`), the raw bytes (`edidData: Ref<Uint8Array>`), and the loaders (`loadFromHex`, `loadFromFile`, `createBlankEdid`). There is no Pinia store; the composable is the only state holder.
- **`src/types/edid.ts`** — `export type EDIDViewModel = EEDID` (the type passed to view components).
- **`src/components/`** — View components mirror the data model. Components receive an `EDIDViewModel` prop and access base-block fields via `props.edid.base.<field>`, extensions via `props.edid.extensions`:
  - `edid/` — `OverviewSummary.vue`, `DisplayInfo.vue`, `ColorCharacteristics.vue`, `EstablishedTimings.vue`, `StandardTimings.vue`, `DetailedDescriptors.vue`, `DisplayDescriptors.vue`, `EDIDUpload.vue`, `descriptors/` (per-descriptor-type subcomponents).
  - `cea/` — `CEAOverview.vue`, `CEAHeaderFlags.vue`, `CEAVideoBlock.vue`, `CEAAudioBlock.vue`, `CEASpeakerBlock.vue`, `CEAVendorBlock.vue`, `CEAHDRColorimetry.vue`, `CEAVideoCapability.vue`, `CEADetailedTimings.vue`. Each receives a `cea: CEAExtension` prop (obtained via `getCEAExtension(props.edid)` in the parent).
  - `layout/` — `TopNav.vue`, `LeftNav.vue`, `HexViewer.vue`. `LeftNav` builds the section tree from the live EEDID (it shows CEA children only when a CEA extension exists; a DisplayID row is shown when any `extensions[].tag === 0x70`).
  - `ui/` — shadcn-vue components (Button, Input, Dialog, Sidebar, Tabs, DropdownMenu, etc.). Use these instead of writing custom UI primitives.

### Tech Stack

- Vue 3 (Composition API with `<script setup>`)
- Vite 7 + `@vitejs/plugin-vue`
- TypeScript 5.9 (strict mode, `noUnusedLocals`, `noUnusedParameters`)
- Tailwind CSS v4 via `@tailwindcss/vite`
- shadcn-vue (style: new-york, baseColor: neutral)
- `@vueuse/core`, `reka-ui`, `lucide-vue-next`

Path alias `@/` maps to `./src/`.

## Important Conventions

- **TypeScript strictness is high.** `noUnusedLocals` and `noUnusedParameters` are enabled; unused variables will fail the build.
- **Bit/byte parsing:** EDID is a packed binary format. Fields are often split across bits in multiple bytes. When adding new fields, follow the existing pattern of masking and shifting in `Decode()`, and reverse the operation in `Encode()`.
- **Reactivity caveat:** Because the core data uses plain classes and `Uint8Array`, Vue cannot detect deep mutations on raw bytes. `App.vue`'s `syncEdid()` works around this by reassigning `edidData.value` to a freshly-encoded `Uint8Array` after each mutation.
- **Adding UI components:** Only add shadcn-vue components using the CLI (`npx shadcn-vue@latest add <component>`). Never write or modify shadcn components manually—if a needed primitive is missing, install it via the CLI rather than building a custom one.
- **EEDID vs EDID:** consumers should use `EEDID.decode/encode/blank` and access base fields via `.base`. `EDID` is reserved for the 128-byte base block and is rarely used directly from the Vue app.
