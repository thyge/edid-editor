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

const HDMI1_4_BYTES =               0x00 | 0x0C << 8 | 0x03 << 16
const HDMI2_0_BYTES =               0xC4 | 0x5D << 8 | 0xD8 << 16
const HDMIDolbyVision_BYTES =       0x00 | 0xD0 << 8 | 0x46 << 16
const HDMIHDR10_BYTES =             0x90 | 0x84 << 8 | 0x8B << 16
const SpecializedMonitor_BYTES =    0x5C | 0x12 << 8 | 0xCA << 16

const IEEEIdentifyerLookup = new Map();
IEEEIdentifyerLookup.set(HDMI1_4_BYTES, "HDMI 1.4")
IEEEIdentifyerLookup.set(HDMI2_0_BYTES, "HDMI 2.0")
IEEEIdentifyerLookup.set(HDMIDolbyVision_BYTES, "Dolby Vision")
IEEEIdentifyerLookup.set(HDMIHDR10_BYTES, "HDR10+")
IEEEIdentifyerLookup.set(SpecializedMonitor_BYTES, "Specialized Monitor")

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
    for (let i = 4; i < this.Header.dtdStartByte; i++) {
        let blockLength = this.raw[i] & 0x1F
        let blockSlice = this.raw.slice(i, i+blockLength)
        let dbBlock = DecodeDBBlock(blockSlice)
        this.DataBlocks.push(dbBlock)
        i += blockLength
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

function DecodeDBBlock(dbBytes) {
    var db = new CEADataBlock
    db.Header = DecodeDBHeader(dbBytes)
    switch (db.Header.Type) {
        case "DBAudioDataBlock":
            break;
        case "DBVideoDataBlock":
            db.Content.VICs = []
            for (let v = 1; v < db.Header.Size; v++) {
                let vic = vicLookup[dbBytes[v]&0x7F]
                vic.Native = (dbBytes[v]&0x80 > 0)?true:false
                db.Content.VICs.push(vic)
            }
            break;
        case "DBVendorSpecificDataBlock":
            db.Content = DecodeVSDBBlock(dbBytes)
            break;
        case "DBSpeakerAllocationData":
            break;
        case "DBVESAVDIFDataBlock":
            break;
        case "DBReserverdDataBlock":
            break;
        case "DBUseExtendedTag":
            db.Content.ExtendedName = ExtendedTags.get(dbBytes[1])
            break;
    }
    return db
}

function DecodeVSDBBlock(dbBytes) {
    let vsdb = {
    }
    var ieeeID = dbBytes[3] | dbBytes[2] << 8 | dbBytes[1] << 16 
    vsdb.ExtendedName = IEEEIdentifyerLookup.get(ieeeID)
    switch (vsdb.ExtendedName) {
        case "HDMI 1.4":
            vsdb.Address = {}
            vsdb.Address.A = dbBytes[3] >> 4
            vsdb.Address.B = dbBytes[3] & 0xF
            vsdb.Address.C = dbBytes[4] >> 4
            vsdb.Address.D = dbBytes[4] & 0xF
            if (dbBytes.length < 6) {
                break;
            }
            vsdb.BitDepth16 = dbBytes[5]&0x40?true:false
            vsdb.BitDepth12 = dbBytes[5]&0x20?true:false
            vsdb.BitDepth10 = dbBytes[5]&0x10?true:false
            vsdb.DeepColour444 = dbBytes[5]&0x08?true:false
            vsdb.DVIDualLinkOperation = dbBytes[5]&0x01?true:false
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

            vsdb.DC_48bit = dbBytes[7]&0x04?true:false
            vsdb.DC_36bit = dbBytes[7]&0x02?true:false
            vsdb.DC_30bit = dbBytes[7]&0x01?true:false
            
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