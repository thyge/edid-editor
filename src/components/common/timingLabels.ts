/**
 * Shared user-facing timing-name helpers (TASK-119): one rounding convention
 * for every timing name/label so a 59.94/59.95/59.99 Hz timing always reads
 * as "60" (and 119.88 as "120). Purely technical readouts — e.g. the timing
 * card's achieved-vs-target quantization Δ — keep their 2-decimal precision
 * and do not use these helpers.
 */
import { computeRefreshRate, type DetailedTiming } from 'edidts'

/**
 * Refresh rate rounded to the whole Hz a timing is commonly known by.
 * `computeRefreshRate` is the single source of truth (field rate for
 * interlaced timings), so this works for both EDID base-block DTDs and CTA-861
 * detailed timings.
 */
export function roundedRefreshRate(timing: DetailedTiming): number {
  return Math.round(computeRefreshRate(timing))
}

/**
 * Timing name label: "1920×1080p60" (interlaced keeps the "i" suffix, e.g.
 * "1920×1080i60"). Falls back to `fallback` for blank/zeroed DTDs (e.g. a
 * freshly added empty slot), matching the left-nav convention.
 */
export function timingNameLabel(timing: DetailedTiming, fallback: string): string {
  if (timing.horizontalActive <= 0 || timing.verticalActive <= 0) return fallback
  const scan = timing.flags.interlaced ? 'i' : 'p'
  return `${timing.horizontalActive}×${timing.verticalActive}${scan}${roundedRefreshRate(timing)}`
}