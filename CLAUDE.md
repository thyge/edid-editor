# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side Vue 3 application for viewing and editing EDID (Extended Display Identification Data), CEA-861 extension blocks, and DisplayID data. All EDID decoding and encoding logic lives in `src/edidjs/` and is framework-agnostic; the Vue layer in `src/components/` provides the UI.

## Development Commands

- `npm run dev` — Start the Vite development server.
- `npm run build` — Type-check with `vue-tsc` and build for production with Vite.
- `npm run preview` — Preview the production build locally.

There is no test runner or linter configured in this project.

## Architecture

### EDID Data Model (`src/edidjs/`)

The core data model is byte-oriented: each class parses a `Uint8Array` via `Decode(bytes)` and serializes back via `Encode()`.

- **`EEDID`** (`eedid.ts`) — Top-level container. Holds the full raw byte array and manages extension blocks. It instantiates `EDID`, `CEA`, and `DisplayID` and routes each 128-byte slice to the correct parser based on the extension tag byte.
- **`EDID`** (`edid.ts`) — Parses the base 128-byte EDID block. Contains `ManufacturerID`, `VideoInputDefinition`, `Chromaticity`, `EstablishedTimings`, `StandardTimings`, and `DisplayDescriptors`. The four 18-byte descriptor slots after byte 54 are parsed as either `DetailedTimingDescriptor` or display descriptors (tagged text blocks).
- **`CEA`** (`cea.ts`) — Parses CEA-861 extension blocks. Contains a `CEAHeader` and a list of `CEADataBlock`s (video, audio, speaker allocation, VSDB, extended tags). VSDB blocks include HDMI 1.4 and HDMI 2.0 parsers.
- **`DisplayID`** (`did.ts`) — Partial DisplayID extension support.
- **`edid_descriptors.ts`** — Factory for display descriptor types (product name, serial number, range limits, etc.).
- **`DetailedTimingDescriptor.ts`** — Shared between EDID and CEA; represents 18-byte DTD structures.

State flow: UI mutates fields on the store’s `mEEDID` instance → `edidStore.updateEdid()` calls `Encode()` on EDID and CEA → raw bytes are recalculated → checksums updated. Vue does not deeply track individual `Uint8Array` element changes, so the store reassigns `raw` slices to trigger reactivity.

### UI Structure

- **`App.vue`** — Root layout using a shadcn-vue `SidebarProvider` with `AppSidebar`, `SidebarInset`, and `SidebarRight`. A hardcoded EDID hex string is parsed on mount for demo/development purposes.
- **`src/stores/`** — Pinia stores:
  - `edidStore.ts` — Holds the single `EEDID` instance (`mEEDID`) and actions for adding/removing display descriptors and triggering re-encodes.
  - `uiStore.ts` — Toggles UI panels (e.g., `showHexView`).
- **`src/components/`** — View components mirror the data model:
  - `EDIDView.vue`, `CEAView.vue`, `DisplayIDView.vue` — Top-level tabs for each block type.
  - `edid/`, `cea/`, `cea/extended/`, `cea/vsdb/` — Nested components for specific EDID/CEA sections.
  - `HexViewer.vue` — Renders raw bytes as hex.
- **`src/components/ui/`** — shadcn-vue components (Button, Input, Dialog, Sidebar, Tabs, etc.). Use these instead of writing custom UI primitives.

### Tech Stack

- Vue 3 (Composition API with `<script setup>`)
- Vite 7 + `@vitejs/plugin-vue`
- TypeScript 5.9 (strict mode, `noUnusedLocals`, `noUnusedParameters`)
- Tailwind CSS v4 via `@tailwindcss/vite`
- shadcn-vue (style: new-york, baseColor: neutral)
- Pinia for state management
- `@vueuse/core`, `reka-ui`, `lucide-vue-next`

Path alias `@/` maps to `./src/`.

## Important Conventions

- **TypeScript strictness is high.** `noUnusedLocals` and `noUnusedParameters` are enabled; unused variables will fail the build.
- **Bit/byte parsing:** EDID is a packed binary format. Fields are often split across bits in multiple bytes. When adding new fields, follow the existing pattern of masking and shifting in `Decode()`, and reverse the operation in `Encode()`.
- **Reactivity caveat:** Because the core data uses plain classes and `Uint8Array`, Vue cannot detect deep mutations on raw bytes. The store’s `updateEdid()` works around this by slicing and reassigning `raw` arrays after encoding.
- **Adding UI components:** Only add shadcn-vue components using the CLI (`npx shadcn-vue@latest add <component>`). Never write or modify shadcn components manually—if a needed primitive is missing, install it via the CLI rather than building a custom one.
