import { AspectRatio } from "./edid";
import { CVTMode } from "./DetailedTimingDescriptor";
// Adapted from https://github.com/tomverbeure/tomverbeure.github.io/blob/master/video_timings_calculator.html
// and VESA Coordinated Video Timings (CVT) Standard Version 1.2
// Updated with version 2.0

// CRT Constants
const C_PRIME = 30;
const CELL_GRAN = 8;
const CELL_GRAN_RND = Math.floor(CELL_GRAN);
const MIN_VSYNC_BP = 550;
// H_SYNC_PER
const MIN_V_BPORCH = 6;
// const RB_H_SYNC = 32;

export class CVTGenerator {
  // other params
  TimingMode: CVTMode = CVTMode.CRT;
  AspectRatio: AspectRatioHelper = new AspectRatioHelper(0, 0);
  CLOCK_STEP: number = 0.25;
  INT_RQD: boolean = false;
  // 5.2 Computation of Common Parameters
  V_FIELD_RATE_RQD: number = 0;
  // 5.3 Computation of "CRT" Timing Parameters
  V_SYNC_BP: number = 0;
  TOTAL_V_LINES: number = 0;
  TOTAL_PIXELS: number = 0;
  ACT_PIXEL_FREQ: number = 0;
  ACT_H_FREQ: number = 0;
  ACT_FRAME_RATE: number = 0;
  // 5.4 Computation of Reduced Blanking Timing Parameters
  VBI_LINES: number = 0;
  RB_MIN_VBI: number = 0;
  ACT_VBI_LINES: number = 0;
  REFRESH_MULTIPLIER: number = 1;
  // Things to check for CRT
  // All definitions referring to the horizontal timing,
  // including the horizontal active pixels, horizontal
  // total pixels, sync pulse duration and “Front porch” and “Back Porch” times
  // must be divisible by eight, and preferably by higher powers of two.

  // Params for DTD
  HorizontalActive: number = 0;
  HorizontalBlanking: number = 0;
  HorizontalFrontPorch: number = 0;
  HorizontalBackPorch: number = 0;
  HorizontalSyncPulseWidth: number = 0;
  VerticalActive: number = 0;
  VerticalBlanking: number = 0;
  VerticalFrontPorch: number = 0;
  VerticalBackPorch: number = 0;
  VerticalSyncPulseWidth: number = 0;
  HorizontalBorder: number = 0;
  VerticalBorder: number = 0;
  VerticalRefreshRate: number = 0;
  HorizontalRefreshRate: number = 0;
  PixelClockKHz: number = 0;
  constructor() {}
  public Generate(
    desired_horizontal_active_pixels: number,
    desired_vertical_active_pixels: number,
    desired_refreshrate: number,
    timing_mode: CVTMode,
    // fractional_refresh_rate: boolean,
    // 1.2 parameters
    margins: boolean,
    interlaced: boolean
  ): null {
    console.log("generating CVT");
    // Input variables
    let IP_FREQ_RQD: number = desired_refreshrate;
    let MARGINS_RQD: boolean = margins;
    this.INT_RQD = interlaced;
    this.TimingMode = timing_mode;

    // Mode specific constants?
    this.AspectRatio = new AspectRatioHelper(
      desired_horizontal_active_pixels,
      desired_vertical_active_pixels
    );
    this.VerticalSyncPulseWidth = this.AspectRatio.toVerticalSyncPulseWidth();
    // 5.2 Computation of Common Parameters
    // 1. Find the refresh rate required (Hz):
    this.V_FIELD_RATE_RQD = this.INT_RQD ? IP_FREQ_RQD * 2 : IP_FREQ_RQD;
    this.HorizontalActive =
      Math.floor(desired_horizontal_active_pixels / CELL_GRAN_RND) *
      CELL_GRAN_RND;

    this.HorizontalBorder = MARGINS_RQD
      ? Math.floor((this.HorizontalActive * 0) / 100 / CELL_GRAN_RND) *
        CELL_GRAN_RND
      : 0;

    this.VerticalActive = this.INT_RQD
      ? Math.floor(desired_vertical_active_pixels / 2)
      : Math.floor(desired_vertical_active_pixels);
    this.VerticalBorder = MARGINS_RQD
      ? Math.floor((this.VerticalActive * 0) / 100)
      : 0;

    switch (timing_mode) {
      case CVTMode.CRT:
        this.CalculateCRT();
        break;
      case CVTMode.CVT_RB:
        this.CalculateReducedBlanking();
        break;
      case CVTMode.CVT_RB2:
        this.CalculateReducedBlanking();
        break;
    }

    return null;
  }

  CalculateCRT(): void {
    let TOTAL_ACTIVE_PIXELS = this.HorizontalActive + this.HorizontalBorder * 2;
    let INTERLACE = this.INT_RQD ? 0.5 : 0;
    const M_PRIME = 300;
    const MIN_V_PORCH_RND = 3;
    const H_SYNC_PER = 8;

    // 5.3 Computation of "CRT" Timing Parameters
    // 8. Estimate the Horizontal Period (kHz):
    let H_PERIOD_EST: number =
      ((1 / this.V_FIELD_RATE_RQD - MIN_VSYNC_BP / 1000000.0) /
        (this.VerticalActive +
          this.VerticalBorder * 2 +
          MIN_V_PORCH_RND +
          INTERLACE)) *
      1000000.0;
    // 9. Find the number of lines in V sync + back porch:
    this.V_SYNC_BP = Math.floor(MIN_VSYNC_BP / H_PERIOD_EST) + 1;
    if (this.V_SYNC_BP < this.VerticalSyncPulseWidth + MIN_V_BPORCH) {
      this.V_SYNC_BP = this.VerticalSyncPulseWidth + MIN_V_BPORCH;
    }
    // 10. Find the number of lines in V back porch:
    this.VerticalBackPorch = this.V_SYNC_BP - this.VerticalSyncPulseWidth;
    // 11. Find total number of lines in Vertical Field Period:
    this.TOTAL_V_LINES =
      this.VerticalActive +
      this.VerticalBorder * 2 +
      this.V_SYNC_BP +
      INTERLACE +
      MIN_V_PORCH_RND;
    this.VerticalBlanking = this.TOTAL_V_LINES - this.VerticalActive;
    this.VerticalFrontPorch = MIN_V_PORCH_RND;
    // 12. Find the ideal blanking duty cycle from the blanking duty cycle equation (%):
    let IDEAL_DUTY_CYCLE: number = C_PRIME - (M_PRIME * H_PERIOD_EST) / 1000;
    // 13. Find the number of pixels in the horizontal blanking time to the nearest double character cell (limit horizontal blanking so that it is >= 20% of horizontal total):
    if (IDEAL_DUTY_CYCLE < 20) {
      this.HorizontalBlanking =
        Math.floor(
          (TOTAL_ACTIVE_PIXELS * 20) / (100 - 20) / (2 * CELL_GRAN_RND)
        ) *
        (2 * CELL_GRAN_RND);
    } else {
      this.HorizontalBlanking =
        Math.floor(
          (TOTAL_ACTIVE_PIXELS * IDEAL_DUTY_CYCLE) /
            (100 - IDEAL_DUTY_CYCLE) /
            (2 * CELL_GRAN_RND)
        ) *
        (2 * CELL_GRAN_RND);
    }
    // 14. Find the total number of pixels in a line:
    this.TOTAL_PIXELS = TOTAL_ACTIVE_PIXELS + this.HorizontalBlanking;
    this.HorizontalSyncPulseWidth =
      Math.floor((H_SYNC_PER * this.TOTAL_PIXELS) / 100 / CELL_GRAN_RND) *
      CELL_GRAN_RND;
    this.HorizontalBackPorch = this.HorizontalBlanking / 2;
    this.HorizontalFrontPorch =
      this.HorizontalBlanking -
      this.HorizontalSyncPulseWidth -
      this.HorizontalBackPorch;
    // 15. Find Pixel Clock Frequency (MHz):
    this.PixelClockKHz =
      this.CLOCK_STEP *
      Math.floor(this.TOTAL_PIXELS / H_PERIOD_EST / this.CLOCK_STEP);
    // 16. Find actual Horizontal Frequency (kHz):
    this.HorizontalRefreshRate =
      (1000 * this.PixelClockKHz) / this.TOTAL_PIXELS;
    // 17. Find actual Field Rate (Hz):
    let ACT_FIELD_RATE: number =
      (1000 * this.HorizontalRefreshRate) / this.TOTAL_V_LINES;
    // 18. Find actual Refresh Rate (Hz):
    this.VerticalRefreshRate = this.INT_RQD
      ? ACT_FIELD_RATE / 2
      : ACT_FIELD_RATE;
  }
  CalculateReducedBlanking(): void {
    let TOTAL_ACTIVE_PIXELS = this.HorizontalActive + this.HorizontalBorder * 2;
    let INTERLACE = this.INT_RQD ? 0.5 : 0;
    this.HorizontalSyncPulseWidth = 32;
    switch (this.TimingMode) {
      case CVTMode.CVT_RB:
        this.CLOCK_STEP = 0.25;
        this.VerticalFrontPorch = 3;
        this.REFRESH_MULTIPLIER = 1;
        this.HorizontalBlanking = 160;
        break;
      case CVTMode.CVT_RB2:
        this.CLOCK_STEP = 0.001;
        this.VerticalFrontPorch = 1;
        this.VerticalSyncPulseWidth = 8;
        this.REFRESH_MULTIPLIER = 1;
        this.HorizontalBlanking = 80;
        break;
    }

    const RB_MIN_V_BLANK = 460;
    // 5.4 Computation of Reduced Blanking Timing Parameters
    // 8. Estimate the Horizontal Period (kHz):
    let H_PERIOD_EST: number =
      (1000000 / this.V_FIELD_RATE_RQD - RB_MIN_V_BLANK) /
      (this.VerticalActive + this.VerticalBorder * 2);
    // 9. Determine the number of lines in the vertical blanking interval:
    this.VBI_LINES = Math.floor(RB_MIN_V_BLANK / H_PERIOD_EST) + 1;
    // 10. Check Vertical Blanking is Sufficient:
    this.RB_MIN_VBI =
      this.VerticalFrontPorch + this.VerticalSyncPulseWidth + MIN_V_BPORCH;
    this.VerticalBlanking =
      this.VBI_LINES < this.RB_MIN_VBI ? this.RB_MIN_VBI : this.VBI_LINES;
    // 11. Find total number of vertical lines:
    this.TOTAL_V_LINES =
      this.VerticalBlanking +
      this.VerticalActive +
      this.VerticalBorder * 2 +
      INTERLACE;
    this.HorizontalBackPorch = this.HorizontalBlanking / 2;
    this.HorizontalFrontPorch =
      this.HorizontalBlanking -
      this.HorizontalSyncPulseWidth -
      this.HorizontalBackPorch;
    // 12. Find total number of pixel clocks per line:
    this.TOTAL_PIXELS = this.HorizontalBlanking + TOTAL_ACTIVE_PIXELS;
    // 13. Calculate Pixel Clock Frequency to nearest CLOCK_STEP MHz:
    this.PixelClockKHz =
      this.CLOCK_STEP *
      Math.floor(
        (((this.V_FIELD_RATE_RQD * this.TOTAL_V_LINES * this.TOTAL_PIXELS) /
          1000000) *
          this.REFRESH_MULTIPLIER) /
          this.CLOCK_STEP
      );
    // 14. Find actual Horizontal Frequency (kHz):
    this.HorizontalRefreshRate =
      (1000 * this.PixelClockKHz) / this.TOTAL_PIXELS;
    // 15. Find Actual Field Rate (Hz):
    let ACT_FIELD_RATE: number =
      (1000 * this.HorizontalRefreshRate) / this.TOTAL_V_LINES;
    // 16. Find actual Vertical Refresh Rate (Hz)
    this.VerticalRefreshRate = this.INT_RQD
      ? ACT_FIELD_RATE / 2
      : ACT_FIELD_RATE;
  }
}

// Move and refactor this
class AspectRatioHelper {
  Type: AspectRatio;
  constructor(public width: number, public height: number) {
    this.Type = this.toEnum();
  }
  toEnum(): AspectRatio {
    if (this.width / this.height === 4 / 3) {
      return AspectRatio.FourThree;
    } else if (this.width / this.height === 16 / 9) {
      return AspectRatio.SixteenNine;
    } else if (this.width / this.height === 16 / 10) {
      return AspectRatio.SixteenTen;
    } else if (this.width / this.height === 5 / 4) {
      return AspectRatio.FiveFour;
    } else if (this.width / this.height === 15 / 9) {
      return AspectRatio.FifteenNine;
    } else {
      return AspectRatio.OneOne;
    }
  }
  toVerticalSyncPulseWidth(): number {
    // 3 or less Not used by CVT, reserved for existing DMT and GTF
    // 4 4:3 aspect ratio
    // 5 16:9 aspect ratio
    // 6 16:10 aspect ratio
    // 7 5:4 aspect ratio (1280x1024) or 15:9 aspect ratio (1280x768)
    // 8 or more Not used by CVT, reserved for existing DMT and GTF
    // 9 reserved
    // 10 non-standard
    if (this.width / this.height === 4 / 3) {
      return 4;
    } else if (this.width / this.height === 16 / 9) {
      return 5;
    } else if (this.width / this.height === 16 / 10) {
      return 6;
    } else if (this.width / this.height === 5 / 4) {
      return 7;
    } else if (this.width / this.height === 15 / 9) {
      return 7;
    } else {
      return 3;
    }
  }
}

// Update class with values
// this.PixelClockKHz = ACT_PIXEL_FREQ * 1000000;
// this.HorizontalActive = TOTAL_ACTIVE_PIXELS;
// this.HorizontalBlanking = H_BLANK;
// this.HorizontalFrontPorch = H_FRONT_PORCH;
// this.HorizontalSyncPulseWidth = H_SYNC;
// this.VerticalActive = V_LINES_RND;
// this.VerticalBlanking = V_BLANK;
// this.VerticalFrontPorch = V_FRONT_PORCH;
// this.VerticalSyncPulseWidth = V_SYNC_RND;
// this.HorizontalImageSize = TOTAL_ACTIVE_PIXELS;
// this.VerticalImageSize = V_LINES_RND;
// this.HorizontalBorder = TOP_MARGIN;
// this.VerticalBorder = BOT_MARGIN;
// this.Interlaced = INT_RQD;
// this.VerticalRefreshRate = ACT_FRAME_RATE;
// this.StereoMode = this.StereoMode;
// this.Digital = true;
// this.HorizontalSyncPolarity = H_POL;
// this.VerticalSyncPolarity = V_POL;
