import { vicLookup } from "./vics.js";
import {DecodeDTD} from "./18ByteDescriptors.js"

export class CEA {
    Header = {}
    DataBlocks = []
    DetailedTimingBlocks = []
}

const CEADataBlockLookup = new Map();
CEADataBlockLookup.set(1, "DBAudioDataBlock")
CEADataBlockLookup.set(2, "DBVideoDataBlock")
CEADataBlockLookup.set(3, "DBVendorSpecificDataBlock")
CEADataBlockLookup.set(4, "DBSpeakerAllocationData")
CEADataBlockLookup.set(5, "DBVESAVDIFDataBlock")
CEADataBlockLookup.set(6, "DBReserverdDataBlock")
CEADataBlockLookup.set(7, "DBUseExtendedTag")

const ExtendedTags = new Map();
ExtendedTags.set(0, "VideoCapabilityDB")
ExtendedTags.set(1, "VendorSpecificVideoDB")
ExtendedTags.set(2, "VESADisplayDeviceDB")
ExtendedTags.set(3, "VESAVideoTimingBlockExtension")
ExtendedTags.set(4, "HDMIVideoDB")
ExtendedTags.set(5, "ColorimetryDB")
ExtendedTags.set(6, "HDRStaticMetadataDB")
ExtendedTags.set(13, "VideoFormatPreferenceDB")
ExtendedTags.set(14, "YCBCR420VideoDB")
ExtendedTags.set(15, "YCBCR420CapabilityMap")
ExtendedTags.set(16, "CTAMiscellaneousAudioDB")
ExtendedTags.set(17, "VendorSpecificAudioDB")
ExtendedTags.set(18, "HDMIAudioDB")
ExtendedTags.set(19, "RoomConfigurationDB")
ExtendedTags.set(20, "SpeakerLocationDB")

const IEEE_HDMI1_4 =               0x00 | 0x0C << 8 | 0x03 << 16
const IEEE_HDMI2_0 =               0xC4 | 0x5D << 8 | 0xD8 << 16
const IEEE_HDMIDolbyVision =       0x00 | 0xD0 << 8 | 0x46 << 16
const IEEE_HDMIHDR10 =             0x90 | 0x84 << 8 | 0x8B << 16
const IEEE_SpecializedMonitor =    0x5C | 0x12 << 8 | 0xCA << 16
const IEEE_NVIDIA =                0x00 | 0x04 << 8 | 0x4B << 16
const IEEEIdentifyerLookup = new Map();
IEEEIdentifyerLookup.set(IEEE_HDMI1_4, "HDMI 1.4")
IEEEIdentifyerLookup.set(IEEE_HDMI2_0, "HDMI 2.0")
IEEEIdentifyerLookup.set(IEEE_HDMIDolbyVision, "Dolby Vision")
IEEEIdentifyerLookup.set(IEEE_HDMIHDR10, "HDR10+")
IEEEIdentifyerLookup.set(IEEE_SpecializedMonitor, "Specialized Monitor")
IEEEIdentifyerLookup.set(IEEE_NVIDIA, "NVIDIA")

function DecodeDBHeader(dbBytes) {
    return {
        Type: CEADataBlockLookup.get(dbBytes[0] >> 5),
        Size: dbBytes[0] & 0x1F,
    }
}

function DecodeCEAHeader(headerBytes) {
    var header = {}
    header.Version = headerBytes[1]
    header.dtdStartByte = headerBytes[2]
    if (header.Version > 1) {
        // Bit 7	1 if display supports underscan, 0 if not
        // Bit 6	1 if display supports basic audio, 0 if not
        // Bit 5	1 if display supports YCbCr 4∶4∶4, 0 if not
        // Bit 4	1 if display supports YCbCr 4∶2∶2, 0 if not
        // Bit 3–0	Total number of native formats in the DTDs included in this block
        header.Underscan = (headerBytes[3] & 0x80)?true : false
        header.BasicAudio = (headerBytes[3] & 0x40)?true : false
        header.YCBCR444 = (headerBytes[3] & 0x20)?true : false
        header.YCBCR422 = (headerBytes[3] & 0x10)?true : false
    }
    return header
}

CEA.prototype.RemoveDataBlock = function(blockName) {
    console.log("CEA Removing block: " + blockName)
}

CEA.prototype.RemoveCEADetailedTiming = function(blockName) {
    console.log("CEA DTD Removing block: " + blockName)
}

CEA.prototype.DecodeCEA = function(bytes) {
    this.raw = bytes
    // Parse header revision
    // 1, 2, 3 with differences
    this.Header = DecodeCEAHeader(this.raw)

    // Data Block Collection
    // If byte 2 is 04, the collection is of zero length (i.e. not present).
    for (let i = 4; i < this.Header.dtdStartByte;) {
        let blockLength = this.raw[i] & 0x1F
        let blockSlice = this.raw.slice(i, i+blockLength+1)
        let dbBlock = this.DecodeDBBlock(blockSlice)
        this.DataBlocks.push(dbBlock)
        i += blockLength+1
    }
    if (this.Header.dtdStartByte != 0) {
        for (let d = this.Header.dtdStartByte; d < 127-18; d+=18) {
            var dtd = DecodeDTD(this.raw.slice(d, d+18+1))
            if (dtd != null) {
                this.DetailedTimingBlocks.push(dtd)    
            }
        }
    }
}

class CEADataBlock {
    Header = {}
    Content = {}
}

CEA.prototype.DecodeDBBlock = function(dbBytes) {
    var db = new CEADataBlock
    db.Header = DecodeDBHeader(dbBytes)
    switch (db.Header.Type) {
        case "DBAudioDataBlock":
            switch ((dbBytes[1] & 0x78)>>3) {
                case 1:
                    db.Content.AudioType = "LPCM"
                    break;
                case 2:
                    db.Content.AudioType = "AC-3"
                    break;
                case 3:
                    db.Content.AudioType = "MPEG-1"
                    break;
                case 4:
                    db.Content.AudioType = "MP3"
                    break;
                case 5:
                    db.Content.AudioType = "MPEG-2"
                    break;
                case 6:
                    db.Content.AudioType = "AAC LC"
                    break;
                case 7:
                    db.Content.AudioType = "DTS"
                    break;
                case 8:
                    db.Content.AudioType = "ATRAC"
                    break;
                case 9:
                    db.Content.AudioType = "One-Bit Audio"
                    break;
                case 10:
                    db.Content.AudioType = "DD+"
                    break;
                case 11:
                    db.Content.AudioType = "DTS-HD"
                    break;
                case 12:
                    db.Content.AudioType = "MAT/MLP/Dolby TrueHD"
                    break;
                case 13:
                    db.Content.AudioType = "DST Audio"
                    break;  
                case 14:
                    db.Content.AudioType = "Microsoft WMA Pro"
                    break;
                case 15:
                    db.Content.AudioType = "Extension"
                    break;
                default:
                    db.Content.AudioType = "reserved"
                    break;
            }
            db.Content.Channels = (dbBytes[1]&0x7) + 1
            db.Content.Sampling192 = dbBytes[2]&0x40?true:false
            db.Content.Sampling176 = dbBytes[2]&0x20?true:false
            db.Content.Sampling96 = dbBytes[2]&0x10?true:false
            db.Content.Sampling88 = dbBytes[2]&0x08?true:false
            db.Content.Sampling48 = dbBytes[2]&0x04?true:false
            db.Content.Sampling44_1 = dbBytes[2]&0x02?true:false
            db.Content.Sampling32 = dbBytes[2]&0x01?true:false

            db.Content.BitDepth16 = dbBytes[3]&0x01?true:false
            db.Content.BitDepth20 = dbBytes[3]&0x02?true:false
            db.Content.BitDepth24 = dbBytes[3]&0x04?true:false
            break;
        case "DBVideoDataBlock":
            db.Content.VICs = []
            for (let v = 1; v < db.Header.Size; v++) {
                let vic = vicLookup[dbBytes[v]&0x7F]
                vic.Native = ((dbBytes[v]&0x80) > 0)?true:false
                db.Content.VICs.push(vic)
            }
            break;
        case "DBVendorSpecificDataBlock":
            db.Content = DecodeVSDBBlock(dbBytes)
            break;
        case "DBSpeakerAllocationData":
            db.Content.RearLeftRightCenter = dbBytes[1]&0x40?true:false
            db.Content.FrontLeftRightCenter = dbBytes[1]&0x20?true:false
            db.Content.RearCenter = dbBytes[1]&0x10?true:false
            db.Content.RearLeftRight = dbBytes[1]&0x08?true:false
            db.Content.FrontCenter = dbBytes[1]&0x04?true:false
            db.Content.LFE = dbBytes[1]&0x02?true:false
            db.Content.FrontLeftRight = dbBytes[1]&0x01?true:false
            break;
        case "DBVESAVDIFDataBlock":
            break;
        case "DBReserverdDataBlock":
            break;
        case "DBUseExtendedTag":
            db.Content = this.DecodeExtendedTag(dbBytes)
            break;
    }
    return db
}

CEA.prototype.DecodeExtendedTag = function(dbBytes) {
    let ext = {}
    ext.ExtendedName = ExtendedTags.get(dbBytes[1])
    switch (ext.ExtendedName) {

        case "VideoCapabilityDB":
            ext.YCCQuantizationRangeSelectable = dbBytes[2]&0x80?true:false
            ext.RGBQuantizationRangeSelectable = dbBytes[2]&0x40?true:false
            ext.PTOverscanBehavior = ""
            switch (dbBytes[2]&0x30) {
                case 48:
                    ext.PTOverscanBehavior = "Supports both over and underscan"    
                    break;
                case 32:
                    ext.PTOverscanBehavior = "Always Underscanned"
                    break;
                case 16:
                    ext.PTOverscanBehavior = "Always Overscanned"
                    break;
                default:
                    ext.PTOverscanBehavior = "No Data"
                    break;
            }
            ext.ITOverscanBehavior = ""
            switch (dbBytes[2]&0xC) {
                case 12:
                    ext.ITOverscanBehavior = "Supports both over and underscan"    
                    break;
                case 8:
                    ext.ITOverscanBehavior = "Always Underscanned"
                    break;
                case 4:
                    ext.ITOverscanBehavior = "Always Overscanned"
                    break;
                default:
                    ext.ITOverscanBehavior = "No Data"
                    break;
            }
            ext.CEOverscanBehavior = ""
            switch (dbBytes[2]&0x3) {
                case 3:
                    ext.CEOverscanBehavior = "Supports both over and underscan"    
                    break;
                case 2:
                    ext.CEOverscanBehavior = "Always Underscanned"
                    break;
                case 1:
                    ext.CEOverscanBehavior = "Always Overscanned"
                    break;
                default:
                    ext.CEOverscanBehavior = "No Data"
                    break;
            }
            break;
        case "VendorSpecificVideoDB":
            
            break;
        case "VESADisplayDeviceDB":
            break;
        case "VESAVideoTimingBlockExtension":
            break;
        case "HDMIVideoDB":
            break;
        case "ColorimetryDB":
            ext.xvYCC601 = dbBytes[2]&0x80?true:false
            ext.xvYCC709 = dbBytes[2]&0x40?true:false
            ext.sYCC601 = dbBytes[2]&0x20?true:false
            ext.opYCC601 = dbBytes[2]&0x10?true:false
            ext.opRGB = dbBytes[2]&0x08?true:false
            ext.BT2020cYCC = dbBytes[2]&0x04?true:false
            ext.BT2020YCC = dbBytes[2]&0x02?true:false
            ext.BT2020RGB = dbBytes[2]&0x01?true:false
            ext.DCIP3 = dbBytes[3]&0x80?true:false
            break;
        case "HDRStaticMetadataDB":
            ext.HLG = dbBytes[2]&0x08?true:false
            ext.ST2084 = dbBytes[2]&0x04?true:false
            ext.HDR = dbBytes[2]&0x02?true:false
            ext.SDR = dbBytes[2]&0x01?true:false
            ext.StaticMetadataType1 = dbBytes[3]&0x01?true:false
            if (ext.StaticMetadataType1 && (dbBytes.length > 4)) {
                // Luminance value= 50 * 2(CV/32)
                ext.ContentMaxLuminanceData = 50 * Math.pow(2, dbBytes[4]/32)
                ext.ContentMaxFrameAverage = 50 * Math.pow(2, dbBytes[5]/32)
                // Desired Content Min Luminance = Desired Content Max Luminance * (CV/255)2 / 100
                ext.ContentMinLuminance = ext.ContentMaxLuminanceData * Math.pow(dbBytes[6]/255, 2) / 100
            }
            break;
        case "VideoFormatPreferenceDB":
            break;
        case "YCBCR420VideoDB":
            break;
        case "YCBCR420CapabilityMap":
            var mvics = []
            this.DataBlocks.forEach((d) => {
                if (d.Header.Type === "DBVideoDataBlock") {
                    mvics = d.Content.VICs
                }
            })
            ext.VICs = []
            var vicCounter = 0
            for (let i = 2; i < dbBytes.length; i++) {
                for (let s = 1; s < 255;) {
                    if ((dbBytes[i]&s)>0) {
                        ext.VICs.push(mvics[vicCounter])
                    }
                    vicCounter++
                    s = s<<1
                }
            }
            break;
        case "CTAMiscellaneousAudioDB":
            break;
        case "VendorSpecificAudioDB":
            break;
        case "HDMIAudioDB":
            break;
        case "RoomConfigurationDB":
            break;
        case "SpeakerLocationDB":
    }
    return ext
}

function DecodeVSDBBlock(dbBytes) {
    let vsdb = {
    }
    var ieeeID = dbBytes[3] | dbBytes[2] << 8 | dbBytes[1] << 16 
    vsdb.ExtendedName = IEEEIdentifyerLookup.get(ieeeID)
    switch (vsdb.ExtendedName) {
        case "HDMI 1.4":
            vsdb.Address = {}
            vsdb.Address.A = dbBytes[4] >> 4
            vsdb.Address.B = dbBytes[4] & 0xF
            vsdb.Address.C = dbBytes[5] >> 4
            vsdb.Address.D = dbBytes[5] & 0xF
            if (dbBytes.length < 6) {
                break;
            }
            vsdb.BitDepth16 = dbBytes[6]&0x40?true:false
            vsdb.BitDepth12 = dbBytes[6]&0x20?true:false
            vsdb.BitDepth10 = dbBytes[6]&0x10?true:false
            vsdb.DeepColour444 = dbBytes[6]&0x08?true:false
            vsdb.DVIDualLinkOperation = dbBytes[6]&0x01?true:false
            vsdb.Max_TMDS_Clock = dbBytes[7]*5 //MHz
            break;
        case "HDMI 2.0":
            vsdb.Max_TMDS_Frequency = dbBytes[5] * 5
            
            vsdb.SCDC_Present = dbBytes[6]&0x80?true:false
            vsdb.RR_Capable = dbBytes[6]&0x40?true:false
            vsdb.CCBPCI = dbBytes[6]&0x10?true:false
            vsdb.LTE_340Mcsc_scramble = dbBytes[6]&0x08?true:false
            vsdb.Independent_View = dbBytes[6]&0x04?true:false
            vsdb.Dual_View = dbBytes[6]&0x02?true:false
            vsdb.OSD_3D_Disparity = dbBytes[6]&0x02?true:false

            vsdb.DC_Y420_48bit = dbBytes[7]&0x04?true:false
            vsdb.DC_Y420_36bit = dbBytes[7]&0x02?true:false
            vsdb.DC_Y420_30bit = dbBytes[7]&0x01?true:false

            if (dbBytes.length < 8) {
                break;
            }
            switch (dbBytes[7] >> 4) {
                case 0:
                    vsdb.MaxFixedRateLink = "FRL_NotSupported";
                    break;
                case 1:
                    vsdb.MaxFixedRateLink = "FRL_3G_3Lanes";
                    break;
                case 2:
                    vsdb.MaxFixedRateLink = "FRL_6G_3Lanes";
                    break;
                case 3:
                    vsdb.MaxFixedRateLink = "FRL_6G_4Lanes";
                    break;
                case 4:
                    vsdb.MaxFixedRateLink = "FRL_8G_4Lanes";
                    break;
                case 5:
                    vsdb.MaxFixedRateLink = "FRL_10G_4Lanes";
                    break;
                case 6:
                    vsdb.MaxFixedRateLink = "FRL_12G_4Lanes";
                    break;
                default:
                    break;
            }

            break;
        case "Dolby Vision":
            break;
        case "HDR10+":
            break;
        case "Specialized Monitor":
            break;
        default:
            break;
    }
    return vsdb
}