import { DetailedTimingDescriptor } from "../common/detailed-timing-descriptor";
import { generateCVTDetailedTiming } from "../common/cvt-timing-generator";
import { ColorCharacteristics } from "./color-characteristics";
import { EDIDHeader } from "./edid-header";
import { EstablishedTiming } from "./established-timing";
import { StandardTiming } from "./standard-timing";
import { VideoInputDefinition } from "./video-input";
import { FeatureSupportFlags } from "./feature-support";
import { 
  DisplayDescriptor, 
  DisplayDescriptorParser,
  getProductName,
  getProductSerial,
  getRangeLimits,
} from "./display-descriptor";
import { ExtensionBlock, ExtensionBlockParser, CEAExtensionBlock } from "../cta/extension-block";


/**
 * Screen size can be either absolute (cm) or aspect ratio
 */
export interface ScreenSize {
  type: 'absolute' | 'aspect-ratio';
  horizontalCm?: number;
  verticalCm?: number;
  landscapeAspectRatio?: number; // (ratio - 1) * 100 + 99
  portraitAspectRatio?: number;  // (100 / ratio) - 99
}

/**
 * Callback type for change notifications
 */
export type EDIDChangeCallback = (edid: EDID, changedProperty: string) => void;

/**
 * EDID - Extended Display Identification Data
 * A reactive model class for decoding and encoding EDID binary data
 * Implements VESA E-EDID Standard Release A, Revision 2
 * 
 * When properties are modified, the internal binary data is automatically updated
 * and onChange callbacks are triggered for reactive UI frameworks.
 */
export class EDID {
  // Internal storage
  private _header: EDIDHeader;
  private _videoInput: VideoInputDefinition;
  private _screenSize: ScreenSize;
  private _gamma: number;
  private _featureSupport: FeatureSupportFlags;
  private _colorCharacteristics: ColorCharacteristics;
  private _establishedTimings: EstablishedTiming[];
  private _standardTimings: StandardTiming[];
  private _detailedTimings: DetailedTimingDescriptor[];
  private _displayDescriptors: DisplayDescriptor[];
  private _extensionBlocks: ExtensionBlock[];
  private _rawData: Uint8Array;
  private _changeCallbacks: EDIDChangeCallback[] = [];
  private _suppressNotifications = false;

  // Read-only computed properties
  public extensions: number = 0;
  public checksum: number = 0;
  public isValid: boolean = false;

  // Reactive getters and setters
  get header(): EDIDHeader { return this._header; }
  set header(value: EDIDHeader) {
    this._header = value;
    this.notifyChange('header');
  }

  get videoInput(): VideoInputDefinition { return this._videoInput; }
  set videoInput(value: VideoInputDefinition) {
    this._videoInput = value;
    this.notifyChange('videoInput');
  }

  get screenSize(): ScreenSize { return this._screenSize; }
  set screenSize(value: ScreenSize) {
    this._screenSize = value;
    this.notifyChange('screenSize');
  }

  get gamma(): number { return this._gamma; }
  set gamma(value: number) {
    this._gamma = value;
    this.notifyChange('gamma');
  }

  get featureSupport(): FeatureSupportFlags { return this._featureSupport; }
  set featureSupport(value: FeatureSupportFlags) {
    this._featureSupport = value;
    this.notifyChange('featureSupport');
  }

  get colorCharacteristics(): ColorCharacteristics { return this._colorCharacteristics; }
  set colorCharacteristics(value: ColorCharacteristics) {
    this._colorCharacteristics = value;
    this.notifyChange('colorCharacteristics');
  }

  get establishedTimings(): EstablishedTiming[] { return this._establishedTimings; }
  set establishedTimings(value: EstablishedTiming[]) {
    this._establishedTimings = value;
    this.notifyChange('establishedTimings');
  }

  get standardTimings(): StandardTiming[] { return this._standardTimings; }
  set standardTimings(value: StandardTiming[]) {
    this._standardTimings = value;
    this.notifyChange('standardTimings');
  }

  get detailedTimings(): DetailedTimingDescriptor[] { return this._detailedTimings; }
  set detailedTimings(value: DetailedTimingDescriptor[]) {
    this._detailedTimings = value;
    this.notifyChange('detailedTimings');
  }

  get displayDescriptors(): DisplayDescriptor[] { return this._displayDescriptors; }
  set displayDescriptors(value: DisplayDescriptor[]) {
    this._displayDescriptors = value;
    this.notifyChange('displayDescriptors');
  }

  get extensionBlocks(): ExtensionBlock[] { return this._extensionBlocks; }
  set extensionBlocks(value: ExtensionBlock[]) {
    this._extensionBlocks = value;
    this.notifyChange('extensionBlocks');
  }

  /**
   * Get the current encoded binary data
   * This is always kept in sync with property changes
   */
  get rawData(): Uint8Array {
    return this._rawData;
  }



  /**
   * Legacy display characteristics object (for backwards compatibility)
   * Changes to this object will update the underlying properties
   */
  get displayCharacteristics() {
    const self = this;
    return {
      get inputType() { return self.videoInput.isDigital ? 'digital' as const : 'analog' as const; },
      set inputType(v: 'analog' | 'digital') {
        if (v === 'digital') {
          self.videoInput = new VideoInputDefinition({ type: 'digital', bitDepth: 8, videoInterface: 'undefined' });
        } else {
          self.videoInput = new VideoInputDefinition({ 
            type: 'analog', 
            signalLevel: '0.7/0.3V',
            videoSetup: false,
            separateSyncSupported: false,
            compositeSyncSupported: false,
            syncOnGreenSupported: false,
            vsyncSerrationSupported: false,
          });
        }
      },
      get maxHorizontalSize() { return self.screenSize.horizontalCm ?? 0; },
      set maxHorizontalSize(v: number) { 
        self.screenSize = { type: 'absolute', horizontalCm: v, verticalCm: self.screenSize.verticalCm ?? 0 };
      },
      get maxVerticalSize() { return self.screenSize.verticalCm ?? 0; },
      set maxVerticalSize(v: number) { 
        self.screenSize = { type: 'absolute', horizontalCm: self.screenSize.horizontalCm ?? 0, verticalCm: v };
      },
      get gamma() { return self.gamma; },
      set gamma(v: number) { self.gamma = v; },
      get features() {
        return {
          get standby() { return self.featureSupport.features.standbySupported; },
          set standby(v: boolean) { self.featureSupport.features.standbySupported = v; },
          get suspend() { return self.featureSupport.features.suspendSupported; },
          set suspend(v: boolean) { self.featureSupport.features.suspendSupported = v; },
          get activeOff() { return self.featureSupport.features.activeOffSupported; },
          set activeOff(v: boolean) { self.featureSupport.features.activeOffSupported = v; },
          get sRGB() { return self.featureSupport.features.sRGBDefault; },
          set sRGB(v: boolean) { self.featureSupport.features.sRGBDefault = v; },
        };
      },
      get supportsPowerManagement() { return self.featureSupport.supportsPowerManagement; },
    };
  }

  /**
   * Register a callback to be notified when any property changes
   * @param callback Function called with (edid, propertyName) on each change
   * @returns Unsubscribe function
   */
  onChange(callback: EDIDChangeCallback): () => void {
    this._changeCallbacks.push(callback);
    return () => {
      const index = this._changeCallbacks.indexOf(callback);
      if (index >= 0) {
        this._changeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Perform multiple changes without triggering notifications until complete
   * @param fn Function containing multiple property changes
   */
  batch(fn: () => void): void {
    this._suppressNotifications = true;
    try {
      fn();
    } finally {
      this._suppressNotifications = false;
      this.updateRawData();
      this._changeCallbacks.forEach(cb => cb(this, 'batch'));
    }
  }

  private notifyChange(property: string): void {
    if (this._suppressNotifications) return;
    this.updateRawData();
    this._changeCallbacks.forEach(cb => cb(this, property));
  }

  private updateRawData(): void {
    this._rawData = this.encode();
  }

  constructor(data?: ArrayBuffer | Uint8Array | Buffer) {
    // Initialize all properties first (using internal fields to avoid triggering notifications)
    this._header = new EDIDHeader();
    this._videoInput = new VideoInputDefinition();
    this._screenSize = { type: 'absolute', horizontalCm: 16, verticalCm: 9 };
    this._gamma = 2.2;
    this._featureSupport = new FeatureSupportFlags();
    this._colorCharacteristics = new ColorCharacteristics();
    this._establishedTimings = [];
    this._standardTimings = [];
    this._detailedTimings = [
      generateCVTDetailedTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        blankingMode: 'cvt',
      }),
    ];
    this._displayDescriptors = [];
    this._extensionBlocks = [];
    this._rawData = new Uint8Array(128);

    // If data is provided, decode it to overwrite defaults
    if (data) {
      this.decode(data);
    } else {
      // Initialize raw data for empty EDID
      this.updateRawData();
    }
  }

  /**
   * Decode EDID binary data into this instance
   */
  decode(data: ArrayBuffer | Uint8Array | Buffer): EDID {
    // Convert input to Uint8Array
    let bytes: Uint8Array;
    if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      bytes = data;
    } else {
      // Node.js Buffer
      bytes = new Uint8Array(data);
    }

    // Verify minimum length (128 bytes for basic EDID)
    if (bytes.length < 128) {
      throw new Error(`Invalid EDID: minimum 128 bytes required - current length: ${bytes.length}`);
    }

    // Suppress notifications during decode, then notify once at the end
    this._suppressNotifications = true;

    try {
      // Decode base EDID block (use internal fields to avoid individual notifications)
      this._header = EDIDHeader.decode(bytes);
      
      // Video input definition (byte 20)
      this._videoInput = VideoInputDefinition.decode(bytes[20]);
      
      // Screen size (bytes 21-22)
      this._screenSize = this.decodeScreenSize(bytes[21], bytes[22]);
      
      // Gamma (byte 23)
      this._gamma = bytes[23] === 0xFF ? 0 : (bytes[23] + 100) / 100;
      
      // Feature support (byte 24)
      this._featureSupport = FeatureSupportFlags.decode(bytes[24], this._videoInput.isDigital);
      
      // Color characteristics (bytes 25-34)
      this._colorCharacteristics = ColorCharacteristics.decode(bytes.subarray(25, 35));
      
      // Established timings (bytes 35-37)
      this._establishedTimings = EstablishedTiming.decode(bytes.slice(35, 38));
      
      // Standard timings (bytes 38-53)
      this._standardTimings = StandardTiming.decode(bytes);
      
      // Detailed timing descriptors and display descriptors (bytes 54-125)
      this.decodeDescriptorBlocks(bytes);
      
      // Extension count and checksum
      this.extensions = bytes[126];
      this.checksum = bytes[127];
      this.isValid = this.validateChecksum(bytes.slice(0, 128));

      // Decode extension blocks
      this._extensionBlocks = [];
      for (let i = 0; i < this.extensions && (i + 1) * 128 + 128 <= bytes.length; i++) {
        const extData = bytes.slice((i + 1) * 128, (i + 2) * 128);
        const extBlock = ExtensionBlockParser.decode(extData);
        if (extBlock) {
          this._extensionBlocks.push(extBlock);
        }
      }

      // Store the raw data
      this._rawData = new Uint8Array(bytes);

      return this;
    } catch (error) {
      throw new Error(
        `EDID parsing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      this._suppressNotifications = false;
      // Notify that the entire model was loaded
      this._changeCallbacks.forEach(cb => cb(this, 'decode'));
    }
  }

  private decodeScreenSize(h: number, v: number): ScreenSize {
    if (h === 0 && v === 0) {
      return { type: 'absolute', horizontalCm: 0, verticalCm: 0 };
    }
    if (h !== 0 && v === 0) {
      return { type: 'aspect-ratio', landscapeAspectRatio: h };
    }
    if (h === 0 && v !== 0) {
      return { type: 'aspect-ratio', portraitAspectRatio: v };
    }
    return { type: 'absolute', horizontalCm: h, verticalCm: v };
  }

  private decodeDescriptorBlocks(bytes: Uint8Array): void {
    this._detailedTimings = [];
    this._displayDescriptors = [];

    for (let i = 0; i < 4; i++) {
      const offset = 54 + i * 18;
      const blockData = bytes.slice(offset, offset + 18);

      // Check if this is a display descriptor (starts with 00 00 00)
      if (DisplayDescriptorParser.isDisplayDescriptor(blockData)) {
        const descriptor = DisplayDescriptorParser.decode(blockData);
        if (descriptor) {
          this._displayDescriptors.push(descriptor);
        }
      } else {
        // It's a detailed timing descriptor
        const timing = DetailedTimingDescriptor.decode(blockData);
        if (timing) {
          this._detailedTimings.push(timing);
        }
      }
    }
  }

  private validateChecksum(data: Uint8Array): boolean {
    let sum = 0;
    for (let i = 0; i < Math.min(128, data.length); i++) {
      sum += data[i];
    }
    return (sum & 0xff) === 0;
  }

  /**
   * Encode the current EDID data back to binary format
   */
  encode(): Uint8Array {
    const totalBlocks = 1 + this._extensionBlocks.length;
    const edid = new Uint8Array(totalBlocks * 128);

    // Write header at offset 0-19 (20 bytes)
    const headerBytes = this._header.encode();
    edid.set(headerBytes, 0);

    // Write video input definition at offset 20
    edid[20] = this._videoInput.encode();

    // Write screen size at offset 21-22
    if (this._screenSize.type === 'absolute') {
      edid[21] = this._screenSize.horizontalCm ?? 0;
      edid[22] = this._screenSize.verticalCm ?? 0;
    } else {
      edid[21] = this._screenSize.landscapeAspectRatio ?? 0;
      edid[22] = this._screenSize.portraitAspectRatio ?? 0;
    }

    // Write gamma at offset 23
    edid[23] = this._gamma === 0 ? 0xFF : Math.round(this._gamma * 100 - 100);

    // Write feature support at offset 24
    edid[24] = this._featureSupport.encode(this._videoInput.isDigital);

    // Write color characteristics at offset 25-34 (10 bytes)
    const colorBytes = this._colorCharacteristics.encode();
    edid.set(colorBytes, 25);

    // Write established timings at offset 35-37
    this.encodeEstablishedTimings(edid);

    // Write standard timings at offset 38-53
    this.encodeStandardTimings(edid);

    // Write detailed timings and display descriptors at offset 54-125
    this.encodeDescriptorBlocks(edid);

    // Write extensions count
    edid[126] = this._extensionBlocks.length;

    // Calculate and write checksum for base block
    let sum = 0;
    for (let i = 0; i < 127; i++) {
      sum += edid[i];
    }
    edid[127] = (256 - (sum % 256)) % 256;
    this.checksum = edid[127];

    // Encode extension blocks
    for (let i = 0; i < this._extensionBlocks.length; i++) {
      const extBytes = ExtensionBlockParser.encode(this._extensionBlocks[i]);
      edid.set(extBytes, (i + 1) * 128);
    }

    // Update validity
    this.isValid = this.validateChecksum(edid.slice(0, 128));
    this.extensions = this._extensionBlocks.length;

    return edid;
  }

  /**
   * Update checksum and validity after modifications
   */
  updateChecksum(): void {
    const encoded = this.encode();
    this.checksum = encoded[127];
    this.isValid = true;
  }

  private encodeEstablishedTimings(edid: Uint8Array): void {
    const timingBytes = EstablishedTiming.encode(this._establishedTimings);
    edid.set(timingBytes, 35);
  }

  private encodeStandardTimings(edid: Uint8Array): void {
    const timingBytes = StandardTiming.encode(this._standardTimings);
    edid.set(timingBytes, 38);
  }

  private encodeDescriptorBlocks(edid: Uint8Array): void {
    let blockIndex = 0;
    
    // First, encode detailed timings
    for (const timing of this._detailedTimings) {
      if (blockIndex >= 4) break;
      const timingData = timing.encode();
      edid.set(timingData, 54 + blockIndex * 18);
      blockIndex++;
    }

    // Then, encode display descriptors (skip dummies, we add them to fill remaining slots)
    for (const descriptor of this._displayDescriptors) {
      if (blockIndex >= 4) break;
      if (descriptor.tag === 0x10) continue;
      const descData = DisplayDescriptorParser.encode(descriptor);
      edid.set(descData, 54 + blockIndex * 18);
      blockIndex++;
    }

    // Fill remaining slots with dummy descriptors (all zeros with tag 0x10)
    while (blockIndex < 4) {
      const dummy = DisplayDescriptorParser.encode({ tag: 0x10 });
      edid.set(dummy, 54 + blockIndex * 18);
      blockIndex++;
    }
  }

  // Convenience getters

  /**
   * Get product name from display descriptors
   */
  get productName(): string | null {
    return getProductName(this.displayDescriptors);
  }

  /**
   * Get product serial from display descriptors
   */
  get productSerial(): string | null {
    return getProductSerial(this.displayDescriptors);
  }

  /**
   * Get display range limits from display descriptors
   */
  get rangeLimits() {
    return getRangeLimits(this.displayDescriptors);
  }

  /**
   * Get CEA extension block if present
   */
  get ceaExtension(): CEAExtensionBlock | null {
    return this.extensionBlocks.find(b => b.tag === 0x02) as CEAExtensionBlock ?? null;
  }

  /**
   * Check if HDMI is supported (via CEA extension)
   */
  get isHDMI(): boolean {
    const cea = this.ceaExtension;
    if (!cea) return false;
    return cea.dataBlocks.some(
      b => b.tag === 0x03 && 
      ((b as { ieeeOui?: number }).ieeeOui === 0x000C03)
    );
  }

  /**
   * Get native resolution (first detailed timing)
   */
  get nativeResolution(): { width: number; height: number; refreshRate: number } | null {
    const timing = this.detailedTimings[0];
    if (!timing) return null;
    return {
      width: timing.horizontalActive,
      height: timing.verticalActive,
      refreshRate: Math.round(timing.refreshRate),
    };
  }

  /**
   * Get all supported resolutions
   */
  get supportedResolutions(): Array<{ width: number; height: number; refreshRate: number }> {
    const resolutions: Array<{ width: number; height: number; refreshRate: number }> = [];

    // From detailed timings
    for (const timing of this.detailedTimings) {
      resolutions.push({
        width: timing.horizontalActive,
        height: timing.verticalActive,
        refreshRate: Math.round(timing.refreshRate),
      });
    }

    // From standard timings
    for (const timing of this.standardTimings) {
      resolutions.push({
        width: timing.width,
        height: timing.height,
        refreshRate: timing.refreshRate,
      });
    }

    // From established timings
    for (const timing of this.establishedTimings) {
      resolutions.push({
        width: timing.width,
        height: timing.height,
        refreshRate: timing.refreshRate,
      });
    }

    return resolutions;
  }
}

// Re-export all related classes and types
export {
  DetailedTimingDescriptor,
  decodeEdidCtaDetailedTiming,
  decodeEdidCtaDetailedTimingFlags,
  encodeEdidCtaDetailedTiming,
  encodeEdidCtaDetailedTimingFlags,
  normalizeDetailedTiming,
  normalizeTimingFlags,
} from "../common/detailed-timing-descriptor";
export type { DetailedTiming, DetailedTimingInput, StereoMode, SyncType, TimingFlags } from "../common/detailed-timing-descriptor";
export { ColorCharacteristics } from "./color-characteristics";
export { EDIDHeader, EDID_VERSIONS, EDID_REVISIONS } from "./edid-header";
export type { EDIDVersion } from "./edid-header";
export { EstablishedTiming } from "./established-timing";
export { StandardTiming } from "./standard-timing";
export { VideoInputDefinition, ANALOG_SIGNAL_LEVELS, DIGITAL_BIT_DEPTHS, DIGITAL_INTERFACES } from "./video-input";
export type { VideoInput, AnalogVideoInput, DigitalVideoInput, DigitalBitDepth, DigitalInterface, AnalogSignalLevel } from "./video-input";
export { FeatureSupportFlags, ANALOG_DISPLAY_TYPES, DIGITAL_COLOR_ENCODINGS } from "./feature-support";
export type { FeatureSupport, AnalogDisplayType, DigitalColorEncoding } from "./feature-support";
export { DisplayDescriptorParser, getProductName, getProductSerial, getRangeLimits } from "./display-descriptor";
export type { 
  DisplayDescriptor, 
  DisplayDescriptorTag,
  ProductSerialDescriptor,
  AlphanumericDataDescriptor,
  DisplayRangeLimitsDescriptor,
  ProductNameDescriptor,
  ColorPointDescriptor,
  StandardTimingIdDescriptor,
  DCMDescriptor,
  CVTTimingDescriptor,
  EstablishedTimingsIIIDescriptor,
  DummyDescriptor,
  ManufacturerDescriptor,
} from "./display-descriptor";
export { ExtensionBlockParser, findHDMIBlock, findHDMIForumBlock, getSupportedVICs, getHDMI21Features } from "../cta/extension-block";
export type {
  ExtensionBlock,
  ExtensionTag,
  BaseExtensionBlock,
  CEAExtensionBlock,
  CEADataBlock,
  AudioDataBlock,
  VideoDataBlock,
  VendorSpecificDataBlock,
  SpeakerAllocationBlock,
  VESADisplayTransferCharacteristicBlock,
  CEADetailedTiming,
  VTBExtensionBlock,
  BlockMapExtension,
} from "../cta/extension-block";

// Re-export CTA-861 types and functions
export {
  // CTA Extended Data Blocks
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  // VIC Table
  VIC_TABLE, 
  getVICDefinition, 
  getVICsForResolution, 
  getVICDescription,
  isVIC4K,
  isVIC8K,
  // Audio Format Codes
  AUDIO_FORMAT_CODES,
  EXTENDED_AUDIO_FORMAT_CODES,
  getAudioFormatName,
  getAudioFormatShortName,
  getExtendedAudioFormatName,
  getSamplingRatesString,
  getBitDepthsString,
} from "../cta";
export type {
  ExtendedTagCode,
  ExtendedDataBlock,
  CTAExtendedDataBlock,
  VideoCapabilityDataBlock,
  ColorimetryDataBlock,
  HDRStaticMetadataDataBlock,
  HDRDynamicMetadataDataBlock,
  VideoFormatPreferenceDataBlock,
  YCbCr420VideoDataBlock,
  YCbCr420CapabilityMapDataBlock,
  VendorSpecificVideoDataBlock,
  VendorSpecificAudioDataBlock,
  RoomConfigurationDataBlock,
  SpeakerLocationDataBlock,
  InfoFrameDataBlock,
  VICDefinition,
  AudioFormatDefinition,
} from "../cta";
