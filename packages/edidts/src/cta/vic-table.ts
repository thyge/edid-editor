import { DetailedTimingDescriptor } from '../common/detailed-timing-descriptor';

/**
 * VIC (Video Identification Code) Table
 * 
 * Per CTA-861-G Table 3 - Video Identification Codes
 * Contains all standard video formats with their timing parameters.
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
  name: string;
}

/**
 * Complete VIC table per CTA-861-G
 * VICs 1-127, 193-219
 */
export const VIC_TABLE: VICDefinition[] = [
  // VIC 1-4: 640x480, 720x480
  { vic: 1, width: 640, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 25.175, hTotal: 800, vTotal: 525, name: '640x480p @ 60Hz 4:3' },
  { vic: 2, width: 720, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 858, vTotal: 525, name: '720x480p @ 60Hz 4:3' },
  { vic: 3, width: 720, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 858, vTotal: 525, name: '720x480p @ 60Hz 16:9' },
  { vic: 4, width: 1280, height: 720, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 1650, vTotal: 750, name: '1280x720p @ 60Hz' },
  
  // VIC 5-6: 1080i
  { vic: 5, width: 1920, height: 1080, refreshRate: 60, interlaced: true, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2200, vTotal: 562.5, name: '1920x1080i @ 60Hz' },
  { vic: 6, width: 720, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 858, vTotal: 262.5, name: '720(1440)x480i @ 60Hz 4:3' },
  { vic: 7, width: 720, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 858, vTotal: 262.5, name: '720(1440)x480i @ 60Hz 16:9' },
  
  // VIC 8-9: 240p (doubled)
  { vic: 8, width: 720, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 858, vTotal: 262, name: '720(1440)x240p @ 60Hz 4:3' },
  { vic: 9, width: 720, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 858, vTotal: 262, name: '720(1440)x240p @ 60Hz 16:9' },
  
  // VIC 10-13: 2880x480i/240p
  { vic: 10, width: 2880, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3432, vTotal: 262.5, name: '2880x480i @ 60Hz 4:3' },
  { vic: 11, width: 2880, height: 480, refreshRate: 60, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3432, vTotal: 262.5, name: '2880x480i @ 60Hz 16:9' },
  { vic: 12, width: 2880, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3432, vTotal: 262, name: '2880x240p @ 60Hz 4:3' },
  { vic: 13, width: 2880, height: 240, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3432, vTotal: 262, name: '2880x240p @ 60Hz 16:9' },
  
  // VIC 14-15: 1440x480p
  { vic: 14, width: 1440, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 1716, vTotal: 525, name: '1440x480p @ 60Hz 4:3' },
  { vic: 15, width: 1440, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 1716, vTotal: 525, name: '1440x480p @ 60Hz 16:9' },
  
  // VIC 16: 1080p60 - Most common
  { vic: 16, width: 1920, height: 1080, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2200, vTotal: 1125, name: '1920x1080p @ 60Hz' },
  
  // VIC 17-18: 720x576p (PAL)
  { vic: 17, width: 720, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 864, vTotal: 625, name: '720x576p @ 50Hz 4:3' },
  { vic: 18, width: 720, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 864, vTotal: 625, name: '720x576p @ 50Hz 16:9' },
  
  // VIC 19: 720p50
  { vic: 19, width: 1280, height: 720, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 1980, vTotal: 750, name: '1280x720p @ 50Hz' },
  
  // VIC 20: 1080i50
  { vic: 20, width: 1920, height: 1080, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2640, vTotal: 562.5, name: '1920x1080i @ 50Hz' },
  
  // VIC 21-22: 576i
  { vic: 21, width: 720, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 864, vTotal: 312.5, name: '720(1440)x576i @ 50Hz 4:3' },
  { vic: 22, width: 720, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 864, vTotal: 312.5, name: '720(1440)x576i @ 50Hz 16:9' },
  
  // VIC 23-24: 288p
  { vic: 23, width: 720, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 13.5, hTotal: 864, vTotal: 312, name: '720(1440)x288p @ 50Hz 4:3' },
  { vic: 24, width: 720, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 13.5, hTotal: 864, vTotal: 312, name: '720(1440)x288p @ 50Hz 16:9' },
  
  // VIC 25-28: 2880x576i/288p
  { vic: 25, width: 2880, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3456, vTotal: 312.5, name: '2880x576i @ 50Hz 4:3' },
  { vic: 26, width: 2880, height: 576, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3456, vTotal: 312.5, name: '2880x576i @ 50Hz 16:9' },
  { vic: 27, width: 2880, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 3456, vTotal: 312, name: '2880x288p @ 50Hz 4:3' },
  { vic: 28, width: 2880, height: 288, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 3456, vTotal: 312, name: '2880x288p @ 50Hz 16:9' },
  
  // VIC 29-30: 1440x576p
  { vic: 29, width: 1440, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 1728, vTotal: 625, name: '1440x576p @ 50Hz 4:3' },
  { vic: 30, width: 1440, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 1728, vTotal: 625, name: '1440x576p @ 50Hz 16:9' },
  
  // VIC 31: 1080p50
  { vic: 31, width: 1920, height: 1080, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2640, vTotal: 1125, name: '1920x1080p @ 50Hz' },
  
  // VIC 32: 1080p24
  { vic: 32, width: 1920, height: 1080, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2750, vTotal: 1125, name: '1920x1080p @ 24Hz' },
  
  // VIC 33: 1080p25
  { vic: 33, width: 1920, height: 1080, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2640, vTotal: 1125, name: '1920x1080p @ 25Hz' },
  
  // VIC 34: 1080p30
  { vic: 34, width: 1920, height: 1080, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 2200, vTotal: 1125, name: '1920x1080p @ 30Hz' },
  
  // VIC 35-38: 2880x480p/576p
  { vic: 35, width: 2880, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 3432, vTotal: 525, name: '2880x480p @ 60Hz 4:3' },
  { vic: 36, width: 2880, height: 480, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 3432, vTotal: 525, name: '2880x480p @ 60Hz 16:9' },
  { vic: 37, width: 2880, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 3456, vTotal: 625, name: '2880x576p @ 50Hz 4:3' },
  { vic: 38, width: 2880, height: 576, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 3456, vTotal: 625, name: '2880x576p @ 50Hz 16:9' },
  
  // VIC 39: 1080i50 (1250 total)
  { vic: 39, width: 1920, height: 1080, refreshRate: 50, interlaced: true, aspectRatio: '16:9', pixelClock: 72.0, hTotal: 2304, vTotal: 625, name: '1920x1080i @ 50Hz (1250 total)' },
  
  // VIC 40-41: 1080i100/120
  { vic: 40, width: 1920, height: 1080, refreshRate: 100, interlaced: true, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2640, vTotal: 562.5, name: '1920x1080i @ 100Hz' },
  { vic: 41, width: 1280, height: 720, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 1980, vTotal: 750, name: '1280x720p @ 100Hz' },
  
  // VIC 42-43: 576p100, 576i100
  { vic: 42, width: 720, height: 576, refreshRate: 100, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 864, vTotal: 625, name: '720x576p @ 100Hz 4:3' },
  { vic: 43, width: 720, height: 576, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 864, vTotal: 625, name: '720x576p @ 100Hz 16:9' },
  
  // VIC 44-45: 576i100
  { vic: 44, width: 720, height: 576, refreshRate: 100, interlaced: true, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 864, vTotal: 312.5, name: '720(1440)x576i @ 100Hz 4:3' },
  { vic: 45, width: 720, height: 576, refreshRate: 100, interlaced: true, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 864, vTotal: 312.5, name: '720(1440)x576i @ 100Hz 16:9' },
  
  // VIC 46-47: 1080i120, 720p120
  { vic: 46, width: 1920, height: 1080, refreshRate: 120, interlaced: true, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2200, vTotal: 562.5, name: '1920x1080i @ 120Hz' },
  { vic: 47, width: 1280, height: 720, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 1650, vTotal: 750, name: '1280x720p @ 120Hz' },
  
  // VIC 48-51: 480p/480i 120Hz
  { vic: 48, width: 720, height: 480, refreshRate: 120, interlaced: false, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 858, vTotal: 525, name: '720x480p @ 120Hz 4:3' },
  { vic: 49, width: 720, height: 480, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 858, vTotal: 525, name: '720x480p @ 120Hz 16:9' },
  { vic: 50, width: 720, height: 480, refreshRate: 120, interlaced: true, aspectRatio: '4:3', pixelClock: 27.0, hTotal: 858, vTotal: 262.5, name: '720(1440)x480i @ 120Hz 4:3' },
  { vic: 51, width: 720, height: 480, refreshRate: 120, interlaced: true, aspectRatio: '16:9', pixelClock: 27.0, hTotal: 858, vTotal: 262.5, name: '720(1440)x480i @ 120Hz 16:9' },
  
  // VIC 52-55: 576p/576i 200Hz
  { vic: 52, width: 720, height: 576, refreshRate: 200, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 864, vTotal: 625, name: '720x576p @ 200Hz 4:3' },
  { vic: 53, width: 720, height: 576, refreshRate: 200, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 864, vTotal: 625, name: '720x576p @ 200Hz 16:9' },
  { vic: 54, width: 720, height: 576, refreshRate: 200, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 864, vTotal: 312.5, name: '720(1440)x576i @ 200Hz 4:3' },
  { vic: 55, width: 720, height: 576, refreshRate: 200, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 864, vTotal: 312.5, name: '720(1440)x576i @ 200Hz 16:9' },
  
  // VIC 56-59: 480p/480i 240Hz
  { vic: 56, width: 720, height: 480, refreshRate: 240, interlaced: false, aspectRatio: '4:3', pixelClock: 108.0, hTotal: 858, vTotal: 525, name: '720x480p @ 240Hz 4:3' },
  { vic: 57, width: 720, height: 480, refreshRate: 240, interlaced: false, aspectRatio: '16:9', pixelClock: 108.0, hTotal: 858, vTotal: 525, name: '720x480p @ 240Hz 16:9' },
  { vic: 58, width: 720, height: 480, refreshRate: 240, interlaced: true, aspectRatio: '4:3', pixelClock: 54.0, hTotal: 858, vTotal: 262.5, name: '720(1440)x480i @ 240Hz 4:3' },
  { vic: 59, width: 720, height: 480, refreshRate: 240, interlaced: true, aspectRatio: '16:9', pixelClock: 54.0, hTotal: 858, vTotal: 262.5, name: '720(1440)x480i @ 240Hz 16:9' },
  
  // VIC 60-64: 720p/1080p extended
  { vic: 60, width: 1280, height: 720, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 59.4, hTotal: 3300, vTotal: 750, name: '1280x720p @ 24Hz' },
  { vic: 61, width: 1280, height: 720, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 3960, vTotal: 750, name: '1280x720p @ 25Hz' },
  { vic: 62, width: 1280, height: 720, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 74.25, hTotal: 3300, vTotal: 750, name: '1280x720p @ 30Hz' },
  { vic: 63, width: 1920, height: 1080, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 2200, vTotal: 1125, name: '1920x1080p @ 120Hz' },
  { vic: 64, width: 1920, height: 1080, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 2640, vTotal: 1125, name: '1920x1080p @ 100Hz' },
  
  // VIC 65-92: Extended formats (CTA-861-F and later)
  { vic: 65, width: 1280, height: 720, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 3300, vTotal: 750, name: '1280x720p @ 24Hz 64:27' },
  { vic: 66, width: 1280, height: 720, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 3960, vTotal: 750, name: '1280x720p @ 25Hz 64:27' },
  { vic: 67, width: 1280, height: 720, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 3300, vTotal: 750, name: '1280x720p @ 30Hz 64:27' },
  { vic: 68, width: 1280, height: 720, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 1980, vTotal: 750, name: '1280x720p @ 50Hz 64:27' },
  { vic: 69, width: 1280, height: 720, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 1650, vTotal: 750, name: '1280x720p @ 60Hz 64:27' },
  { vic: 70, width: 1280, height: 720, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 1980, vTotal: 750, name: '1280x720p @ 100Hz 64:27' },
  { vic: 71, width: 1280, height: 720, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 1650, vTotal: 750, name: '1280x720p @ 120Hz 64:27' },
  { vic: 72, width: 1920, height: 1080, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 2750, vTotal: 1125, name: '1920x1080p @ 24Hz 64:27' },
  { vic: 73, width: 1920, height: 1080, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 2640, vTotal: 1125, name: '1920x1080p @ 25Hz 64:27' },
  { vic: 74, width: 1920, height: 1080, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 74.25, hTotal: 2200, vTotal: 1125, name: '1920x1080p @ 30Hz 64:27' },
  { vic: 75, width: 1920, height: 1080, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 2640, vTotal: 1125, name: '1920x1080p @ 50Hz 64:27' },
  { vic: 76, width: 1920, height: 1080, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 2200, vTotal: 1125, name: '1920x1080p @ 60Hz 64:27' },
  { vic: 77, width: 1920, height: 1080, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 2640, vTotal: 1125, name: '1920x1080p @ 100Hz 64:27' },
  { vic: 78, width: 1920, height: 1080, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 2200, vTotal: 1125, name: '1920x1080p @ 120Hz 64:27' },
  { vic: 79, width: 1680, height: 720, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 3300, vTotal: 750, name: '1680x720p @ 24Hz' },
  { vic: 80, width: 1680, height: 720, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 3168, vTotal: 750, name: '1680x720p @ 25Hz' },
  { vic: 81, width: 1680, height: 720, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 59.4, hTotal: 2640, vTotal: 750, name: '1680x720p @ 30Hz' },
  { vic: 82, width: 1680, height: 720, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 82.5, hTotal: 2200, vTotal: 750, name: '1680x720p @ 50Hz' },
  { vic: 83, width: 1680, height: 720, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 99.0, hTotal: 2200, vTotal: 750, name: '1680x720p @ 60Hz' },
  { vic: 84, width: 1680, height: 720, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 165.0, hTotal: 2000, vTotal: 825, name: '1680x720p @ 100Hz' },
  { vic: 85, width: 1680, height: 720, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 198.0, hTotal: 2000, vTotal: 825, name: '1680x720p @ 120Hz' },
  { vic: 86, width: 2560, height: 1080, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 99.0, hTotal: 3750, vTotal: 1100, name: '2560x1080p @ 24Hz' },
  { vic: 87, width: 2560, height: 1080, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 90.0, hTotal: 3200, vTotal: 1125, name: '2560x1080p @ 25Hz' },
  { vic: 88, width: 2560, height: 1080, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 118.8, hTotal: 3520, vTotal: 1125, name: '2560x1080p @ 30Hz' },
  { vic: 89, width: 2560, height: 1080, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 185.625, hTotal: 3300, vTotal: 1125, name: '2560x1080p @ 50Hz' },
  { vic: 90, width: 2560, height: 1080, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 198.0, hTotal: 3000, vTotal: 1100, name: '2560x1080p @ 60Hz' },
  { vic: 91, width: 2560, height: 1080, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 371.25, hTotal: 3300, vTotal: 1125, name: '2560x1080p @ 100Hz' },
  { vic: 92, width: 2560, height: 1080, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 495.0, hTotal: 3750, vTotal: 1100, name: '2560x1080p @ 120Hz' },
  
  // VIC 93-97: 4K 16:9
  { vic: 93, width: 3840, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 5500, vTotal: 2250, name: '3840x2160p @ 24Hz' },
  { vic: 94, width: 3840, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 5280, vTotal: 2250, name: '3840x2160p @ 25Hz' },
  { vic: 95, width: 3840, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 297.0, hTotal: 4400, vTotal: 2250, name: '3840x2160p @ 30Hz' },
  { vic: 96, width: 3840, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 594.0, hTotal: 5280, vTotal: 2250, name: '3840x2160p @ 50Hz' },
  { vic: 97, width: 3840, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 594.0, hTotal: 4400, vTotal: 2250, name: '3840x2160p @ 60Hz' },
  
  // 4096x2160 (Cinema 4K)
  { vic: 98, width: 4096, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '256:135', pixelClock: 297.0, hTotal: 5500, vTotal: 2250, name: '4096x2160p @ 24Hz' },
  { vic: 99, width: 4096, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '256:135', pixelClock: 297.0, hTotal: 5280, vTotal: 2250, name: '4096x2160p @ 25Hz' },
  { vic: 100, width: 4096, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '256:135', pixelClock: 297.0, hTotal: 4400, vTotal: 2250, name: '4096x2160p @ 30Hz' },
  { vic: 101, width: 4096, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '256:135', pixelClock: 594.0, hTotal: 5280, vTotal: 2250, name: '4096x2160p @ 50Hz' },
  { vic: 102, width: 4096, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '256:135', pixelClock: 594.0, hTotal: 4400, vTotal: 2250, name: '4096x2160p @ 60Hz' },
  
  // VIC 103-107: 3840x2160 64:27 (21:9 equivalent)
  { vic: 103, width: 3840, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 5500, vTotal: 2250, name: '3840x2160p @ 24Hz 64:27' },
  { vic: 104, width: 3840, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 5280, vTotal: 2250, name: '3840x2160p @ 25Hz 64:27' },
  { vic: 105, width: 3840, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 297.0, hTotal: 4400, vTotal: 2250, name: '3840x2160p @ 30Hz 64:27' },
  { vic: 106, width: 3840, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 594.0, hTotal: 5280, vTotal: 2250, name: '3840x2160p @ 50Hz 64:27' },
  { vic: 107, width: 3840, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 594.0, hTotal: 4400, vTotal: 2250, name: '3840x2160p @ 60Hz 64:27' },
  
  // VIC 108-112: 1280x720 16:9 high refresh
  { vic: 108, width: 1280, height: 720, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 90.0, hTotal: 2500, vTotal: 750, name: '1280x720p @ 48Hz' },
  { vic: 109, width: 1280, height: 720, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 90.0, hTotal: 2500, vTotal: 750, name: '1280x720p @ 48Hz 64:27' },
  { vic: 110, width: 1680, height: 720, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 99.0, hTotal: 2750, vTotal: 750, name: '1680x720p @ 48Hz' },
  { vic: 111, width: 1920, height: 1080, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 148.5, hTotal: 2750, vTotal: 1125, name: '1920x1080p @ 48Hz' },
  { vic: 112, width: 1920, height: 1080, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 148.5, hTotal: 2750, vTotal: 1125, name: '1920x1080p @ 48Hz 64:27' },
  
  // VIC 113-117: 2560x1080 48Hz and 4K 48Hz
  { vic: 113, width: 2560, height: 1080, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 198.0, hTotal: 3750, vTotal: 1100, name: '2560x1080p @ 48Hz' },
  { vic: 114, width: 3840, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 594.0, hTotal: 5500, vTotal: 2250, name: '3840x2160p @ 48Hz' },
  { vic: 115, width: 4096, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '256:135', pixelClock: 594.0, hTotal: 5500, vTotal: 2250, name: '4096x2160p @ 48Hz' },
  { vic: 116, width: 3840, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 594.0, hTotal: 5500, vTotal: 2250, name: '3840x2160p @ 48Hz 64:27' },
  { vic: 117, width: 3840, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 5280, vTotal: 2250, name: '3840x2160p @ 100Hz' },
  
  // VIC 118-120: 4K 120Hz
  { vic: 118, width: 3840, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 4400, vTotal: 2250, name: '3840x2160p @ 120Hz' },
  { vic: 119, width: 3840, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 5280, vTotal: 2250, name: '3840x2160p @ 100Hz 64:27' },
  { vic: 120, width: 3840, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 4400, vTotal: 2250, name: '3840x2160p @ 120Hz 64:27' },
  
  // VIC 121-127: 5120x2160 (5K ultrawide)
  { vic: 121, width: 5120, height: 2160, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 396.0, hTotal: 7500, vTotal: 2200, name: '5120x2160p @ 24Hz' },
  { vic: 122, width: 5120, height: 2160, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 396.0, hTotal: 7200, vTotal: 2200, name: '5120x2160p @ 25Hz' },
  { vic: 123, width: 5120, height: 2160, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 396.0, hTotal: 6000, vTotal: 2200, name: '5120x2160p @ 30Hz' },
  { vic: 124, width: 5120, height: 2160, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 742.5, hTotal: 7500, vTotal: 2062, name: '5120x2160p @ 48Hz' },
  { vic: 125, width: 5120, height: 2160, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 742.5, hTotal: 6750, vTotal: 2200, name: '5120x2160p @ 50Hz' },
  { vic: 126, width: 5120, height: 2160, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 742.5, hTotal: 5625, vTotal: 2200, name: '5120x2160p @ 60Hz' },
  { vic: 127, width: 5120, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 6750, vTotal: 2200, name: '5120x2160p @ 100Hz' },
  
  // VIC 193-219: 8K formats (CTA-861-G)
  { vic: 193, width: 5120, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 5625, vTotal: 2200, name: '5120x2160p @ 120Hz' },
  { vic: 194, width: 7680, height: 4320, refreshRate: 24, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 11000, vTotal: 4500, name: '7680x4320p @ 24Hz' },
  { vic: 195, width: 7680, height: 4320, refreshRate: 25, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 10560, vTotal: 4500, name: '7680x4320p @ 25Hz' },
  { vic: 196, width: 7680, height: 4320, refreshRate: 30, interlaced: false, aspectRatio: '16:9', pixelClock: 1188.0, hTotal: 8800, vTotal: 4500, name: '7680x4320p @ 30Hz' },
  { vic: 197, width: 7680, height: 4320, refreshRate: 48, interlaced: false, aspectRatio: '16:9', pixelClock: 2376.0, hTotal: 11000, vTotal: 4500, name: '7680x4320p @ 48Hz' },
  { vic: 198, width: 7680, height: 4320, refreshRate: 50, interlaced: false, aspectRatio: '16:9', pixelClock: 2376.0, hTotal: 10560, vTotal: 4500, name: '7680x4320p @ 50Hz' },
  { vic: 199, width: 7680, height: 4320, refreshRate: 60, interlaced: false, aspectRatio: '16:9', pixelClock: 2376.0, hTotal: 8800, vTotal: 4500, name: '7680x4320p @ 60Hz' },
  { vic: 200, width: 7680, height: 4320, refreshRate: 100, interlaced: false, aspectRatio: '16:9', pixelClock: 4752.0, hTotal: 10560, vTotal: 4500, name: '7680x4320p @ 100Hz' },
  { vic: 201, width: 7680, height: 4320, refreshRate: 120, interlaced: false, aspectRatio: '16:9', pixelClock: 4752.0, hTotal: 8800, vTotal: 4500, name: '7680x4320p @ 120Hz' },
  { vic: 202, width: 7680, height: 4320, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 11000, vTotal: 4500, name: '7680x4320p @ 24Hz 64:27' },
  { vic: 203, width: 7680, height: 4320, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 10560, vTotal: 4500, name: '7680x4320p @ 25Hz 64:27' },
  { vic: 204, width: 7680, height: 4320, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 1188.0, hTotal: 8800, vTotal: 4500, name: '7680x4320p @ 30Hz 64:27' },
  { vic: 205, width: 7680, height: 4320, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 2376.0, hTotal: 11000, vTotal: 4500, name: '7680x4320p @ 48Hz 64:27' },
  { vic: 206, width: 7680, height: 4320, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 2376.0, hTotal: 10560, vTotal: 4500, name: '7680x4320p @ 50Hz 64:27' },
  { vic: 207, width: 7680, height: 4320, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 2376.0, hTotal: 8800, vTotal: 4500, name: '7680x4320p @ 60Hz 64:27' },
  { vic: 208, width: 7680, height: 4320, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 4752.0, hTotal: 10560, vTotal: 4500, name: '7680x4320p @ 100Hz 64:27' },
  { vic: 209, width: 7680, height: 4320, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 4752.0, hTotal: 8800, vTotal: 4500, name: '7680x4320p @ 120Hz 64:27' },
  
  // VIC 210-219: 10240x4320 (10K)
  { vic: 210, width: 10240, height: 4320, refreshRate: 24, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 13750, vTotal: 4500, name: '10240x4320p @ 24Hz' },
  { vic: 211, width: 10240, height: 4320, refreshRate: 25, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 13200, vTotal: 4500, name: '10240x4320p @ 25Hz' },
  { vic: 212, width: 10240, height: 4320, refreshRate: 30, interlaced: false, aspectRatio: '64:27', pixelClock: 1485.0, hTotal: 11000, vTotal: 4500, name: '10240x4320p @ 30Hz' },
  { vic: 213, width: 10240, height: 4320, refreshRate: 48, interlaced: false, aspectRatio: '64:27', pixelClock: 2970.0, hTotal: 13750, vTotal: 4500, name: '10240x4320p @ 48Hz' },
  { vic: 214, width: 10240, height: 4320, refreshRate: 50, interlaced: false, aspectRatio: '64:27', pixelClock: 2970.0, hTotal: 13200, vTotal: 4500, name: '10240x4320p @ 50Hz' },
  { vic: 215, width: 10240, height: 4320, refreshRate: 60, interlaced: false, aspectRatio: '64:27', pixelClock: 2970.0, hTotal: 11000, vTotal: 4500, name: '10240x4320p @ 60Hz' },
  { vic: 216, width: 10240, height: 4320, refreshRate: 100, interlaced: false, aspectRatio: '64:27', pixelClock: 5940.0, hTotal: 13200, vTotal: 4500, name: '10240x4320p @ 100Hz' },
  { vic: 217, width: 10240, height: 4320, refreshRate: 120, interlaced: false, aspectRatio: '64:27', pixelClock: 5940.0, hTotal: 11000, vTotal: 4500, name: '10240x4320p @ 120Hz' },
  { vic: 218, width: 4096, height: 2160, refreshRate: 100, interlaced: false, aspectRatio: '256:135', pixelClock: 1188.0, hTotal: 5280, vTotal: 2250, name: '4096x2160p @ 100Hz' },
  { vic: 219, width: 4096, height: 2160, refreshRate: 120, interlaced: false, aspectRatio: '256:135', pixelClock: 1188.0, hTotal: 4400, vTotal: 2250, name: '4096x2160p @ 120Hz' },
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
