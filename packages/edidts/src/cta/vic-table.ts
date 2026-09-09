import { DetailedTimingDescriptor, isDetailedTimingEncodable } from '../common/detailed-timing-descriptor';

/**
 * VIC (Video Identification Code) Table
 *
 * Per CTA-861-G Table 3 — Video Identification Codes (and Table 2 for the
 * detailed H/V sync offset/width/polarity). Contains all standard video formats
 * with their timing parameters, including the per-VIC short-form sync fields
 * needed to reconstruct a DTD byte-exact from a VIC (see
 * {@link generateDetailedTimingFromVIC}).
 *
 * Source: the coarse fields (width/height/pixelClock/hTotal/vTotal/interlaced)
 * and the per-VIC sync fields below were transcribed from edid-decode's
 * `edid_cta_modes1` / `edid_cta_modes2` arrays (the reference CTA-861-G Table 3
 * transcription; v4l-utils, https://git.linuxtv.org/v4l-utils.git) and
 * cross-checked against CTA-861-G Table 3 / Table 2 in the repo-root
 * `CTA-861-G_FINAL_revised_2017.pdf`.
 *
 * Double-clocked VICs (6,7,8,9,21,22,23,24,44,45,50,51,54,55,58,59 — the
 * "720(1440)x480i/576i" family): CTA-861-G Table 3 Note 2 publishes these in
 * transport form (Hactive=1440, double-clocked pixel clock). This table stores
 * the DISPLAYED form (width=720, pixelClock and hTotal halved) so the VIC list
 * reads naturally in the UI ("720x480i"), and the per-VIC H sync/porch fields
 * are scaled by ½ to stay consistent with that displayed hTotal. V sync/porch
 * are per-line and unscaled. The {@link generateDetailedTimingFromVIC} builder
 * therefore emits a displayed-form (720, ½-clock) DTD for these VICs.
 *
 * 19 VICs (91, 92, 124-127, 193, 195-199, 203-204, 206-207, 210-211, 213-214)
 * had pre-existing transcription errors in hTotal/vTotal (pixelClock/width were
 * already correct); they are corrected here to the Table 3 / edid-decode values.
 */

export interface VICDefinition {
  vic: number;
  width: number;
  height: number;
  refreshRate: number;
  interlaced: boolean;
  aspectRatio: '4:3' | '16:9' | '64:27' | '256:135' | '16:10' | '5:4' | '15:9' | '21:9' | '1:1';
  pixelClock: number; // MHz
  hTotal: number;
  vTotal: number;
  /** Horizontal sync offset = H front porch (pixels). From CTA-861-G Table 3. */
  horizontalSyncOffset: number;
  /** Horizontal sync width (pixels). From CTA-861-G Table 3. */
  horizontalSyncWidth: number;
  /** Vertical sync offset = V front porch (lines). From CTA-861-G Table 3. */
  verticalSyncOffset: number;
  /** Vertical sync width (lines). From CTA-861-G Table 3. */
  verticalSyncWidth: number;
  /** Horizontal sync polarity. From CTA-861-G Table 2. */
  hSyncPolarity: 'positive' | 'negative';
  /** Vertical sync polarity. From CTA-861-G Table 2. */
  vSyncPolarity: 'positive' | 'negative';
  /** Horizontal border, one side (pixels). 0 for all CTA-861 VICs. */
  horizontalBorder: number;
  /** Vertical border, one side (lines). 0 for all CTA-861 VICs. */
  verticalBorder: number;
  name: string;
}

/**
 * Complete VIC table per CTA-861-G
 * VICs 1-127, 193-219
 */
export const VIC_TABLE: VICDefinition[] = [
  // VIC 1-4: 640x480, 720x480
  { vic: 1, width: 640, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 25.175, hTotal: 800, vTotal: 525, horizontalSyncOffset: 16, horizontalSyncWidth: 96, verticalSyncOffset: 10, verticalSyncWidth: 2, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '640x480p @ 60Hz 4:3' },
  { vic: 2, width: 720, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 858, vTotal: 525, horizontalSyncOffset: 16, horizontalSyncWidth: 62, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x480p @ 60Hz 4:3' },
  { vic: 3, width: 720, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 858, vTotal: 525, horizontalSyncOffset: 16, horizontalSyncWidth: 62, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x480p @ 60Hz 16:9' },
  { vic: 4, width: 1280, height: 720, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 1650, vTotal: 750, horizontalSyncOffset: 110, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 60Hz' },
  
  // VIC 5-6: 1080i
  { vic: 5, width: 1920, height: 1080, refreshRate: 60, interlaced: true, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2200, vTotal: 562.5, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 2, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080i @ 60Hz' },
  { vic: 6, width: 720, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 858, vTotal: 262.5, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x480i @ 60Hz 4:3' },
  { vic: 7, width: 720, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 858, vTotal: 262.5, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x480i @ 60Hz 16:9' },
  
  // VIC 8-9: 240p (doubled)
  { vic: 8, width: 720, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 858, vTotal: 262, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x240p @ 60Hz 4:3' },
  { vic: 9, width: 720, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 858, vTotal: 262, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x240p @ 60Hz 16:9' },
  
  // VIC 10-13: 2880x480i/240p
  { vic: 10, width: 2880, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3432, vTotal: 262.5, horizontalSyncOffset: 76, horizontalSyncWidth: 248, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x480i @ 60Hz 4:3' },
  { vic: 11, width: 2880, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3432, vTotal: 262.5, horizontalSyncOffset: 76, horizontalSyncWidth: 248, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x480i @ 60Hz 16:9' },
  { vic: 12, width: 2880, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3432, vTotal: 262, horizontalSyncOffset: 76, horizontalSyncWidth: 248, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x240p @ 60Hz 4:3' },
  { vic: 13, width: 2880, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3432, vTotal: 262, horizontalSyncOffset: 76, horizontalSyncWidth: 248, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x240p @ 60Hz 16:9' },
  
  // VIC 14-15: 1440x480p
  { vic: 14, width: 1440, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 1716, vTotal: 525, horizontalSyncOffset: 32, horizontalSyncWidth: 124, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '1440x480p @ 60Hz 4:3' },
  { vic: 15, width: 1440, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 1716, vTotal: 525, horizontalSyncOffset: 32, horizontalSyncWidth: 124, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '1440x480p @ 60Hz 16:9' },
  
  // VIC 16: 1080p60 - Most common
  { vic: 16, width: 1920, height: 1080, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2200, vTotal: 1125, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 60Hz' },
  
  // VIC 17-18: 720x576p (PAL)
  { vic: 17, width: 720, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 864, vTotal: 625, horizontalSyncOffset: 12, horizontalSyncWidth: 64, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x576p @ 50Hz 4:3' },
  { vic: 18, width: 720, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 864, vTotal: 625, horizontalSyncOffset: 12, horizontalSyncWidth: 64, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x576p @ 50Hz 16:9' },
  
  // VIC 19: 720p50
  { vic: 19, width: 1280, height: 720, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 1980, vTotal: 750, horizontalSyncOffset: 440, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 50Hz' },
  
  // VIC 20: 1080i50
  { vic: 20, width: 1920, height: 1080, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2640, vTotal: 562.5, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 2, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080i @ 50Hz' },
  
  // VIC 21-22: 576i
  { vic: 21, width: 720, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 864, vTotal: 312.5, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x576i @ 50Hz 4:3' },
  { vic: 22, width: 720, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 864, vTotal: 312.5, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x576i @ 50Hz 16:9' },
  
  // VIC 23-24: 288p
  { vic: 23, width: 720, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 864, vTotal: 312, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x288p @ 50Hz 4:3' },
  { vic: 24, width: 720, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 864, vTotal: 312, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x288p @ 50Hz 16:9' },
  
  // VIC 25-28: 2880x576i/288p
  { vic: 25, width: 2880, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3456, vTotal: 312.5, horizontalSyncOffset: 48, horizontalSyncWidth: 252, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x576i @ 50Hz 4:3' },
  { vic: 26, width: 2880, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3456, vTotal: 312.5, horizontalSyncOffset: 48, horizontalSyncWidth: 252, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x576i @ 50Hz 16:9' },
  { vic: 27, width: 2880, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3456, vTotal: 312, horizontalSyncOffset: 48, horizontalSyncWidth: 252, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x288p @ 50Hz 4:3' },
  { vic: 28, width: 2880, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3456, vTotal: 312, horizontalSyncOffset: 48, horizontalSyncWidth: 252, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x288p @ 50Hz 16:9' },
  
  // VIC 29-30: 1440x576p
  { vic: 29, width: 1440, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 1728, vTotal: 625, horizontalSyncOffset: 24, horizontalSyncWidth: 128, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '1440x576p @ 50Hz 4:3' },
  { vic: 30, width: 1440, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 1728, vTotal: 625, horizontalSyncOffset: 24, horizontalSyncWidth: 128, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '1440x576p @ 50Hz 16:9' },
  
  // VIC 31: 1080p50
  { vic: 31, width: 1920, height: 1080, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2640, vTotal: 1125, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 50Hz' },
  
  // VIC 32: 1080p24
  { vic: 32, width: 1920, height: 1080, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2750, vTotal: 1125, horizontalSyncOffset: 638, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 24Hz' },
  
  // VIC 33: 1080p25
  { vic: 33, width: 1920, height: 1080, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2640, vTotal: 1125, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 25Hz' },
  
  // VIC 34: 1080p30
  { vic: 34, width: 1920, height: 1080, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2200, vTotal: 1125, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 30Hz' },
  
  // VIC 35-38: 2880x480p/576p
  { vic: 35, width: 2880, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 3432, vTotal: 525, horizontalSyncOffset: 64, horizontalSyncWidth: 248, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x480p @ 60Hz 4:3' },
  { vic: 36, width: 2880, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 3432, vTotal: 525, horizontalSyncOffset: 64, horizontalSyncWidth: 248, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x480p @ 60Hz 16:9' },
  { vic: 37, width: 2880, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 3456, vTotal: 625, horizontalSyncOffset: 48, horizontalSyncWidth: 256, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x576p @ 50Hz 4:3' },
  { vic: 38, width: 2880, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 3456, vTotal: 625, horizontalSyncOffset: 48, horizontalSyncWidth: 256, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '2880x576p @ 50Hz 16:9' },
  
  // VIC 39: 1080i50 (1250 total)
  { vic: 39, width: 1920, height: 1080, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 72.0, hTotal: 2304, vTotal: 625, horizontalSyncOffset: 32, horizontalSyncWidth: 168, verticalSyncOffset: 23, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080i @ 50Hz (1250 total)' },
  
  // VIC 40-41: 1080i100/120
  { vic: 40, width: 1920, height: 1080, refreshRate: 100, interlaced: true, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2640, vTotal: 562.5, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 2, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080i @ 100Hz' },
  { vic: 41, width: 1280, height: 720, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 1980, vTotal: 750, horizontalSyncOffset: 440, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 100Hz' },
  
  // VIC 42-43: 576p100, 576i100
  { vic: 42, width: 720, height: 576, refreshRate: 100, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 864, vTotal: 625, horizontalSyncOffset: 12, horizontalSyncWidth: 64, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x576p @ 100Hz 4:3' },
  { vic: 43, width: 720, height: 576, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 864, vTotal: 625, horizontalSyncOffset: 12, horizontalSyncWidth: 64, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x576p @ 100Hz 16:9' },
  
  // VIC 44-45: 576i100
  { vic: 44, width: 720, height: 576, refreshRate: 100, interlaced: true, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 864, vTotal: 312.5, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x576i @ 100Hz 4:3' },
  { vic: 45, width: 720, height: 576, refreshRate: 100, interlaced: true, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 864, vTotal: 312.5, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x576i @ 100Hz 16:9' },
  
  // VIC 46-47: 1080i120, 720p120
  { vic: 46, width: 1920, height: 1080, refreshRate: 120, interlaced: true, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2200, vTotal: 562.5, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 2, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080i @ 120Hz' },
  { vic: 47, width: 1280, height: 720, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 1650, vTotal: 750, horizontalSyncOffset: 110, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 120Hz' },
  
  // VIC 48-51: 480p/480i 120Hz
  { vic: 48, width: 720, height: 480, refreshRate: 120, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 858, vTotal: 525, horizontalSyncOffset: 16, horizontalSyncWidth: 62, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x480p @ 120Hz 4:3' },
  { vic: 49, width: 720, height: 480, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 858, vTotal: 525, horizontalSyncOffset: 16, horizontalSyncWidth: 62, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x480p @ 120Hz 16:9' },
  { vic: 50, width: 720, height: 480, refreshRate: 120, interlaced: true, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 858, vTotal: 262.5, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x480i @ 120Hz 4:3' },
  { vic: 51, width: 720, height: 480, refreshRate: 120, interlaced: true, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 858, vTotal: 262.5, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x480i @ 120Hz 16:9' },
  
  // VIC 52-55: 576p/576i 200Hz
  { vic: 52, width: 720, height: 576, refreshRate: 200, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 864, vTotal: 625, horizontalSyncOffset: 12, horizontalSyncWidth: 64, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x576p @ 200Hz 4:3' },
  { vic: 53, width: 720, height: 576, refreshRate: 200, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 864, vTotal: 625, horizontalSyncOffset: 12, horizontalSyncWidth: 64, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x576p @ 200Hz 16:9' },
  { vic: 54, width: 720, height: 576, refreshRate: 200, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 864, vTotal: 312.5, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x576i @ 200Hz 4:3' },
  { vic: 55, width: 720, height: 576, refreshRate: 200, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 864, vTotal: 312.5, horizontalSyncOffset: 12, horizontalSyncWidth: 63, verticalSyncOffset: 2, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x576i @ 200Hz 16:9' },
  
  // VIC 56-59: 480p/480i 240Hz
  { vic: 56, width: 720, height: 480, refreshRate: 240, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 858, vTotal: 525, horizontalSyncOffset: 16, horizontalSyncWidth: 62, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x480p @ 240Hz 4:3' },
  { vic: 57, width: 720, height: 480, refreshRate: 240, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 858, vTotal: 525, horizontalSyncOffset: 16, horizontalSyncWidth: 62, verticalSyncOffset: 9, verticalSyncWidth: 6, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720x480p @ 240Hz 16:9' },
  { vic: 58, width: 720, height: 480, refreshRate: 240, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 858, vTotal: 262.5, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x480i @ 240Hz 4:3' },
  { vic: 59, width: 720, height: 480, refreshRate: 240, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 858, vTotal: 262.5, horizontalSyncOffset: 19, horizontalSyncWidth: 62, verticalSyncOffset: 4, verticalSyncWidth: 3, hSyncPolarity: 'negative', vSyncPolarity: 'negative', horizontalBorder: 0, verticalBorder: 0, name: '720(1440)x480i @ 240Hz 16:9' },
  
  // VIC 60-64: 720p/1080p extended
  { vic: 60, width: 1280, height: 720, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 59.4, hTotal: 3300, vTotal: 750, horizontalSyncOffset: 1760, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 24Hz' },
  { vic: 61, width: 1280, height: 720, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 3960, vTotal: 750, horizontalSyncOffset: 2420, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 25Hz' },
  { vic: 62, width: 1280, height: 720, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 3300, vTotal: 750, horizontalSyncOffset: 1760, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 30Hz' },
  { vic: 63, width: 1920, height: 1080, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 2200, vTotal: 1125, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 120Hz' },
  { vic: 64, width: 1920, height: 1080, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 2640, vTotal: 1125, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 100Hz' },
  
  // VIC 65-92: Extended formats (CTA-861-F and later)
  { vic: 65, width: 1280, height: 720, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 3300, vTotal: 750, horizontalSyncOffset: 1760, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 24Hz 64:27' },
  { vic: 66, width: 1280, height: 720, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 3960, vTotal: 750, horizontalSyncOffset: 2420, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 25Hz 64:27' },
  { vic: 67, width: 1280, height: 720, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 3300, vTotal: 750, horizontalSyncOffset: 1760, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 30Hz 64:27' },
  { vic: 68, width: 1280, height: 720, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 1980, vTotal: 750, horizontalSyncOffset: 440, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 50Hz 64:27' },
  { vic: 69, width: 1280, height: 720, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 1650, vTotal: 750, horizontalSyncOffset: 110, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 60Hz 64:27' },
  { vic: 70, width: 1280, height: 720, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 1980, vTotal: 750, horizontalSyncOffset: 440, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 100Hz 64:27' },
  { vic: 71, width: 1280, height: 720, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 1650, vTotal: 750, horizontalSyncOffset: 110, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 120Hz 64:27' },
  { vic: 72, width: 1920, height: 1080, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 2750, vTotal: 1125, horizontalSyncOffset: 638, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 24Hz 64:27' },
  { vic: 73, width: 1920, height: 1080, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 2640, vTotal: 1125, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 25Hz 64:27' },
  { vic: 74, width: 1920, height: 1080, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 2200, vTotal: 1125, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 30Hz 64:27' },
  { vic: 75, width: 1920, height: 1080, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 2640, vTotal: 1125, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 50Hz 64:27' },
  { vic: 76, width: 1920, height: 1080, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 2200, vTotal: 1125, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 60Hz 64:27' },
  { vic: 77, width: 1920, height: 1080, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 2640, vTotal: 1125, horizontalSyncOffset: 528, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 100Hz 64:27' },
  { vic: 78, width: 1920, height: 1080, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 2200, vTotal: 1125, horizontalSyncOffset: 88, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 120Hz 64:27' },
  { vic: 79, width: 1680, height: 720, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 3300, vTotal: 750, horizontalSyncOffset: 1360, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 24Hz' },
  { vic: 80, width: 1680, height: 720, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 3168, vTotal: 750, horizontalSyncOffset: 1228, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 25Hz' },
  { vic: 81, width: 1680, height: 720, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 2640, vTotal: 750, horizontalSyncOffset: 700, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 30Hz' },
  { vic: 82, width: 1680, height: 720, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 82.5, hTotal: 2200, vTotal: 750, horizontalSyncOffset: 260, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 50Hz' },
  { vic: 83, width: 1680, height: 720, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 99.0, hTotal: 2200, vTotal: 750, horizontalSyncOffset: 260, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 60Hz' },
  { vic: 84, width: 1680, height: 720, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 165.0, hTotal: 2000, vTotal: 825, horizontalSyncOffset: 60, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 100Hz' },
  { vic: 85, width: 1680, height: 720, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 198.0, hTotal: 2000, vTotal: 825, horizontalSyncOffset: 60, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 120Hz' },
  { vic: 86, width: 2560, height: 1080, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 99.0, hTotal: 3750, vTotal: 1100, horizontalSyncOffset: 998, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 24Hz' },
  { vic: 87, width: 2560, height: 1080, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 90.0, hTotal: 3200, vTotal: 1125, horizontalSyncOffset: 448, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 25Hz' },
  { vic: 88, width: 2560, height: 1080, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 118.8, hTotal: 3520, vTotal: 1125, horizontalSyncOffset: 768, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 30Hz' },
  { vic: 89, width: 2560, height: 1080, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 185.625, hTotal: 3300, vTotal: 1125, horizontalSyncOffset: 548, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 50Hz' },
  { vic: 90, width: 2560, height: 1080, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 198.0, hTotal: 3000, vTotal: 1100, horizontalSyncOffset: 248, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 60Hz' },
  { vic: 91, width: 2560, height: 1080, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 371.25, hTotal: 2970, vTotal: 1250, horizontalSyncOffset: 218, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 100Hz' },
  { vic: 92, width: 2560, height: 1080, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 495.0, hTotal: 3300, vTotal: 1250, horizontalSyncOffset: 548, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 120Hz' },
  
  // VIC 93-97: 4K 16:9
  { vic: 93, width: 3840, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 1276, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 24Hz' },
  { vic: 94, width: 3840, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 1056, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 25Hz' },
  { vic: 95, width: 3840, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 176, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 30Hz' },
  { vic: 96, width: 3840, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 594.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 1056, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 50Hz' },
  { vic: 97, width: 3840, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 594.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 176, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 60Hz' },
  
  // 4096x2160 (Cinema 4K)
  { vic: 98, width: 4096, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '256:135', pixelClock: 297.0, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 1020, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 24Hz' },
  { vic: 99, width: 4096, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '256:135', pixelClock: 297.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 968, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 25Hz' },
  { vic: 100, width: 4096, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '256:135', pixelClock: 297.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 88, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 30Hz' },
  { vic: 101, width: 4096, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '256:135', pixelClock: 594.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 968, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 50Hz' },
  { vic: 102, width: 4096, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '256:135', pixelClock: 594.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 88, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 60Hz' },
  
  // VIC 103-107: 3840x2160 64:27 (21:9 equivalent)
  { vic: 103, width: 3840, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 1276, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 24Hz 64:27' },
  { vic: 104, width: 3840, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 1056, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 25Hz 64:27' },
  { vic: 105, width: 3840, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 176, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 30Hz 64:27' },
  { vic: 106, width: 3840, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 594.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 1056, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 50Hz 64:27' },
  { vic: 107, width: 3840, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 594.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 176, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 60Hz 64:27' },
  
  // VIC 108-112: 1280x720 16:9 high refresh
  { vic: 108, width: 1280, height: 720, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 90.0, hTotal: 2500, vTotal: 750, horizontalSyncOffset: 960, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 48Hz' },
  { vic: 109, width: 1280, height: 720, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 90.0, hTotal: 2500, vTotal: 750, horizontalSyncOffset: 960, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1280x720p @ 48Hz 64:27' },
  { vic: 110, width: 1680, height: 720, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 99.0, hTotal: 2750, vTotal: 750, horizontalSyncOffset: 810, horizontalSyncWidth: 40, verticalSyncOffset: 5, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1680x720p @ 48Hz' },
  { vic: 111, width: 1920, height: 1080, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2750, vTotal: 1125, horizontalSyncOffset: 638, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 48Hz' },
  { vic: 112, width: 1920, height: 1080, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 2750, vTotal: 1125, horizontalSyncOffset: 638, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '1920x1080p @ 48Hz 64:27' },
  
  // VIC 113-117: 2560x1080 48Hz and 4K 48Hz
  { vic: 113, width: 2560, height: 1080, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 198.0, hTotal: 3750, vTotal: 1100, horizontalSyncOffset: 998, horizontalSyncWidth: 44, verticalSyncOffset: 4, verticalSyncWidth: 5, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '2560x1080p @ 48Hz' },
  { vic: 114, width: 3840, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 594.0, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 1276, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 48Hz' },
  { vic: 115, width: 4096, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '256:135', pixelClock: 594.0, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 1020, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 48Hz' },
  { vic: 116, width: 3840, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 594.0, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 1276, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 48Hz 64:27' },
  { vic: 117, width: 3840, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 1056, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 100Hz' },
  
  // VIC 118-120: 4K 120Hz
  { vic: 118, width: 3840, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 176, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 120Hz' },
  { vic: 119, width: 3840, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 1056, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 100Hz 64:27' },
  { vic: 120, width: 3840, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 176, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '3840x2160p @ 120Hz 64:27' },
  
  // VIC 121-127: 5120x2160 (5K ultrawide)
  { vic: 121, width: 5120, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 396.0, hTotal: 7500, vTotal: 2200, horizontalSyncOffset: 1996, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 24Hz' },
  { vic: 122, width: 5120, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 396.0, hTotal: 7200, vTotal: 2200, horizontalSyncOffset: 1696, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 25Hz' },
  { vic: 123, width: 5120, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 396.0, hTotal: 6000, vTotal: 2200, horizontalSyncOffset: 664, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 30Hz' },
  { vic: 124, width: 5120, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 742.5, hTotal: 6250, vTotal: 2475, horizontalSyncOffset: 746, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 48Hz' },
  { vic: 125, width: 5120, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 742.5, hTotal: 6600, vTotal: 2250, horizontalSyncOffset: 1096, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 50Hz' },
  { vic: 126, width: 5120, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 742.5, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 164, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 60Hz' },
  { vic: 127, width: 5120, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 6600, vTotal: 2250, horizontalSyncOffset: 1096, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 100Hz' },
  
  // VIC 193-219: 8K formats (CTA-861-G)
  { vic: 193, width: 5120, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 5500, vTotal: 2250, horizontalSyncOffset: 164, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '5120x2160p @ 120Hz' },
  { vic: 194, width: 7680, height: 4320, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 11000, vTotal: 4500, horizontalSyncOffset: 2552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 24Hz' },
  { vic: 195, width: 7680, height: 4320, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 10800, vTotal: 4400, horizontalSyncOffset: 2352, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 25Hz' },
  { vic: 196, width: 7680, height: 4320, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 9000, vTotal: 4400, horizontalSyncOffset: 552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 30Hz' },
  { vic: 197, width: 7680, height: 4320, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 2376.0, hTotal: 11000, vTotal: 4500, horizontalSyncOffset: 2552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 48Hz' },
  { vic: 198, width: 7680, height: 4320, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 2376.0, hTotal: 10800, vTotal: 4400, horizontalSyncOffset: 2352, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 50Hz' },
  { vic: 199, width: 7680, height: 4320, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 2376.0, hTotal: 9000, vTotal: 4400, horizontalSyncOffset: 552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 60Hz' },
  { vic: 200, width: 7680, height: 4320, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 4752.0, hTotal: 10560, vTotal: 4500, horizontalSyncOffset: 2112, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 100Hz' },
  { vic: 201, width: 7680, height: 4320, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 4752.0, hTotal: 8800, vTotal: 4500, horizontalSyncOffset: 352, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 120Hz' },
  { vic: 202, width: 7680, height: 4320, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 11000, vTotal: 4500, horizontalSyncOffset: 2552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 24Hz 64:27' },
  { vic: 203, width: 7680, height: 4320, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 10800, vTotal: 4400, horizontalSyncOffset: 2352, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 25Hz 64:27' },
  { vic: 204, width: 7680, height: 4320, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 9000, vTotal: 4400, horizontalSyncOffset: 552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 30Hz 64:27' },
  { vic: 205, width: 7680, height: 4320, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 2376.0, hTotal: 11000, vTotal: 4500, horizontalSyncOffset: 2552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 48Hz 64:27' },
  { vic: 206, width: 7680, height: 4320, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 2376.0, hTotal: 10800, vTotal: 4400, horizontalSyncOffset: 2352, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 50Hz 64:27' },
  { vic: 207, width: 7680, height: 4320, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 2376.0, hTotal: 9000, vTotal: 4400, horizontalSyncOffset: 552, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 60Hz 64:27' },
  { vic: 208, width: 7680, height: 4320, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 4752.0, hTotal: 10560, vTotal: 4500, horizontalSyncOffset: 2112, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 100Hz 64:27' },
  { vic: 209, width: 7680, height: 4320, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 4752.0, hTotal: 8800, vTotal: 4500, horizontalSyncOffset: 352, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '7680x4320p @ 120Hz 64:27' },
  
  // VIC 210-219: 10240x4320 (10K)
  { vic: 210, width: 10240, height: 4320, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 12500, vTotal: 4950, horizontalSyncOffset: 1492, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 24Hz' },
  { vic: 211, width: 10240, height: 4320, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 13500, vTotal: 4400, horizontalSyncOffset: 2492, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 25Hz' },
  { vic: 212, width: 10240, height: 4320, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 11000, vTotal: 4500, horizontalSyncOffset: 288, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 30Hz' },
  { vic: 213, width: 10240, height: 4320, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 2970.0, hTotal: 12500, vTotal: 4950, horizontalSyncOffset: 1492, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 48Hz' },
  { vic: 214, width: 10240, height: 4320, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 2970.0, hTotal: 13500, vTotal: 4400, horizontalSyncOffset: 2492, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 50Hz' },
  { vic: 215, width: 10240, height: 4320, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 2970.0, hTotal: 11000, vTotal: 4500, horizontalSyncOffset: 288, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 60Hz' },
  { vic: 216, width: 10240, height: 4320, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 5940.0, hTotal: 13200, vTotal: 4500, horizontalSyncOffset: 2192, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 100Hz' },
  { vic: 217, width: 10240, height: 4320, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 5940.0, hTotal: 11000, vTotal: 4500, horizontalSyncOffset: 288, horizontalSyncWidth: 176, verticalSyncOffset: 16, verticalSyncWidth: 20, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '10240x4320p @ 120Hz' },
  { vic: 218, width: 4096, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '256:135', pixelClock: 1188.0, hTotal: 5280, vTotal: 2250, horizontalSyncOffset: 800, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 100Hz' },
  { vic: 219, width: 4096, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '256:135', pixelClock: 1188.0, hTotal: 4400, vTotal: 2250, horizontalSyncOffset: 88, horizontalSyncWidth: 88, verticalSyncOffset: 8, verticalSyncWidth: 10, hSyncPolarity: 'positive', vSyncPolarity: 'positive', horizontalBorder: 0, verticalBorder: 0, name: '4096x2160p @ 120Hz' },
];

// Create a lookup map for faster access
const VIC_MAP = new Map<number, VICDefinition>();
for (const vic of VIC_TABLE) {
  VIC_MAP.set(vic.vic, vic);
}

/**
 * Look up a VIC definition by its code
 */
export function getVICDefinition(vic: number): VICDefinition | undefined {
  return VIC_MAP.get(vic);
}

/**
 * True iff `vic` has a definition in the CTA-861 VIC table. Used to flag
 * unknown/reserved VIC values on decode (e.g. VIC 0, which is reserved, or
 * values in the reserved 128-192 gap) while still preserving the numeric value
 * for round-trip. The HDMI-VICs 193-219 are in the table but only ever carried
 * in the HDMI VSDB, not the 7-bit CEA Video Data Block field.
 */
export function isKnownVIC(vic: number): boolean {
  return VIC_MAP.has(vic);
}

/**
 * Get all VICs that match a resolution
 */
export function getVICsForResolution(width: number, height: number): VICDefinition[] {
  return VIC_TABLE.filter(v => v.width === width && v.height === height);
}

/**
 * Get a human-readable description of a VIC
 */
export function getVICDescription(vic: number): string {
  const def = VIC_MAP.get(vic);
  if (!def) return `VIC ${vic} (Unknown)`;
  return def.name;
}

/**
 * Check if a VIC is for 4K resolution
 */
export function isVIC4K(vic: number): boolean {
  const def = VIC_MAP.get(vic);
  if (!def) return false;
  return def.width >= 3840 && def.height >= 2160;
}

/**
 * Check if a VIC is for 8K resolution
 */
export function isVIC8K(vic: number): boolean {
  const def = VIC_MAP.get(vic);
  if (!def) return false;
  return def.width >= 7680 && def.height >= 4320;
}

/**
 * True iff the VIC's canonical geometry (as built by
 * {@link generateDetailedTimingFromVIC}) fits in an 18-byte DTD without any
 * field being silently truncated. Three overflow classes exist in
 * the CTA-861-G table:
 *  - 4096/5120/7680/10240-wide formats exceed the 12-bit active field
 *    (4095) — e.g. VIC 98–102, 218–219 are 4096x2160;
 *  - the high-rate 4K/8K/10K formats exceed the 16-bit 10 kHz pixel-clock
 *    field (655.35 MHz) — e.g. VIC 117–120 need 1188 MHz;
 *  - a number of formats (VIC 60/61/62, the 3840x2160 24/25/50Hz family)
 *    have horizontal front porches wider than the 10-bit sync-offset field
 *    (1023).
 *
 * The rule is the field-width check single-sourced with the encoder
 * ({@link isDetailedTimingEncodable} over {@link DTD_FIELD_MAX}), never a
 * hand-list of VIC numbers. Unknown/reserved VIC numbers return false.
 *
 * Note: this is about representing a VIC as a DTD (cea-861 authoring mode).
 * A VIC that fails here is still perfectly valid inside a Video Data Block,
 * where it is carried as a 7-bit code.
 */
export function isVICDtdEncodable(vic: number | VICDefinition): boolean {
  const def = typeof vic === 'number' ? VIC_MAP.get(vic) : vic;
  if (!def) return false;
  return isDetailedTimingEncodable(generateDetailedTimingFromVIC(def));
}

export interface CTATolerances {
  pixelClock: number;
  refreshRate: number;
  horizontalTotal: number;
  verticalTotal: number;
}

const DEFAULT_CTA_TOLERANCES: CTATolerances = {
  pixelClock: 0.75,
  refreshRate: 0.2,
  horizontalTotal: 32,
  verticalTotal: 12,
};

export interface CTAComparisonDifferences {
  pixelClock: number;
  refreshRate: number;
  horizontalTotal: number;
  verticalTotal: number;
}

export interface CTAComparisonResult {
  vic: VICDefinition;
  differences: CTAComparisonDifferences;
  withinTolerance: boolean;
}

export interface CTAAnalysisResult {
  comparisons: CTAComparisonResult[];
  matchVic: VICDefinition | null;
}

export interface CTAAnalysisOptions {
  tolerances?: Partial<CTATolerances>;
  candidateFilter?: (vic: VICDefinition) => boolean;
}

/**
 * Compare a detailed timing descriptor against CTA-861 VIC definitions
 */
export function analyzeDetailedTimingAgainstCTA(
  timing: DetailedTimingDescriptor,
  options?: CTAAnalysisOptions
): CTAAnalysisResult {
  const tolerances: CTATolerances = {
    ...DEFAULT_CTA_TOLERANCES,
    ...(options?.tolerances ?? {}),
  };

  const candidates = VIC_TABLE.filter((vic) => {
    if (options?.candidateFilter && !options.candidateFilter(vic)) {
      return false;
    }
    return (
      vic.interlaced === timing.flags.interlaced &&
      vic.width === timing.horizontalActive &&
      vic.height === timing.verticalActive
    );
  });

  const comparisons = candidates.map((vic) => {
    const differences: CTAComparisonDifferences = {
      pixelClock: timing.pixelClock - vic.pixelClock,
      refreshRate: timing.refreshRate - vic.refreshRate,
      horizontalTotal: timing.horizontalTotal - vic.hTotal,
      verticalTotal: timing.verticalTotal - vic.vTotal,
    };

    const withinTolerance =
      Math.abs(differences.pixelClock) <= tolerances.pixelClock &&
      Math.abs(differences.refreshRate) <= tolerances.refreshRate &&
      Math.abs(differences.horizontalTotal) <= tolerances.horizontalTotal &&
      Math.abs(differences.verticalTotal) <= tolerances.verticalTotal;

    return {
      vic,
      differences,
      withinTolerance,
    };
  });

  const match = comparisons.find((comparison) => comparison.withinTolerance) ?? null;

  return {
    comparisons,
    matchVic: match?.vic ?? null,
  };
}

/**
 * Build a {@link DetailedTimingDescriptor} from a CTA-861 VIC, the CTA analogue
 * of {@link generateCVTDetailedTiming}. Maps the per-VIC short-form fields from
 * CTA-861-G Table 3 (sync offset/width, polarities, borders) onto a DTD whose
 * blanking is derived from the VIC totals, with `syncType` 'digital-separate',
 * `stereoMode` 'none', and image size defaulting to 0 unless provided. The
 * result round-trips through {@link encodeEdidCtaDetailedTiming} and is matched
 * back to the source VIC by {@link analyzeDetailedTimingAgainstCTA}.
 *
 * For the double-clocked VICs (Table 3 Note 2) the table stores the displayed
 * 720 form (see the file header), so the emitted DTD is the displayed-form DTD
 * (720 active, ½ pixel clock), not the 1440 transport form.
 *
 * @param vic a VIC number (looked up; throws on unknown/reserved) or an existing
 *            {@link VICDefinition}.
 * @param overrides optional image-size overrides (mm) — CTA-861 VICs carry no
 *                  image-size data, so these default to 0.
 */
export function generateDetailedTimingFromVIC(
  vic: number | VICDefinition,
  overrides?: { horizontalImageSize?: number; verticalImageSize?: number },
): DetailedTimingDescriptor {
  const def = typeof vic === 'number' ? VIC_MAP.get(vic) : vic;
  if (!def) {
    throw new Error(`generateDetailedTimingFromVIC: unknown/reserved VIC ${vic}`);
  }

  const horizontalBlanking = def.hTotal - def.width;
  // Interlaced vertical blanking spans both fields: 2*vTotal - height handles
  // the half-line (verified: VIC 5 → 45, VIC 39 even-vtotal → 170) without an
  // extra even/odd flag. Progressive is the simple vTotal - height.
  const verticalBlanking = def.interlaced ? 2 * def.vTotal - def.height : def.vTotal - def.height;

  return new DetailedTimingDescriptor({
    pixelClock: def.pixelClock,
    horizontalActive: def.width,
    horizontalBlanking,
    verticalActive: def.height,
    verticalBlanking,
    horizontalSyncOffset: def.horizontalSyncOffset,
    horizontalSyncWidth: def.horizontalSyncWidth,
    verticalSyncOffset: def.verticalSyncOffset,
    verticalSyncWidth: def.verticalSyncWidth,
    horizontalImageSize: overrides?.horizontalImageSize ?? 0,
    verticalImageSize: overrides?.verticalImageSize ?? 0,
    horizontalBorder: def.horizontalBorder,
    verticalBorder: def.verticalBorder,
    flags: {
      interlaced: def.interlaced,
      stereoMode: 'none',
      syncType: 'digital-separate',
      hSyncPolarity: def.hSyncPolarity,
      vSyncPolarity: def.vSyncPolarity,
    },
  });
}
