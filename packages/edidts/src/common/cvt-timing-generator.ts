/**
 * CVT (Coordinated Video Timings) Timing Generator
 * 
 * Implements VESA CVT 1.2 specification for generating video timing parameters.
 * Supports Standard, Reduced Blanking (RB), and Reduced Blanking v2 (RBv2) modes.
 * 
 * Reference: VESA Coordinated Video Timings (CVT) Standard Version 1.2
 */

import { DetailedTimingDescriptor } from './detailed-timing-descriptor';

/**
 * Reduced Blanking mode
 */
export type CVTBlankingMode = 'cvt' | 'cvt-rb' | 'cvt-rb2';

/**
 * Input parameters for CVT timing calculation
 */
export interface CVTTimingInput {
  /** Horizontal active pixels */
  horizontalActive: number;
  /** Vertical active lines */
  verticalActive: number;
  /** Target refresh rate in Hz */
  refreshRate: number;
  /** Blanking mode: 'cvt', 'cvt-rb' (RB), or 'cvt-rb2' (RBv2) */
  blankingMode?: CVTBlankingMode;
  /** Interlaced mode (default: false) */
  interlaced?: boolean;
  /** Add margins (1.8% on each side) - rarely used (default: false) */
  margins?: boolean;
  /** Horizontal image size in mm (for descriptor, default: 0) */
  horizontalImageSize?: number;
  /** Vertical image size in mm (for descriptor, default: 0) */
  verticalImageSize?: number;
}

/**
 * Calculated CVT timing result
 */
export interface CVTTimingResult {
  /** Pixel clock in MHz */
  pixelClock: number;
  /** Horizontal active pixels */
  horizontalActive: number;
  /** Horizontal blanking pixels */
  horizontalBlanking: number;
  /** Horizontal front porch pixels */
  horizontalFrontPorch: number;
  /** Horizontal sync width pixels */
  horizontalSyncWidth: number;
  /** Horizontal back porch pixels */
  horizontalBackPorch: number;
  /** Horizontal total pixels */
  horizontalTotal: number;
  /** Vertical active lines */
  verticalActive: number;
  /** Vertical blanking lines */
  verticalBlanking: number;
  /** Vertical front porch lines */
  verticalFrontPorch: number;
  /** Vertical sync width lines */
  verticalSyncWidth: number;
  /** Vertical back porch lines */
  verticalBackPorch: number;
  /** Vertical total lines */
  verticalTotal: number;
  /** Actual refresh rate in Hz */
  actualRefreshRate: number;
  /** Horizontal frequency in kHz */
  horizontalFrequency: number;
  /** H-sync polarity */
  hSyncPolarity: 'positive' | 'negative';
  /** V-sync polarity */
  vSyncPolarity: 'positive' | 'negative';
  /** Blanking mode used */
  blankingMode: CVTBlankingMode;
  /** Whether interlaced */
  interlaced: boolean;
}

// CVT Constants
const CVT = {
  // Clock step in MHz (pixel clock granularity)
  CLOCK_STEP: 0.25,
  
  // Standard blanking constants
  STD: {
    MIN_V_PORCH: 3,           // Minimum vertical front porch
    V_SYNC_WIDTH: 3,          // Vertical sync width (varies by aspect ratio actually)
    MIN_V_BPORCH: 6,          // Minimum vertical back porch
    C_PRIME: 30,              // C' constant
    M_PRIME: 300,             // M' constant
    H_SYNC_PERCENT: 0.08,     // H-sync as percentage of total
    MIN_VSYNC_BP: 550,        // Minimum VSync + back porch time in μs
  },
  
  // Reduced blanking v1 constants
  RB_V1: {
    MIN_V_PORCH: 3,
    V_SYNC_WIDTH: 3,
    MIN_V_BPORCH: 6,
    H_BLANK: 160,             // Fixed horizontal blanking
    H_SYNC_WIDTH: 32,         // Fixed horizontal sync width
    H_FRONT_PORCH: 48,        // Fixed horizontal front porch
    MIN_VBLANK: 460,          // Minimum vertical blank time in μs
  },
  
  // Reduced blanking v2 constants
  RB_V2: {
    MIN_V_PORCH: 1,           // Can be as low as 1 for RBv2
    V_SYNC_WIDTH: 8,          // 8 lines for RBv2
    MIN_V_BPORCH: 6,
    H_BLANK: 80,              // Even smaller horizontal blanking
    H_SYNC_WIDTH: 32,
    H_FRONT_PORCH: 8,
    MIN_VBLANK: 460,
  },
};

/**
 * Get V-sync width based on aspect ratio (for standard blanking)
 */
function getVSyncWidth(hActive: number, vActive: number): number {
  const ratio = hActive / vActive;
  
  if (Math.abs(ratio - 4/3) < 0.01) return 4;
  if (Math.abs(ratio - 16/9) < 0.01) return 5;
  if (Math.abs(ratio - 16/10) < 0.01) return 6;
  if (Math.abs(ratio - 5/4) < 0.01) return 7;
  if (Math.abs(ratio - 15/9) < 0.01) return 7;
  
  // Default based on closest match
  if (ratio >= 1.7) return 5;  // Close to 16:9
  if (ratio >= 1.5) return 6;  // Close to 16:10
  return 4;  // Close to 4:3
}

/**
 * Round to nearest CVT clock step
 */
function roundToClockStep(clockMHz: number): number {
  return Math.ceil(clockMHz / CVT.CLOCK_STEP) * CVT.CLOCK_STEP;
}

/**
 * Calculate CVT Standard blanking timings
 */
function calculateStandardBlanking(
  hActive: number,
  vActive: number,
  refreshRate: number,
  interlaced: boolean,
  margins: boolean
): CVTTimingResult {
  // Step 1: Calculate field rate
  const vFieldRate = interlaced ? refreshRate * 2 : refreshRate;
  
  // Step 2: Calculate margins if needed
  const hMargin = margins ? Math.floor(hActive * 0.018 / 8) * 8 : 0;
  const vMargin = margins ? Math.floor(vActive * 0.018) : 0;
  
  const hActiveMargin = hActive + 2 * hMargin;
  const vActiveMargin = vActive + 2 * vMargin;
  
  // Step 3: For interlaced, use half the vertical active
  const vActiveLines = interlaced ? Math.floor(vActiveMargin / 2) : vActiveMargin;
  
  // Step 4: Estimate horizontal period
  const minVSyncBP = CVT.STD.MIN_VSYNC_BP; // μs
  const vSyncWidth = getVSyncWidth(hActive, vActive);
  const minVBackPorch = CVT.STD.MIN_V_BPORCH;
  
  // Estimate H period in μs
  const hPeriodEst = ((1000000 / vFieldRate) - minVSyncBP) / 
    (vActiveLines + CVT.STD.MIN_V_PORCH + vSyncWidth + minVBackPorch);
  
  // Step 5: Calculate vertical sync + back porch
  const vSyncBP = Math.floor(minVSyncBP / hPeriodEst) + 1;
  const vBackPorch = Math.max(vSyncBP - vSyncWidth, minVBackPorch);
  
  // Step 6: Calculate total vertical lines
  const vTotal = vActiveLines + CVT.STD.MIN_V_PORCH + vSyncWidth + vBackPorch;
  
  // Step 7: Calculate ideal duty cycle
  const hBlankPercent = CVT.STD.C_PRIME - (CVT.STD.M_PRIME * hPeriodEst / 1000);
  const idealDutyCycle = Math.max(20, hBlankPercent);
  
  // Step 8: Calculate horizontal blanking (must be multiple of 2*8=16)
  const hBlankIdeal = Math.floor(hActiveMargin * idealDutyCycle / (100 - idealDutyCycle) / 16) * 16;
  const hBlanking = Math.max(hBlankIdeal, 160);
  
  // Step 9: Calculate total horizontal pixels
  const hTotal = hActiveMargin + hBlanking;
  
  // Step 10: Calculate pixel clock
  const pixelClock = roundToClockStep(hTotal * vTotal * vFieldRate / 1000000);
  
  // Step 11: Calculate actual refresh rate
  const actualRefreshRate = (pixelClock * 1000000) / (hTotal * vTotal) / (interlaced ? 2 : 1);
  
  // Step 12: Calculate horizontal timing
  const hSyncWidth = Math.floor(hTotal * CVT.STD.H_SYNC_PERCENT / 8) * 8;
  const hFrontPorch = (hBlanking / 2) - hSyncWidth;
  const hBackPorch = hBlanking - hFrontPorch - hSyncWidth;
  
  // Vertical timing
  const vFrontPorch = CVT.STD.MIN_V_PORCH;
  const vBlanking = vFrontPorch + vSyncWidth + vBackPorch;
  
  return {
    pixelClock,
    horizontalActive: hActive,
    horizontalBlanking: hBlanking,
    horizontalFrontPorch: Math.max(0, hFrontPorch),
    horizontalSyncWidth: hSyncWidth,
    horizontalBackPorch: Math.max(0, hBackPorch),
    horizontalTotal: hTotal,
    verticalActive: vActive,
    verticalBlanking: vBlanking,
    verticalFrontPorch: vFrontPorch,
    verticalSyncWidth: vSyncWidth,
    verticalBackPorch: vBackPorch,
    verticalTotal: vTotal * (interlaced ? 2 : 1),
    actualRefreshRate,
    horizontalFrequency: pixelClock * 1000 / hTotal,
    hSyncPolarity: 'negative',
    vSyncPolarity: 'positive',
    blankingMode: 'cvt',
    interlaced,
  };
}

/**
 * Calculate CVT Reduced Blanking v1 timings
 */
function calculateReducedBlankingV1(
  hActive: number,
  vActive: number,
  refreshRate: number,
  interlaced: boolean
): CVTTimingResult {
  const vFieldRate = interlaced ? refreshRate * 2 : refreshRate;
  const vActiveLines = interlaced ? Math.floor(vActive / 2) : vActive;
  
  // Fixed horizontal blanking for RB
  const hBlanking = CVT.RB_V1.H_BLANK;
  const hTotal = hActive + hBlanking;
  
  // Calculate minimum vertical blanking time
  const minVBlankTime = CVT.RB_V1.MIN_VBLANK; // μs
  
  // Calculate horizontal period
  const hPeriod = 1000000 / (vFieldRate * (vActiveLines + CVT.RB_V1.MIN_V_PORCH));
  
  // Calculate vertical blanking lines
  const vBlankLines = Math.ceil(minVBlankTime / hPeriod);
  const vSyncWidth = CVT.RB_V1.V_SYNC_WIDTH;
  const vFrontPorch = CVT.RB_V1.MIN_V_PORCH;
  const vBackPorch = Math.max(vBlankLines - vSyncWidth - vFrontPorch, CVT.RB_V1.MIN_V_BPORCH);
  const vBlanking = vFrontPorch + vSyncWidth + vBackPorch;
  const vTotal = vActiveLines + vBlanking;
  
  // Calculate pixel clock
  const pixelClock = roundToClockStep(hTotal * vTotal * vFieldRate / 1000000);
  
  // Calculate actual refresh rate
  const actualRefreshRate = (pixelClock * 1000000) / (hTotal * vTotal) / (interlaced ? 2 : 1);
  
  return {
    pixelClock,
    horizontalActive: hActive,
    horizontalBlanking: hBlanking,
    horizontalFrontPorch: CVT.RB_V1.H_FRONT_PORCH,
    horizontalSyncWidth: CVT.RB_V1.H_SYNC_WIDTH,
    horizontalBackPorch: hBlanking - CVT.RB_V1.H_FRONT_PORCH - CVT.RB_V1.H_SYNC_WIDTH,
    horizontalTotal: hTotal,
    verticalActive: vActive,
    verticalBlanking: vBlanking,
    verticalFrontPorch: vFrontPorch,
    verticalSyncWidth: vSyncWidth,
    verticalBackPorch: vBackPorch,
    verticalTotal: vTotal * (interlaced ? 2 : 1),
    actualRefreshRate,
    horizontalFrequency: pixelClock * 1000 / hTotal,
    hSyncPolarity: 'positive',
    vSyncPolarity: 'negative',
    blankingMode: 'cvt-rb',
    interlaced,
  };
}

/**
 * Calculate CVT Reduced Blanking v2 timings
 */
function calculateReducedBlankingV2(
  hActive: number,
  vActive: number,
  refreshRate: number,
  interlaced: boolean
): CVTTimingResult {
  const vFieldRate = interlaced ? refreshRate * 2 : refreshRate;
  const vActiveLines = interlaced ? Math.floor(vActive / 2) : vActive;
  
  // Even smaller horizontal blanking for RBv2
  const hBlanking = CVT.RB_V2.H_BLANK;
  const hTotal = hActive + hBlanking;
  
  // Calculate minimum vertical blanking time
  const minVBlankTime = CVT.RB_V2.MIN_VBLANK; // μs
  
  // Calculate horizontal period estimate
  const hPeriod = 1000000 / (vFieldRate * (vActiveLines + CVT.RB_V2.MIN_V_PORCH));
  
  // Calculate vertical blanking lines
  const vBlankLines = Math.ceil(minVBlankTime / hPeriod);
  const vSyncWidth = CVT.RB_V2.V_SYNC_WIDTH;
  const vFrontPorch = CVT.RB_V2.MIN_V_PORCH;
  const vBackPorch = Math.max(vBlankLines - vSyncWidth - vFrontPorch, CVT.RB_V2.MIN_V_BPORCH);
  const vBlanking = vFrontPorch + vSyncWidth + vBackPorch;
  const vTotal = vActiveLines + vBlanking;
  
  // Calculate pixel clock
  const pixelClock = roundToClockStep(hTotal * vTotal * vFieldRate / 1000000);
  
  // Calculate actual refresh rate
  const actualRefreshRate = (pixelClock * 1000000) / (hTotal * vTotal) / (interlaced ? 2 : 1);
  
  return {
    pixelClock,
    horizontalActive: hActive,
    horizontalBlanking: hBlanking,
    horizontalFrontPorch: CVT.RB_V2.H_FRONT_PORCH,
    horizontalSyncWidth: CVT.RB_V2.H_SYNC_WIDTH,
    horizontalBackPorch: hBlanking - CVT.RB_V2.H_FRONT_PORCH - CVT.RB_V2.H_SYNC_WIDTH,
    horizontalTotal: hTotal,
    verticalActive: vActive,
    verticalBlanking: vBlanking,
    verticalFrontPorch: vFrontPorch,
    verticalSyncWidth: vSyncWidth,
    verticalBackPorch: vBackPorch,
    verticalTotal: vTotal * (interlaced ? 2 : 1),
    actualRefreshRate,
    horizontalFrequency: pixelClock * 1000 / hTotal,
    hSyncPolarity: 'positive',
    vSyncPolarity: 'negative',
    blankingMode: 'cvt-rb2',
    interlaced,
  };
}

/**
 * Calculate CVT timing parameters
 * 
 * @param input CVT timing input parameters
 * @returns Calculated timing result
 */
export function calculateCVTTiming(input: CVTTimingInput): CVTTimingResult {
  const {
    horizontalActive,
    verticalActive,
    refreshRate,
    blankingMode = 'cvt',
    interlaced = false,
    margins = false,
  } = input;
  
  // Validate inputs
  if (horizontalActive <= 0 || verticalActive <= 0 || refreshRate <= 0) {
    throw new Error('Invalid input: resolution and refresh rate must be positive');
  }
  
  switch (blankingMode) {
    case 'cvt-rb':
      return calculateReducedBlankingV1(horizontalActive, verticalActive, refreshRate, interlaced);
    case 'cvt-rb2':
      return calculateReducedBlankingV2(horizontalActive, verticalActive, refreshRate, interlaced);
    case 'cvt':
    default:
      return calculateStandardBlanking(horizontalActive, verticalActive, refreshRate, interlaced, margins);
  }
}

/**
 * Generate a DetailedTimingDescriptor from CVT parameters
 * 
 * @param input CVT timing input parameters
 * @returns DetailedTimingDescriptor ready for EDID encoding
 */
export function generateCVTDetailedTiming(input: CVTTimingInput): DetailedTimingDescriptor {
  const result = calculateCVTTiming(input);
  
  return new DetailedTimingDescriptor({
    pixelClock: result.pixelClock,
    horizontalActive: result.horizontalActive,
    horizontalBlanking: result.horizontalBlanking,
    verticalActive: result.verticalActive,
    verticalBlanking: result.verticalBlanking,
    horizontalSyncOffset: result.horizontalFrontPorch,
    horizontalSyncWidth: result.horizontalSyncWidth,
    verticalSyncOffset: result.verticalFrontPorch,
    verticalSyncWidth: result.verticalSyncWidth,
    horizontalImageSize: input.horizontalImageSize ?? 0,
    verticalImageSize: input.verticalImageSize ?? 0,
    horizontalBorder: 0,
    verticalBorder: 0,
    flags: {
      interlaced: result.interlaced,
      stereoMode: 'none',
      syncType: 'digital-separate',
      hSyncPolarity: result.hSyncPolarity,
      vSyncPolarity: result.vSyncPolarity,
    },
  });
}

/**
 * CVT analysis tolerances for comparing detailed timings
 */
export interface CVTAnalysisTolerances {
  pixelClock: number;
  horizontalBlanking: number;
  verticalBlanking: number;
  horizontalTotal: number;
  verticalTotal: number;
  horizontalPorch: number;
  verticalPorch: number;
}

const DEFAULT_CVT_TOLERANCES: CVTAnalysisTolerances = {
  pixelClock: 0.75,
  horizontalBlanking: 20,
  verticalBlanking: 6,
  horizontalTotal: 32,
  verticalTotal: 12,
  horizontalPorch: 20,
  verticalPorch: 6,
};

export interface CVTModeLabel {
  mode: CVTBlankingMode;
  label: string;
}

const DEFAULT_CVT_ANALYSIS_MODES: CVTModeLabel[] = [
  { mode: 'cvt', label: 'CVT' },
  { mode: 'cvt-rb', label: 'CVT RB' },
  { mode: 'cvt-rb2', label: 'CVT RB2' },
];

export interface CVTComparisonDifferences {
  pixelClock: number;
  horizontalBlanking: number;
  verticalBlanking: number;
  horizontalTotal: number;
  verticalTotal: number;
  horizontalFrontPorch: number;
  horizontalBackPorch: number;
  verticalFrontPorch: number;
  verticalBackPorch: number;
}

export interface CVTComparisonResult {
  label: string;
  mode: CVTBlankingMode;
  expected: CVTTimingResult;
  differences: CVTComparisonDifferences;
  withinTolerance: boolean;
}

export interface CVTAnalysisResult {
  comparisons: CVTComparisonResult[];
  matchLabel: string;
}

export interface CVTAnalysisOptions {
  tolerances?: Partial<CVTAnalysisTolerances>;
  modes?: CVTModeLabel[];
}

function getHorizontalFrontPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.horizontalSyncOffset);
}

function getHorizontalBackPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.horizontalBlanking - timing.horizontalSyncWidth - timing.horizontalSyncOffset);
}

function getVerticalFrontPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.verticalSyncOffset);
}

function getVerticalBackPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.verticalBlanking - timing.verticalSyncWidth - timing.verticalSyncOffset);
}

/**
 * Compare a detailed timing descriptor against CVT calculated timings
 */
export function analyzeDetailedTimingWithCVT(
  timing: DetailedTimingDescriptor,
  options?: CVTAnalysisOptions
): CVTAnalysisResult {
  const tolerances: CVTAnalysisTolerances = {
    ...DEFAULT_CVT_TOLERANCES,
    ...(options?.tolerances ?? {}),
  };
  const modes = options?.modes ?? DEFAULT_CVT_ANALYSIS_MODES;

  try {
    const refresh = timing.refreshRate > 0 ? timing.refreshRate : 60;
    const targetRefresh = Number(refresh.toFixed(6));

    const comparisons = modes.map(({ mode, label }) => {
      const expected = calculateCVTTiming({
        horizontalActive: timing.horizontalActive,
        verticalActive: timing.verticalActive,
        refreshRate: targetRefresh,
        blankingMode: mode,
        interlaced: timing.flags.interlaced,
      });

      const differences: CVTComparisonDifferences = {
        pixelClock: timing.pixelClock - expected.pixelClock,
        horizontalBlanking: timing.horizontalBlanking - expected.horizontalBlanking,
        verticalBlanking: timing.verticalBlanking - expected.verticalBlanking,
        horizontalTotal: timing.horizontalTotal - expected.horizontalTotal,
        verticalTotal: timing.verticalTotal - expected.verticalTotal,
        horizontalFrontPorch: getHorizontalFrontPorch(timing) - expected.horizontalFrontPorch,
        horizontalBackPorch: getHorizontalBackPorch(timing) - expected.horizontalBackPorch,
        verticalFrontPorch: getVerticalFrontPorch(timing) - expected.verticalFrontPorch,
        verticalBackPorch: getVerticalBackPorch(timing) - expected.verticalBackPorch,
      };

      const withinTolerance =
        Math.abs(differences.pixelClock) <= tolerances.pixelClock &&
        Math.abs(differences.horizontalBlanking) <= tolerances.horizontalBlanking &&
        Math.abs(differences.verticalBlanking) <= tolerances.verticalBlanking &&
        Math.abs(differences.horizontalTotal) <= tolerances.horizontalTotal &&
        Math.abs(differences.verticalTotal) <= tolerances.verticalTotal &&
        Math.abs(differences.horizontalFrontPorch) <= tolerances.horizontalPorch &&
        Math.abs(differences.horizontalBackPorch) <= tolerances.horizontalPorch &&
        Math.abs(differences.verticalFrontPorch) <= tolerances.verticalPorch &&
        Math.abs(differences.verticalBackPorch) <= tolerances.verticalPorch;

      return {
        label,
        mode,
        expected,
        differences,
        withinTolerance,
      };
    });

    const match = comparisons.find((comparison) => comparison.withinTolerance);

    return {
      comparisons,
      matchLabel: match?.label ?? 'Custom',
    };
  } catch {
    return {
      comparisons: [],
      matchLabel: 'Custom',
    };
  }
}

/**
 * Common resolution presets for quick generation
 */
export const CVT_PRESETS = {
  /** 1920x1080 @ 60Hz Standard */
  '1080p60': { horizontalActive: 1920, verticalActive: 1080, refreshRate: 60 },
  /** 1920x1080 @ 60Hz Reduced Blanking */
  '1080p60_RB': { horizontalActive: 1920, verticalActive: 1080, refreshRate: 60, blankingMode: 'cvt-rb' as CVTBlankingMode },
  /** 2560x1440 @ 60Hz */
  '1440p60': { horizontalActive: 2560, verticalActive: 1440, refreshRate: 60 },
  /** 2560x1440 @ 60Hz Reduced Blanking */
  '1440p60_RB': { horizontalActive: 2560, verticalActive: 1440, refreshRate: 60, blankingMode: 'cvt-rb' as CVTBlankingMode },
  /** 2560x1440 @ 144Hz Reduced Blanking v2 */
  '1440p144_RBv2': { horizontalActive: 2560, verticalActive: 1440, refreshRate: 144, blankingMode: 'cvt-rb2' as CVTBlankingMode },
  /** 3840x2160 @ 30Hz */
  '4K30': { horizontalActive: 3840, verticalActive: 2160, refreshRate: 30 },
  /** 3840x2160 @ 60Hz Reduced Blanking */
  '4K60_RB': { horizontalActive: 3840, verticalActive: 2160, refreshRate: 60, blankingMode: 'cvt-rb' as CVTBlankingMode },
  /** 3840x2160 @ 60Hz Reduced Blanking v2 */
  '4K60_RBv2': { horizontalActive: 3840, verticalActive: 2160, refreshRate: 60, blankingMode: 'cvt-rb2' as CVTBlankingMode },
  /** 3840x2160 @ 120Hz Reduced Blanking v2 */
  '4K120_RBv2': { horizontalActive: 3840, verticalActive: 2160, refreshRate: 120, blankingMode: 'cvt-rb2' as CVTBlankingMode },
} as const;
