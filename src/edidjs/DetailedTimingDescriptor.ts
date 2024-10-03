import { DisplayDescriptorInterface, DescriptorType } from "./edid_descriptors";


// TODO: Detect which CVT mode the DTD is in
export class DetailedTimingDescriptor implements DisplayDescriptorInterface {
  raw: Uint8Array = new Uint8Array();
  Type: DescriptorType;
  // Stored Value = Pixel clock ÷ 10,000
  // Range: 10 kHz to 655.35 MHz in 10 kHz steps
  PixelClockKHz: number = 0;

  HorizontalActive: number = 0;
  HorizontalBlanking: number = 0;
  HorizontalFrontPorch: number = 0;
  HorizontalSyncPulseWidth: number = 0;
  VerticalActive: number = 0;
  VerticalBlanking: number = 0;
  VerticalFrontPorch: number = 0;
  VerticalSyncPulseWidth: number = 0;

  HorizontalImageSize: number = 0;
  VerticalImageSize: number = 0;

  HorizontalBorder: number = 0;
  VerticalBorder: number = 0;

  Interlaced: boolean = false;
  StereoMode: string = "";
  Digital: boolean = false;
  Sync: string = "";
  VerticalSyncPolarity: string = "";
  HorizontalSyncPolarity: string = "";
  SyncMode: {
    BipolarCompositeSync: boolean;
    Serrations: boolean;
    SyncOn: string;
  } = { BipolarCompositeSync: false, Serrations: false, SyncOn: "" };

  // Supplemental information
  horTotPix: number = 0;
  verTotPix: number = 0;
  VerticalRefreshRate: number = 0;
  HorizontalRefreshRate: number = 0;

  constructor() {
    this.Type = DescriptorType.DetailedTimingDescriptor;
  }

  Decode(edidBytes: Uint8Array): DisplayDescriptorInterface {
    this.raw = edidBytes;
    this.PixelClockKHz = ((edidBytes[1] << 8) | edidBytes[0]) * 10000;
    this.HorizontalActive = ((edidBytes[4] & 0xf0) << 4) | edidBytes[2];
    this.HorizontalBlanking = edidBytes[3] | ((edidBytes[4] & 0xf) << 8);
    this.VerticalActive = ((edidBytes[7] & 0xf0) << 4) | edidBytes[5];
    this.VerticalBlanking = ((edidBytes[7] & 0xf) << 8) | edidBytes[6];

    this.HorizontalFrontPorch = ((edidBytes[11] & 0xc0) << 2) | edidBytes[8];
    this.HorizontalSyncPulseWidth =
      ((edidBytes[11] & 0x30) << 4) | edidBytes[9];

    this.VerticalFrontPorch =
      (edidBytes[11] & (0xc << 2)) | ((edidBytes[10] & 0xf0) >> 4);
    this.VerticalSyncPulseWidth =
      ((edidBytes[11] & 0x3) << 4) | (edidBytes[10] & 0xf);

    this.HorizontalImageSize = ((edidBytes[14] & 0xf0) << 4) | edidBytes[12];
    this.VerticalImageSize = ((edidBytes[14] & 0xf) << 8) | edidBytes[13];

    this.HorizontalBorder = edidBytes[15];
    this.VerticalBorder = edidBytes[16];
    this.Interlaced = edidBytes[17] & 0x80 ? true : false;

    switch (edidBytes[17] & 0x61) {
      case 0:
        this.StereoMode = "No Stereo";
        break;
      case 1:
        if (edidBytes[17] & 0x1) {
          this.StereoMode = "2-way interleaved, right image on even lines";
        } else {
          this.StereoMode = "Field sequential, right image on sync signal";
        }
        break;
      case 2:
        if (edidBytes[17] & 0x1) {
          this.StereoMode = "2-way interleaved, left image on even lines";
        } else {
          this.StereoMode = "Field sequential, left image on sync signal";
        }
        break;
      case 3:
        if (edidBytes[17] & 0x1) {
          this.StereoMode = "side-by-side interleaved";
        } else {
          this.StereoMode = "4-way interleaved";
        }
        break;
    }
    if ((edidBytes[17] & 0x10) > 0) {
      // Digital
      this.Digital = true;
      if ((edidBytes[17] & 0x8) > 0) {
        // Digital Separate Sync:
        this.Sync = "Separate";
        this.VerticalSyncPolarity =
          (edidBytes[17] & 0x4) > 0 ? "Positive" : "Negative";
        this.HorizontalSyncPolarity =
          (edidBytes[17] & 0x2) > 0 ? "Positive" : "Negative";
      } else {
        // Digital Composite Sync:
        this.SyncMode = "Composite";
        this.SyncMode.Serrations = (edidBytes[17] & 0x4) > 0 ? true : false;
      }
    } else {
      // Analog
      this.Digital = false;
      this.SyncMode.BipolarCompositeSync =
        (edidBytes[17] & 0x8) > 0 ? true : false;
      this.SyncMode.Serrations = (edidBytes[17] & 0x4) > 0 ? true : false;
      this.SyncMode.SyncOn =
        (edidBytes[17] & 0x2) > 0
          ? "Green Signal only"
          : "all three (RGB) video signals";
    }

    // Supplemental information
    this.horTotPix = this.HorizontalActive + this.HorizontalBlanking;
    this.verTotPix = this.VerticalActive + this.VerticalBlanking;
    this.VerticalRefreshRate =
      this.PixelClockKHz / (this.horTotPix * this.verTotPix);
    this.HorizontalRefreshRate = this.PixelClockKHz / this.horTotPix;
    return this;
  }
  Encode(): Uint8Array {
    // Reset the raw array
    this.raw = new Uint8Array(18);
    // Input the data
    this.raw[0] = (this.PixelClockKHz / 10000) & 0xff;
    this.raw[1] = (this.PixelClockKHz / 10000) >> 8;

    this.raw[2] = this.HorizontalActive & 0xff;
    this.raw[3] = this.HorizontalBlanking & 0xff;
    this.raw[4] |= (this.HorizontalActive & 0xf00) >> 4;
    this.raw[4] |= (this.HorizontalBlanking & 0xf00) >> 8;

    this.raw[5] = this.VerticalActive & 0xff;
    this.raw[6] = this.VerticalBlanking & 0xff;
    this.raw[7] |= (this.VerticalActive & 0xf00) >> 4;
    this.raw[7] |= (this.VerticalBlanking & 0xf00) >> 8;

    this.raw[8] = this.HorizontalFrontPorch & 0xff;
    this.raw[11] |= (this.HorizontalFrontPorch & 0x300) >> 2;

    this.raw[9] = this.HorizontalSyncPulseWidth & 0xff;
    this.raw[11] |= (this.HorizontalSyncPulseWidth & 0x300) >> 4;

    this.raw[10] |= (this.VerticalFrontPorch & 0xf) << 4;
    this.raw[11] |= (this.VerticalFrontPorch & 0x30) >> 2;

    this.raw[10] |= this.VerticalSyncPulseWidth & 0xf;
    this.raw[11] |= (this.VerticalSyncPulseWidth & 0x30) >> 4;

    this.raw[12] = this.HorizontalImageSize & 0xff;
    this.raw[13] = this.VerticalImageSize & 0xff;

    this.raw[14] |= (this.HorizontalImageSize & 0xf00) >> 4;
    this.raw[14] |= (this.VerticalImageSize & 0xf00) >> 8;

    this.raw[15] = this.HorizontalBorder;
    this.raw[16] = this.VerticalBorder;

    this.raw[17] |= this.Interlaced ? 0x80 : 0;

    switch (this.StereoMode) {
      case "No Stereo":
        this.raw[17] |= 0;
        break;
      case "Field sequential, right image on sync signal":
        this.raw[17] |= 0x20;
        break;
      case "Field sequential, left image on sync signal":
        this.raw[17] |= 0x40;
        break;
      case "2-way interleaved, right image on even lines":
        this.raw[17] |= 0x21;
        break;
      case "2-way interleaved, left image on even lines":
        this.raw[17] |= 0x41;
        break;
      case "4-way interleaved":
        this.raw[17] |= 0x60;
        break;
      case "side-by-side interleaved":
        this.raw[17] |= 0x61;
        break;
    }
    this.raw[17] |= this.Interlaced ? 0x80 : 0;
    this.raw[17] |= this.Digital ? 0x10 : 0;
    if (this.Sync === "Separate") {
      this.raw[17] |= 0x8;
      this.raw[17] |= this.VerticalSyncPolarity === "Positive" ? 0x4 : 0;
      this.raw[17] |= this.HorizontalSyncPolarity === "Positive" ? 0x2 : 0;
    } else {
      this.raw[17] |= this.Serrations ? 0x4 : 0;
    }
    return this.raw;
  }
  Margins: boolean = false;
  reduced_blanking: string = "cvt";

  // Adapted from https://github.com/tomverbeure/tomverbeure.github.io/blob/master/video_timings_calculator.html
  // and VESA Coordinated Video Timings (CVT) Standard Version 1.2
  ComputeTiming() {
    // map input names to CVT names
    let H_PIXELS: number = this.HorizontalActive;
    let V_LINES: number = this.VerticalActive;
    let IP_FREQ_RQD: number = this.VerticalRefreshRate;
    let MARGINS_RQD: boolean = this.Margins;
    let INT_RQD: boolean = this.Interlaced;
    // Table 5-2: Definition of Constants
    const C_PRIME = 30;
    let CLOCK_STEP = 0.25;
    const H_SYNC_PER = 0.08;
    const M_PRIME = 300;
    const MIN_V_PORCH_RND = 3;
    const MIN_V_BPORCH = 6;
    const MIN_VSYNC_BP = 550;
    let RB_H_BLANK = 160;
    // const RB_H_SYNC         = 32
    const RB_MIN_V_BLANK = 460;
    let RB_V_FPORCH = 3;
    let REFRESH_MULTIPLIER = 1;
    // Table 5-3: Definition of Variables
    const CELL_GRAN = 8;
    let CELL_GRAN_RND = Math.floor(CELL_GRAN);
    let MARGIN_PER = 0;
    let ACT_FIELD_RATE;
    let ACT_FRAME_RATE;
    let ACT_H_FREQ;
    let V_SYNC_RND: number;
    let H_PERIOD_EST;
    let ACT_VBI_LINES;
    let TOTAL_V_LINES;
    let TOTAL_PIXELS;
    let ACT_PIXEL_FREQ;
    let V_SYNC_BP;
    let V_BLANK;
    let V_FRONT_PORCH;
    let H_BACK_PORCH;
    // let V_BACK_PORCH
    let IDEAL_DUTY_CYCLE;
    let H_BLANK;
    let H_SYNC;
    // let H_BACK_PORCH
    let H_FRONT_PORCH;
    let H_POL = "Positive";
    let V_POL = "Negative";
    if (this.reduced_blanking === "cvt") {
      H_POL = "Negative";
      V_POL = "Positive";
    }
    // If cvt this will be recalculated
    V_BLANK = RB_MIN_V_BLANK;
    H_BLANK = RB_H_BLANK;

    // 5.2 Computation of Common Parameters
    let V_FIELD_RATE_RQD = INT_RQD ? IP_FREQ_RQD * 2 : IP_FREQ_RQD;
    let H_PIXELS_RND = Math.floor(H_PIXELS / CELL_GRAN_RND) * CELL_GRAN_RND;
    let LEFT_MARGIN = MARGINS_RQD
      ? Math.floor((H_PIXELS_RND * MARGIN_PER) / 100 / CELL_GRAN_RND) *
        CELL_GRAN_RND
      : 0;
    let RIGHT_MARGIN = LEFT_MARGIN;
    let TOTAL_ACTIVE_PIXELS = H_PIXELS_RND + LEFT_MARGIN + RIGHT_MARGIN;
    let V_LINES_RND = INT_RQD ? Math.floor(V_LINES / 2) : Math.floor(V_LINES);
    let TOP_MARGIN = MARGINS_RQD
      ? Math.floor((V_LINES_RND * MARGIN_PER) / 100)
      : 0;
    let BOT_MARGIN = TOP_MARGIN;
    let INTERLACE = INT_RQD ? 0.5 : 0;

    let ver_pixels = INT_RQD ? 2 * V_LINES_RND : V_LINES_RND;
    let hor_pixels_4_3 =
      (CELL_GRAN_RND * Math.round((ver_pixels * 4) / 3)) / CELL_GRAN_RND;
    let hor_pixels_16_9 =
      (CELL_GRAN_RND * Math.round((ver_pixels * 16) / 9)) / CELL_GRAN_RND;
    let hor_pixels_16_10 =
      (CELL_GRAN_RND * Math.round((ver_pixels * 16) / 10)) / CELL_GRAN_RND;
    let hor_pixels_5_4 =
      (CELL_GRAN_RND * Math.round((ver_pixels * 5) / 4)) / CELL_GRAN_RND;
    let hor_pixels_15_9 =
      (CELL_GRAN_RND * Math.round((ver_pixels * 15) / 9)) / CELL_GRAN_RND;

    let ASPECT_RATIO = "Unknown";
    ASPECT_RATIO =
      hor_pixels_4_3 === H_PIXELS_RND
        ? "4:3"
        : (ASPECT_RATIO =
            hor_pixels_16_9 === H_PIXELS_RND
              ? "16:9"
              : (ASPECT_RATIO =
                  hor_pixels_16_10 === H_PIXELS_RND
                    ? "16:10"
                    : (ASPECT_RATIO =
                        hor_pixels_5_4 === H_PIXELS_RND
                          ? "5:4"
                          : (ASPECT_RATIO =
                              hor_pixels_15_9 === H_PIXELS_RND ? "15:9" : 0))));

    switch (ASPECT_RATIO) {
      case "4:3":
        V_SYNC_RND = 5;
        break;
      case "16:9":
        V_SYNC_RND = 6;
        break;
      case "16:10":
        V_SYNC_RND = 7;
        break;
      case "5:4":
        V_SYNC_RND = 7;
        break;
      case "15:9":
        V_SYNC_RND = 10;
        break;
      default:
        console.log(
          "aspect ratio not set correctly. ASPECT_RATIO=" + ASPECT_RATIO
        );
    }
    // Table 5-4: Delta between Original Reduced Blank Timing and Reduced Blank Timing V2
    if (this.reduced_blanking === "cvt_rb2") {
      CLOCK_STEP = 0.001;
      REFRESH_MULTIPLIER = video_optimized ? 1000 / 1001 : 1;
      RB_H_BLANK = 80;
      RB_V_FPORCH = 1;
      V_SYNC_RND = 8;
    }

    let VBI_LINES = 0;
    let RB_MIN_VBI = 0;

    if (this.reduced_blanking === "cvt") {
      // 5.3 Computation of "CRT" Timing Parameters
      H_PERIOD_EST =
        ((1 / V_FIELD_RATE_RQD - MIN_VSYNC_BP / 1000000.0) /
          (V_LINES_RND + 2 * TOP_MARGIN + MIN_V_PORCH_RND + INTERLACE)) *
        1000000.0;
      V_SYNC_BP = Math.floor(MIN_VSYNC_BP / H_PERIOD_EST) + 1;
      if (V_SYNC_BP < V_SYNC_RND + MIN_V_BPORCH) {
        V_SYNC_BP = V_SYNC_RND + MIN_V_BPORCH;
      }
      V_BLANK = V_SYNC_BP + MIN_V_PORCH_RND;
      V_FRONT_PORCH = MIN_V_PORCH_RND;
      // V_BACK_PORCH = V_SYNC_BP - V_SYNC_RND;
      TOTAL_V_LINES =
        V_LINES_RND +
        TOP_MARGIN +
        BOT_MARGIN +
        V_SYNC_BP +
        INTERLACE +
        MIN_V_PORCH_RND;
      IDEAL_DUTY_CYCLE = C_PRIME - (M_PRIME * H_PERIOD_EST) / 1000;
      if (IDEAL_DUTY_CYCLE < 20) {
        H_BLANK =
          Math.floor(
            (TOTAL_ACTIVE_PIXELS * 20) / (100 - 20) / (2 * CELL_GRAN_RND)
          ) *
          (2 * CELL_GRAN_RND);
      } else {
        H_BLANK =
          Math.floor(
            (TOTAL_ACTIVE_PIXELS * IDEAL_DUTY_CYCLE) /
              (100 - IDEAL_DUTY_CYCLE) /
              (2 * CELL_GRAN_RND)
          ) *
          (2 * CELL_GRAN_RND);
      }
      TOTAL_PIXELS = TOTAL_ACTIVE_PIXELS + H_BLANK;
      ACT_PIXEL_FREQ =
        CLOCK_STEP * Math.floor(TOTAL_PIXELS / H_PERIOD_EST / CLOCK_STEP);

      // FIll in missing

      H_SYNC =
        Math.floor((H_SYNC_PER * TOTAL_PIXELS) / CELL_GRAN_RND) * CELL_GRAN_RND;
      H_BACK_PORCH = H_BLANK / 2;
      H_FRONT_PORCH = H_BLANK - H_SYNC - H_BACK_PORCH;
    } else {
      // 5.4 Computation of Reduced Blanking Timing Parameters
      H_PERIOD_EST =
        (1000000 / V_FIELD_RATE_RQD - RB_MIN_V_BLANK) /
        (V_LINES_RND + TOP_MARGIN + BOT_MARGIN);
      VBI_LINES = Math.floor(RB_MIN_V_BLANK / H_PERIOD_EST) + 1;
      RB_MIN_VBI = RB_V_FPORCH + V_SYNC_RND + MIN_V_BPORCH;
      ACT_VBI_LINES = VBI_LINES < RB_MIN_VBI ? RB_MIN_VBI : VBI_LINES;
      TOTAL_V_LINES =
        ACT_VBI_LINES + V_LINES_RND + TOP_MARGIN + BOT_MARGIN + INTERLACE;
      TOTAL_PIXELS = RB_H_BLANK + TOTAL_ACTIVE_PIXELS;
      ACT_PIXEL_FREQ =
        CLOCK_STEP *
        Math.floor(
          (((V_FIELD_RATE_RQD * TOTAL_V_LINES * TOTAL_PIXELS) / 1000000) *
            REFRESH_MULTIPLIER) /
            CLOCK_STEP
        );

      // fill in other elements
      if (this.reduced_blanking == "cvt_rb2") {
        V_BLANK = ACT_VBI_LINES;
        V_FRONT_PORCH = ACT_VBI_LINES - V_SYNC_RND - 6;
        // V_BACK_PORCH  = 6;

        H_SYNC = 32;
        H_BACK_PORCH = 40;
        H_FRONT_PORCH = H_BLANK - H_SYNC - H_BACK_PORCH;
      } else {
        V_BLANK = ACT_VBI_LINES;
        V_FRONT_PORCH = 3;
        // V_BACK_PORCH  = ACT_VBI_LINES - V_FRONT_PORCH - V_SYNC_RND;

        H_SYNC = 32;
        H_BACK_PORCH = 80;
        H_FRONT_PORCH = H_BLANK - H_SYNC - H_BACK_PORCH;
      }
    }
    ACT_H_FREQ = (1000 * ACT_PIXEL_FREQ) / TOTAL_PIXELS;
    ACT_FIELD_RATE = (1000 * ACT_H_FREQ) / TOTAL_V_LINES;
    ACT_FRAME_RATE = INT_RQD ? ACT_FIELD_RATE / 2 : ACT_FIELD_RATE;
    // Update class with values
    this.PixelClockKHz = ACT_PIXEL_FREQ * 1000000;
    this.HorizontalActive = TOTAL_ACTIVE_PIXELS;
    this.HorizontalBlanking = H_BLANK;
    this.HorizontalFrontPorch = H_FRONT_PORCH;
    this.HorizontalSyncPulseWidth = H_SYNC;
    this.VerticalActive = V_LINES_RND;
    this.VerticalBlanking = V_BLANK;
    this.VerticalFrontPorch = V_FRONT_PORCH;
    this.VerticalSyncPulseWidth = V_SYNC_RND;
    this.HorizontalImageSize = TOTAL_ACTIVE_PIXELS;
    this.VerticalImageSize = V_LINES_RND;
    this.HorizontalBorder = TOP_MARGIN;
    this.VerticalBorder = BOT_MARGIN;
    this.Interlaced = INT_RQD;
    this.VerticalRefreshRate = ACT_FRAME_RATE;
    this.StereoMode = this.StereoMode;
    this.Digital = true;
    this.HorizontalSyncPolarity = H_POL;
    this.VerticalSyncPolarity = V_POL;
  }
}
