// Adapted from https://github.com/tomverbeure/tomverbeure.github.io/blob/master/video_timings_calculator.html
// and VESA Coordinated Video Timings (CVT) Standard Version 1.2
import DetailedTimingDescriptor from "./DetailedTimingDescriptor"
export function calculate_cvt(
    horiz_pixels,
    vert_pixels,
    refresh_rate,
    margins,
    interlaced,
    reduced_blanking,
    video_optimized,
    stereo_mode){

    // map input names to CVT names
    let H_PIXELS            = horiz_pixels;
    let V_LINES             = vert_pixels;
    let IP_FREQ_RQD         = refresh_rate;
    let MARGINS_RQD         = margins;
    let INT_RQD             = interlaced;

    // Table 5-2: Definition of Constants
    const C_PRIME           = 30;
    let CLOCK_STEP          = 0.25  
    const H_SYNC_PER        = 0.08
    const M_PRIME           = 300
    const MIN_V_PORCH_RND   = 3
    const MIN_V_BPORCH      = 6
    const MIN_VSYNC_BP      = 550
    let RB_H_BLANK          = 160
    // const RB_H_SYNC         = 32
    const RB_MIN_V_BLANK    = 460
    let RB_V_FPORCH         = 3
    let REFRESH_MULTIPLIER  = 1

    // Table 5-3: Definition of Variables
    const CELL_GRAN         = 8 
    let CELL_GRAN_RND       = Math.floor(CELL_GRAN);
    let MARGIN_PER          = 0
    let ACT_FIELD_RATE
    let ACT_FRAME_RATE
    let ACT_H_FREQ
    
    let V_SYNC_RND
    let H_PERIOD_EST
    let ACT_VBI_LINES
    let TOTAL_V_LINES
    let TOTAL_PIXELS
    let ACT_PIXEL_FREQ
    let V_SYNC_BP
    let V_BLANK
    let V_FRONT_PORCH
    let H_BACK_PORCH
    // let V_BACK_PORCH
    let IDEAL_DUTY_CYCLE
    let H_BLANK
    let H_SYNC
    // let H_BACK_PORCH
    let H_FRONT_PORCH
    let H_POL               = "Positive";
    let V_POL               = "Negative";
    if (reduced_blanking === "cvt") {
        H_POL               = "Negative";
        V_POL               = "Positive";
    }

    // If cvt this will be recalculated
    V_BLANK = RB_MIN_V_BLANK
    H_BLANK = RB_H_BLANK

    // 5.2 Computation of Common Parameters
    let V_FIELD_RATE_RQD    = INT_RQD ? IP_FREQ_RQD * 2 : IP_FREQ_RQD;
    let H_PIXELS_RND        = Math.floor(H_PIXELS / CELL_GRAN_RND) * CELL_GRAN_RND;
    let LEFT_MARGIN         = MARGINS_RQD ? (Math.floor((H_PIXELS_RND * MARGIN_PER / 100) / CELL_GRAN_RND) * CELL_GRAN_RND) : 0;
    let RIGHT_MARGIN        = LEFT_MARGIN;
    let TOTAL_ACTIVE_PIXELS = H_PIXELS_RND + LEFT_MARGIN + RIGHT_MARGIN;
    let V_LINES_RND         = INT_RQD ? Math.floor(V_LINES / 2) : Math.floor(V_LINES);
    let TOP_MARGIN          = MARGINS_RQD ? Math.floor(V_LINES_RND * MARGIN_PER / 100) : 0;
    let BOT_MARGIN          = TOP_MARGIN;
    let INTERLACE           = INT_RQD ? 0.5 : 0;

    let ver_pixels = INT_RQD ? 2 * V_LINES_RND : V_LINES_RND;
    let hor_pixels_4_3   = CELL_GRAN_RND * Math.round(ver_pixels *  4 /  3) / CELL_GRAN_RND;
    let hor_pixels_16_9  = CELL_GRAN_RND * Math.round(ver_pixels * 16 /  9) / CELL_GRAN_RND;
    let hor_pixels_16_10 = CELL_GRAN_RND * Math.round(ver_pixels * 16 / 10) / CELL_GRAN_RND;
    let hor_pixels_5_4   = CELL_GRAN_RND * Math.round(ver_pixels *  5 /  4) / CELL_GRAN_RND;
    let hor_pixels_15_9  = CELL_GRAN_RND * Math.round(ver_pixels * 15 /  9) / CELL_GRAN_RND;

    let ASPECT_RATIO = "Unknown"
    ASPECT_RATIO = (hor_pixels_4_3 === H_PIXELS_RND)    ?"4:3":
        ASPECT_RATIO = (hor_pixels_16_9 === H_PIXELS_RND)   ?"16:9":
        ASPECT_RATIO = (hor_pixels_16_10 === H_PIXELS_RND)  ?"16:10":
        ASPECT_RATIO = (hor_pixels_5_4 === H_PIXELS_RND)    ?"5:4":
        ASPECT_RATIO = (hor_pixels_15_9 === H_PIXELS_RND)   ?"15:9":0

    switch (ASPECT_RATIO) {
        case "4:3": V_SYNC_RND = 5; break;
        case "16:9": V_SYNC_RND = 6; break;
        case "16:10": V_SYNC_RND = 7; break;
        case "5:4": V_SYNC_RND = 7; break;
        case "15:9": V_SYNC_RND = 10; break;
        default: console.log("aspect ratio not set correctly. ASPECT_RATIO=" + ASPECT_RATIO);
    }
    // Table 5-4: Delta between Original Reduced Blank Timing and Reduced Blank Timing V2
    if (reduced_blanking === "cvt_rb2"){
        CLOCK_STEP = 0.001
        REFRESH_MULTIPLIER = video_optimized ? 1000/1001 : 1;
        RB_H_BLANK = 80
        RB_V_FPORCH = 1
        V_SYNC_RND = 8;
    }
    

    let VBI_LINES = 0;
    let RB_MIN_VBI = 0;

    if (reduced_blanking === "cvt") {
        // 5.3 Computation of "CRT" Timing Parameters
        H_PERIOD_EST = ((1 / V_FIELD_RATE_RQD) - MIN_VSYNC_BP / 1000000.0) / (V_LINES_RND + (2 * TOP_MARGIN) + MIN_V_PORCH_RND + INTERLACE) * 1000000.0;
        V_SYNC_BP = Math.floor(MIN_VSYNC_BP / H_PERIOD_EST) + 1;
        if (V_SYNC_BP < (V_SYNC_RND + MIN_V_BPORCH)){
            V_SYNC_BP = V_SYNC_RND + MIN_V_BPORCH;
        }
        V_BLANK = V_SYNC_BP + MIN_V_PORCH_RND;
        V_FRONT_PORCH = MIN_V_PORCH_RND;
        // V_BACK_PORCH = V_SYNC_BP - V_SYNC_RND;
        TOTAL_V_LINES = V_LINES_RND + TOP_MARGIN + BOT_MARGIN + V_SYNC_BP + INTERLACE + MIN_V_PORCH_RND;
        IDEAL_DUTY_CYCLE = C_PRIME - (M_PRIME * H_PERIOD_EST/1000);
        if (IDEAL_DUTY_CYCLE < 20){
            H_BLANK = Math.floor(TOTAL_ACTIVE_PIXELS * 20 / (100-20) / (2 * CELL_GRAN_RND)) * (2 * CELL_GRAN_RND);
        }
        else{
            H_BLANK = Math.floor(TOTAL_ACTIVE_PIXELS * IDEAL_DUTY_CYCLE / (100 - IDEAL_DUTY_CYCLE) / (2 * CELL_GRAN_RND)) * (2 * CELL_GRAN_RND);
        }
        TOTAL_PIXELS = TOTAL_ACTIVE_PIXELS + H_BLANK;
        ACT_PIXEL_FREQ = CLOCK_STEP * Math.floor(TOTAL_PIXELS / H_PERIOD_EST / CLOCK_STEP);

        // FIll in missing
        
        H_SYNC = Math.floor(H_SYNC_PER * TOTAL_PIXELS / CELL_GRAN_RND) * CELL_GRAN_RND;
        H_BACK_PORCH = H_BLANK / 2; 
        H_FRONT_PORCH = H_BLANK - H_SYNC - H_BACK_PORCH;
    } else {
        // 5.4 Computation of Reduced Blanking Timing Parameters
        H_PERIOD_EST = ((1000000 / V_FIELD_RATE_RQD) - RB_MIN_V_BLANK) / (V_LINES_RND + TOP_MARGIN + BOT_MARGIN);
        VBI_LINES = Math.floor(RB_MIN_V_BLANK / H_PERIOD_EST) + 1;
        RB_MIN_VBI = RB_V_FPORCH + V_SYNC_RND + MIN_V_BPORCH;
        ACT_VBI_LINES = (VBI_LINES < RB_MIN_VBI) ? RB_MIN_VBI : VBI_LINES;
        TOTAL_V_LINES = ACT_VBI_LINES + V_LINES_RND + TOP_MARGIN + BOT_MARGIN + INTERLACE;
        TOTAL_PIXELS = RB_H_BLANK + TOTAL_ACTIVE_PIXELS;
        ACT_PIXEL_FREQ = CLOCK_STEP * Math.floor((V_FIELD_RATE_RQD * TOTAL_V_LINES * TOTAL_PIXELS / 1000000 * REFRESH_MULTIPLIER) / CLOCK_STEP);

        // fill in other elements
        if (reduced_blanking == "cvt_rb2"){
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
    ACT_H_FREQ     = 1000 * ACT_PIXEL_FREQ / TOTAL_PIXELS;
    ACT_FIELD_RATE = 1000 * ACT_H_FREQ / TOTAL_V_LINES;
    ACT_FRAME_RATE = INT_RQD ? ACT_FIELD_RATE / 2 : ACT_FIELD_RATE;

    let dtd = new DetailedTimingDescriptor()
    dtd.PixelClockKHz             = ACT_PIXEL_FREQ * 1000000
    dtd.HorizontalActive          = TOTAL_ACTIVE_PIXELS
    dtd.HorizontalBlanking        = H_BLANK
    dtd.HorizontalFrontPorch      = H_FRONT_PORCH
    dtd.HorizontalSyncPulseWidth  = H_SYNC
    dtd.VerticalActive            = V_LINES_RND
    dtd.VerticalBlanking          = V_BLANK
    dtd.VerticalFrontPorch        = V_FRONT_PORCH
    dtd.VerticalSyncPulseWidth    = V_SYNC_RND
    dtd.HorizontalImageSize       = TOTAL_ACTIVE_PIXELS
    dtd.VerticalImageSize         = V_LINES_RND
    dtd.HorizontalBorder          = TOP_MARGIN
    dtd.VerticalBorder            = BOT_MARGIN
    dtd.Interlaced                = INT_RQD
    dtd.VerticalRefreshRate       = ACT_FRAME_RATE
    dtd.StereoMode                = stereo_mode
    dtd.Digital                   = true
    dtd.HorizontalSyncPolarity    = H_POL
    dtd.VerticalSyncPolarity      = V_POL
    return dtd
}