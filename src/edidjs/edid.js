import {vicLookup} from "./vics.js"
import {pnpLookup} from "./pnp.js"

const TimingExtension                          = 0x00
const CEAExtension                             = 0x02
const VideoTimingBlockExtension                = 0x10
const EDID2_0Extension                         = 0x20
const DisplayInformationExtension              = 0x40
const LocalizedStringExtension                 = 0x50
const MicrodisplayInterfaceExtension           = 0x60
const DisplayIDExtension                       = 0x70
const DisplayTransferCharacteristicsDataBlock1 = 0xA7
const DisplayTransferCharacteristicsDataBlock2 = 0xAF
const DisplayTransferCharacteristicsDataBlock3 = 0xBF
const BlockMap                                 = 0xF0
const DisplayDeviceDataBlock                   = 0xFF

export default class EEDID {
    raw = new Uint8Array()
    Extensions = 0
    Errors = []
    
    constructor(){
    }

    ParseEEDID(bytes) {
        this.raw = bytes
        this.Extensions = this.raw[126]
        for (let i = 0; i < this.Extensions + 1; i++) {
            let extBytes = new Uint8Array(this.raw.slice(i*128, 128 + (i*128)));
            if (i === 0) {
                this.EDID = new EDID()
                this.EDID.DecodeEDID(extBytes)
            } else {
                switch (extBytes[0]) {
                    case TimingExtension: break;
                    case CEAExtension:
                        this.CEA = new CEA()
                        this.CEA.DecodeCEA(extBytes);
                        break;
                    case VideoTimingBlockExtension: break;
                    case EDID2_0Extension: break;
                    case DisplayInformationExtension: break;
                    case LocalizedStringExtension: break;
                    case MicrodisplayInterfaceExtension: break;
                    case DisplayIDExtension:
                        this.DID = new DisplayID()
                        this.DID.DecodeDisplayID(extBytes);
                        break;
                    case DisplayTransferCharacteristicsDataBlock1: break;
                    case DisplayTransferCharacteristicsDataBlock2: break;
                    case DisplayTransferCharacteristicsDataBlock3: break;
                    case BlockMap: break;
                    case DisplayDeviceDataBlock: break;
                    default:
                        console.log("extension not supported")
                        break;
                }
            }
        }
    }
    UpdateEEDIDRaw() {
        if (this.EDID) {
            for (let i = 0; i < this.EDID.raw.length; i++) {
                this.raw[i] = this.EDID.raw[i]
            }
        }
        if (this.CEA) {
            for (let i = 0; i < this.CEA.raw.length; i++) {
                this.raw[i+128] = this.CEA.raw[i]
            }
        }
    }
}

class EDID {
    raw = new Uint8Array()
    Version = 0
    Revision = 0
    WeekOfManufacture = 0
    YearOfManufacture = 0
    EstablishedTimings = {}
    StandardTimings = []
    DetailedTimingDescriptors = []
    DisplayDescriptors = []
    Errors = []
}

EDID.prototype.SetManufactureDate = function() {
    if (this.WeekOfManufacture > 52) {
        this.raw[16] = 52
    } else if (this.WeekOfManufacture < 0) {
        this.raw[16] = 52
    } else {
        this.raw[16] = this.WeekOfManufacture
    }
    this.raw[16] = this.WeekOfManufacture
    if (this.YearOfManufacture >= 1990) {
        this.raw[17] = this.YearOfManufacture - 1990
    } else {
        this.raw[17] = 0
    }
    
}

EDID.prototype.SetEDIDVersion = function() {
    this.raw[18] = this.Version
    this.raw[19] = this.Revision
}

EDID.prototype.SetGamma = function() {
    if ((this.Gamma >= 1.00)&& (this.Gamma <= 3.54)) {
        this.raw[23] = (this.Gamma * 100) - 100
    }
}

EDID.prototype.CalcChecksum = function() {
    let checksum = 0;
    for (let i = 0; i < 127; i++) {
        checksum += this.raw[i];
    }
    this.raw[127] = (256-(checksum % 256));
}

EDID.prototype.SetSerialNumber = function() {
    this.raw[12] = this.SerialNumber & 0xFF
    this.raw[13] = (this.SerialNumber >> 8) & 0xFF
    this.raw[14] = (this.SerialNumber >> 16) & 0xFF
    this.raw[15] = (this.SerialNumber >> 24) & 0xFF
}

EDID.prototype.SetEstablishedTimings = function() {
    this.raw[35] = 0
    this.raw[35] |= this.EstablishedTimings.ET720_400_70?0x80:0
    this.raw[35] |= this.EstablishedTimings.ET720_400_88?0x40:0
    this.raw[35] |= this.EstablishedTimings.ET640_480_60?0x20:0
    this.raw[35] |= this.EstablishedTimings.ET640_480_67?0x10:0
    this.raw[35] |= this.EstablishedTimings.ET640_480_72?0x08:0
    this.raw[35] |= this.EstablishedTimings.ET640_480_75?0x04:0
    this.raw[35] |= this.EstablishedTimings.ET800_600_56?0x02:0
    this.raw[35] |= this.EstablishedTimings.ET800_600_60?0x01:0

    this.raw[36] = 0
    this.raw[36] |= this.EstablishedTimings.ET800_600_72?0x80:0
    this.raw[36] |= this.EstablishedTimings.ET800_600_75?0x40:0
    this.raw[36] |= this.EstablishedTimings.ET832_624_75?0x20:0
    this.raw[36] |= this.EstablishedTimings.ET1024_768_87?0x10:0
    this.raw[36] |= this.EstablishedTimings.ET1024_768_60?0x08:0
    this.raw[36] |= this.EstablishedTimings.ET1024_768_70?0x04:0
    this.raw[36] |= this.EstablishedTimings.ET1024_768_75?0x02:0
    this.raw[36] |= this.EstablishedTimings.ET1280_1024_75?0x01:0
    
    this.raw[37] = 0
    this.raw[37] |= this.EstablishedTimings.ET1152_870_75?0x80:0
}

EDID.prototype.RemoveDisplayDescriptor = function(blockName) {
    // store the first byte where dd starts
    let startByte = 54
    let p18ByteDescriptors = []
    p18ByteDescriptors.push(this.DetailedTimingDescriptors)
    p18ByteDescriptors.push(this.DisplayDescriptors)
    p18ByteDescriptors.forEach((ddd, bigI) => {
        ddd.forEach((dd, i) => {
            if (dd.Type === blockName) {
                // then remove from structure
                if (bigI === 0) {
                    this.DetailedTimingDescriptors.splice(i, 1)
                } else if (bigI === 1) {
                    this.DisplayDescriptors.splice(i, 1)    
                }
                // Concatinate the 2 arrays to 18b descriptors
                p18ByteDescriptors = []
                this.DetailedTimingDescriptors.forEach(d => {
                    p18ByteDescriptors.push(d)
                })
                this.DisplayDescriptors.forEach(d => {
                    p18ByteDescriptors.push(d)
                })
                // Move blocks forward in raw
                p18ByteDescriptors.forEach(desc => {
                    for (let di = 0; di < desc.raw.length; di++) {
                        this.raw[startByte] = desc.raw[di]
                        startByte++
                    }
                })
                // pad out using raw
                for (let di = 0; di < 18; di++) {
                    this.raw[startByte] = 0
                    startByte++
                }
                // update the block counter so we know we have more space
                this.NumberOfDTDs--
            }
        })
    })
}

function DecodeRangeLimits(bytes) {
    var drld = new Object()
    if (bytes[0]&0x03 === 0) {
		drld.VerticalRateOffsetZero = true
	}
	if (bytes[0]&0x12 === 0) {
		drld.HorizontalRateOffsetZero = true
	}
	// Vertical Minimum
	if (bytes[1]&0x03 != 3) {
		drld.MinimumVerticalRate = bytes[1] + 1
	} else {
		drld.MinimumVerticalRate = bytes[1] + 256
	}
	// Vertical Maximum
	if (bytes[2]&0x03 != 3) {
		drld.MinimumVerticalRate = bytes[2] + 1
	} else {
		drld.MinimumVerticalRate = bytes[2] + 256
	}
	// Horizontal Minimum
	if (bytes[3]&0x03 != 3) {
		drld.MinimumVerticalRate = bytes[3] + 1
	} else {
		drld.MinimumVerticalRate = bytes[3] + 256
	}
	// Horizontal Maximum
	if (bytes[4]&0x03 != 3) {
		drld.MinimumVerticalRate = bytes[4] + 1
	} else {
		drld.MinimumVerticalRate = bytes[4] + 256
	}
	// Maximum Pixel Clock
	drld.MaximumPixelClock = bytes[5] * 10

	// Video Timing Support Flags: Bytes 10 → 17 indicate support for additional video timings.
	if (bytes[6] === 0x02) {
		// Secondary GTF supported
		// With EDID Structure version 1, revision 4,
		// GTF has been Deprecated (GTF is considered obsolete and in the process of being phased out) in favor of CVT
		// panic("Not implemented")
	} else if (bytes[6] === 0x04) {
		// Display Range Limits & CVT Support Definition
		// panic("Display Range Limits & CVT Support Definition Not implemented")
		// Line Feed (if Byte 10 = 00h or 01h)
		// Space (if Byte 10 = 00h or 01h)s
	}
	return drld
}

EDID.prototype.GetPNPCompanyName = function() {
    let obj = pnpLookup.find(o => o.ID === this.ManufacturerID);
    return obj.Company
}

EDID.prototype.DecodeEDID = function(bytes) {
    this.raw = bytes
    // Manufacturer ID. This is a legacy Plug and Play ID assigned by UEFI forum
    this.ManufacturerID = ""
    this.ManufacturerID += String.fromCharCode(((this.raw[8] & 0x7C) >> 2) + 0x40)
	this.ManufacturerID += String.fromCharCode(((this.raw[8] & 0x03) << 3) + ((this.raw[9] & 0xE0) >> 5) + 0x40)
	this.ManufacturerID += String.fromCharCode((this.raw[9] & 0x1F) + 0x40)
    
    // Manufacturer product code. 
    this.ManufacturerPC = (this.raw[11]<< 8) | this.raw[10];

    // Serial number
	this.SerialNumber = this.raw[12]
	this.SerialNumber |= this.raw[13] << 8
	this.SerialNumber |= this.raw[14] << 16
	this.SerialNumber |= this.raw[15] << 24

    // Week of manufacture
    this.WeekOfManufacture = this.raw[16]
    // Year of manufacture
    this.YearOfManufacture = this.raw[17] + 1990
    // Version
    this.Version = this.raw[18]
    // Revision
    this.Revision = this.raw[19]

    // Basic display parameters
    // byte 20
    // Bit 7 = 1	Digital input
    // Bits 6–4	Bit depth:
    // 000 = undefined
    // 001 = 6
    // 010 = 8
    // 011 = 10
    // 100 = 12
    // 101 = 14
    // 110 = 16 bits per color
    // 111 = reserved
    // Bits 3–0	Video interface:
    // 0000 = undefined
    // 0010 = HDMIa
    // 0011 = HDMIb
    // 0100 = MDDI
    // 0101 = DisplayPort
    if (this.raw[20]&0x80) {
        this.Digital = true
    } else {
        this.Digital = false
        this.Errors += "EDID.Analog decoder not supported yet\n"
    }

    // EDID 1.4
    switch (this.raw[20] & 0x78) {
        case 0:
            this.VideoBitDepth = "undefined"
            break;
        case 16:
            this.VideoBitDepth = "6"
            break;
        case 32:
            this.VideoBitDepth = "8"
            break;
        case 48:
            this.VideoBitDepth = "10"
            break;
        case 64:
            this.VideoBitDepth = "12"
            break;
        case 96:
            this.VideoBitDepth = "16"
            break;
        case 112:
            this.VideoBitDepth = "reserved"
            break;
        default:
            this.Errors.push("EDID.VideoBitDepth set incorrectly in EDID\n")
    }

    // EDID 1.4
    switch (this.raw[20] & 0x7) {
        case 0:
            this.VideoInterface = "undefined"
            break;
        case 2:
            this.VideoInterface = "HDMIa"
            break;
        case 3:
            this.VideoInterface = "HDMIb"
            break;
        case 4:
            this.VideoInterface = "MDDI"
            break;
        case 5:
            this.VideoInterface = "DisplayPort"
            break;
        default:
            this.Errors.push("EDID.VideoInterface set incorrectly in EDID\n")
    }
    
    // Horizontal screen size
    // Vertical screen size
    this.HorizontalSizeCM = this.raw[21]
    this.VerticalSizeCM = this.raw[22]
    
    // EDID 1.4 H & V Screen Size and Aspect Ratio
    // TODO

    // Display gamma
    if (this.raw[22] === 0xFF) {
        console.log("gamma is defined by DI-EXT block.")
    }
    this.Gamma = ((this.raw[23]) / 100) + 1

    // DPMS
    this.DPMSstandby = (this.raw[24] & 0x80)?true:false
    this.DPMSsuspend = (this.raw[24] & 0x40)?true:false
    this.DPMSactiveOff = (this.raw[24] & 0x20)?true:false
    // EDID 1.4 Supported features
    if (this.Digital) {
        // 00 = RGB 4:4:4
        // 01 = RGB 4:4:4 + YCrCb 4:4:4
        // 10 = RGB 4:4:4 + YCrCb 4:2:2
        // 11 = RGB 4:4:4 + YCrCb 4:4:4 + YCrCb 4:2:2
        switch (this.raw[24] & 0x18) {
            case 0:
                this.ColourEncoding = "RGB 4:4:4"
                break;
            case 8:
                this.ColourEncoding = "RGB 4:4:4 + YCrCb 4:4:4"
                break;
            case 16:
                this.ColourEncoding = "RGB 4:4:4 + YCrCb 4:2:2"
                break;
            case 24:
                this.ColourEncoding = "RGB 4:4:4 + YCrCb 4:4:4 + YCrCb 4:2:2"
                break;
        }
    }

    this.SRGB = ((this.raw[24]&0x4) > 0)?true : false
    this.PreferredTiming = ((this.raw[24]&0x2) > 0)?true : false
    if (this.Revision === 3) {
        if (this.PreferredTiming != true) {
            this.Errors.push("Table 3.14 note 4, bit 1 (at address 18h) shall be set to 1 (0 is invalid)")
        }
    }
    // Continious frequency or GTF
	// For EDID version 1, revision 3, bit 0 (at address 18h) indicated support for or no support for GTF (using the default GTF parameter values).
	// For EDID version 1, revision 4, bit 0 (at address 18h) has been redefined to indicate
	// Continuous Frequency Display (set bit 0 to 1) or Non-Continuous Frequency (Multi-Mode) Display (set bit 0 to 0).
	// If bit 0 is set to 1, then the display will accept GTF or CVT generated timings (from a source)
	// that are within the display’s range limits.
    if (this.Revision > 3) {
        // EDID 1.4
        this.ContiniousFrequency = (this.raw[24]&0x1 > 0)?true : false
    } else {
        this.GTFSupport = (this.raw[24]&0x1 > 0)?true : false
    }
    

    // TODO:
    // Bit 2	Standard sRGB colour space. Bytes 25–34 must contain sRGB standard values.
    // EDID 1.4 Bit 1	Preferred timing mode specified in descriptor block 1. For EDID 1.3+ the preferred timing mode is always in the first Detailed Timing Descriptor. In that case, this bit specifies whether the preferred timing mode includes native pixel format and refresh rate.
    // EDID 1.4 Bit 0	Continuous timings with GTF or CVT

    // Chromaticity coordinates.
    this.Chromaticity = {}
    this.Chromaticity.RedX = ((this.raw[27]<<2)|((this.raw[25]>>6)&0x3)) / 1024
	this.Chromaticity.RedY = ((this.raw[28]<<2)|((this.raw[25]>>4)&0x3)) / 1024
	this.Chromaticity.GreenX = ((this.raw[29]<<2)|((this.raw[25]>>2)&0x3)) / 1024
	this.Chromaticity.GreenY = ((this.raw[30]<<2)|(this.raw[25]&0x3)) / 1024
	this.Chromaticity.BlueX = ((this.raw[31]<<2)|((this.raw[26]>>6)&0x3)) / 1024
	this.Chromaticity.BlueY = ((this.raw[32]<<2)|((this.raw[26]>>4)&0x3)) / 1024
	this.Chromaticity.WhiteX = ((this.raw[33]<<2)|((this.raw[26]>>2)&0x3)) / 1024
	this.Chromaticity.WhiteY = ((this.raw[34]<<2)|(this.raw[26]&0x3)) / 1024

    // Established timing bitmap. Supported bitmap for (formerly) very common timing modes.
    var etBytes = this.raw.slice(35, 38) // Get 3 ET bytes
    this.EstablishedTimings.ET720_400_70 =  etBytes[0]&0x80?true:false
    this.EstablishedTimings.ET720_400_88 =  etBytes[0]&0x40?true:false
    this.EstablishedTimings.ET640_480_60 =  etBytes[0]&0x20?true:false
    this.EstablishedTimings.ET640_480_67 =  etBytes[0]&0x10?true:false
    this.EstablishedTimings.ET640_480_72 =  etBytes[0]&0x08?true:false
    this.EstablishedTimings.ET640_480_75 =  etBytes[0]&0x04?true:false
    this.EstablishedTimings.ET800_600_56 =  etBytes[0]&0x02?true:false
    this.EstablishedTimings.ET800_600_60 =  etBytes[0]&0x01?true:false

    this.EstablishedTimings.ET800_600_72 =  etBytes[1]&0x80?true:false
    this.EstablishedTimings.ET800_600_75 =  etBytes[1]&0x40?true:false
    this.EstablishedTimings.ET832_624_75 =  etBytes[1]&0x20?true:false
    this.EstablishedTimings.ET1024_768_87 = etBytes[1]&0x10?true:false
    this.EstablishedTimings.ET1024_768_60 = etBytes[1]&0x08?true:false
    this.EstablishedTimings.ET1024_768_70 = etBytes[1]&0x04?true:false
    this.EstablishedTimings.ET1024_768_75 = etBytes[1]&0x02?true:false
    this.EstablishedTimings.ET1280_1024_75 = etBytes[1]&0x01?true:false

    this.EstablishedTimings.ET1152_870_75 =  etBytes[2]&0x80?true:false
    
    // Standard timing information
    for (let i = 38; i < 54; i+=2) {
        // Unused fields are filled with 01 01
        if ((this.raw[i] === 0x1) & (this.raw[i+1] === 0x1)) {
			continue
		}
        let aspect = ""
        switch (this.raw[i+1] >> 6) {
            case 0:
                aspect = "16:10"
                break;
            case 1:
                aspect = "4:3"
                break;
            case 2:
                aspect = "16:9"
                break;
            case 3:
                aspect = "16:10"
                break;
            default:
                break;
        }
        let stdTiming = {
            HorizontalActive : (this.raw[i] + 31) * 8,
            AspectRatio : aspect,
            RefreshRate : (this.raw[i+1]&0x3F) + 60,
        }
        this.StandardTimings.push(stdTiming)
    }
    // Detailed timing descriptors
    this.NumberOfDTDs = 0
    for (let i = 54; i < 126; i+=18) {
        // if first 2 bytes / pixel clock is 0 then parse as Display Descriptor
        this.NumberOfDTDs++
        let descriptorBytes = this.raw.slice(i,i+18)
        let descHeader = descriptorBytes[1]<<8 | descriptorBytes[0]
        if (descHeader != 0) {
            let dtd = DecodeDTD(descriptorBytes, this.NumberOfDTDs)
            dtd.startByte = i;
            dtd.endByte = i+18
            this.DetailedTimingDescriptors.push(dtd)
        } else {
            switch (descriptorBytes[3]) {
                case 0xFF:
                    // Display serial number (ASCII text)
                    // This field takes presidence over [12:15]
                    var serial = ""
                    for (let d = 5; d < 19; d++) {
                        serial += String.fromCharCode(descriptorBytes[d])
                    }
                    this.SerialNumber = serial.trim()
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Display serial number (ASCII text)",
                        Content : serial
                    })
                    break;
                case 0xFE:
                    // Unspecified text (ASCII text)
                    var unspes = ""
                    for (let d = 5; d < 19; d++) {
                        if ((descriptorBytes[d] > 31) && (descriptorBytes[d] < 127) ) {
                            unspes += String.fromCharCode(descriptorBytes[d])    
                        }
                    }
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Unspecified text (ASCII text)",
                        Content : unspes,
                    })
                    break;
                case 0xFD:
                    // Display Range Limits:
                    // Includes optional timing information --- GTF using default parameters, GTF Secondary Curve or CVT Descriptor.
        
                    // The Display Range Limits Descriptor will include one of the following sets of information:
                    // 1. Range Limits Only --- no additional timing information provided (defined in table 3.26) - Default GTF, GTF Secondary Curve and CVT are not supported or
                    // 2. Range Limits provided & Default GTF is supported - no additional timing information provided (defined in Table 3.26) or
                    // 3. Range Limits provided & GTF Secondary Curve Timing Formula is supported – Secondary GTF Curve Data (defined in Table 3.27) or
                    // 4. Range Limits provided & CVT Timing Formula is supported – Coordinated Video Timing Data (defined in Table 3.28).
                    this.DisplayRangeLimits = DecodeRangeLimits(descriptorBytes)
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Display Range Limits",
                        Content : this.DisplayRangeLimits,
                    })
                    break;
                case 0xFC:
                    // Display Product Name
                    // dispsn := DisplayMonitorName{}
                    // dispsn.Decode(edid.raw[startByte+5 : startByte+18])
                    // edid.DisplayDescriptors = append(edid.DisplayDescriptors, &dispsn)
                    var dpn = ""
                    for (let d = 5; d < 19; d++) {
                        // Accept ASCII only
                        if ((descriptorBytes[d] > 31) && (descriptorBytes[d] < 127) ) {
                            dpn += String.fromCharCode(descriptorBytes[d])    
                        }
                    }
                    this.ProductName = dpn.trim()
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Display Product Name",
                        Content : dpn.trim(),
                    })
                    break;
                case 0xFB:
                    // Color Point Data:
                    // console.log("Additional white point data. 2× 5-byte descriptors, padded with 0A 20 20")
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Color Point Data",
                    })
                    break;
                case 0xFA:
                    // Standard Timing Definitions
                    // console.log("Additional standard timing identifiers. 6× 2-byte descriptors, padded with 0A")
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Standard Timing Identifications",
                    })
                    break;
                case 0xF9:
                    // Display Color Management (DCM)
                    // console.log("Display Color Management (DCM)")
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Display Color Management (DCM)",
                    })
                    break;
                case 0xF8:
                    // CVT 3-Byte Timing Codes
                    // console.log("CVT 3-Byte Timing Codes")
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "CVT 3-Byte Timing Codes",
                    })
                    break;
                case 0xF7:
                    // Established Timings 3
                    // console.log("Established Timings III")
                    this.DisplayDescriptors.push({
                        raw : descriptorBytes,
                        startByte : i,
                        endByte : i+18,
                        Type : "Established Timings III",
                    })
                    break;
                case 0x10:
                    // Dummy identifier.
            }
        }
    }
}

class CEA {
    Header = {}
    DataBlocksCollection = []
    DetailedTimingBlocks = []
}

CEA.prototype.RemoveDataBlock = function(blockName) {
    console.log("CEA Removing block: " + blockName)
}

CEA.prototype.RemoveCEADetailedTiming = function(blockName) {
    console.log("CEA DTD Removing block: " + blockName)
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
IEEEIdentifyerLookup.set(SpecializedMonitor_BYTES, "Epecialized Monitor")

function DecodeDBHeader(dbBytes) {
    var dbTag = CEADataBlockLookup.get(dbBytes[0] >> 5)
    let retObj = {
        CEABlockType: dbTag,
        Size:       dbBytes[0] & 0x1F,
    }

    switch (dbTag) {
        case "DBAudioDataBlock":
            break;
        case "DBVideoDataBlock":
            break;
        case "DBVendorSpecificDataBlock":
            var ieeeID = dbBytes[3] | dbBytes[2] << 8 | dbBytes[1] << 16 
            retObj.dbTag = IEEEIdentifyerLookup.get(ieeeID)
            break;
        case "DBSpeakerAllocationData":
            break;
        case "DBVESAVDIFDataBlock":
            break;
        case "DBReserverdDataBlock":
            break;
        case "DBUseExtendedTag":
            dbTag = ExtendedTags.get(dbBytes[1])
            break;
    }
    return retObj
}

function DecodeCEAHeader(headerBytes) {
    var header = {}
    header.Version = headerBytes[1]
    header.dtdStartByte = headerBytes[2]
    if (headerBytes[1] > 1) {
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

function DecodeDTD(edidBytes, i) {
    let d = {}
    d.Type = "edid-DTD" + i
    d.raw = edidBytes
    d.PixelClockKHz = (edidBytes[1] << 8 | edidBytes[0])*10
    if (d.PixelClockKHz === 0) {
        return null
    }
    d.HorizontalActive = (edidBytes[4]&0xF0) << 4 | edidBytes[2]
    d.HorizontalBlanking = edidBytes[3] | (edidBytes[4]&0xF) << 8
    d.VerticalActive = (edidBytes[7]&0xF0) << 4 | edidBytes[5]
    d.VerticalBlanking = (edidBytes[7]&0xF) << 8 | edidBytes[6]

    d.HorizontalFrontPorch = ((edidBytes[11] & 0xC0) << 2) | edidBytes[8]
	d.HorizontalSyncPulseWidth = ((edidBytes[11] & 0x30) << 4) | edidBytes[9]

	d.VerticalFrontPorch = ((edidBytes[11]) & 0xC << 2) | ((edidBytes[10] & 0xF0) >> 4)
	d.VerticalSyncPulseWidth = ((edidBytes[11] & 0x3) << 4) | (edidBytes[10] & 0xF)

	d.HorizontalImageSize = ((edidBytes[14] & 0xF0) << 4) | edidBytes[12]
	d.VerticalImageSize = ((edidBytes[14] & 0xF) << 8) | edidBytes[13]

    d.HorizontalBorder = edidBytes[15]
	d.VerticalBorder = edidBytes[16]
    d.Interlaced = (edidBytes[17] & 0x80)?true:false
    switch ((edidBytes[17] & 0x61)) {
        case 0:
            d.StereoMode = "none"
            break;
        case 1:
            if (edidBytes[17] & 0x1) {
                d.StereoMode = "2-way interleaved, right image on even lines"
            } else {
                d.StereoMode = "field sequential, right during stereo sync"
            }
            break;
        case 2:
            if (edidBytes[17] & 0x1) {
                d.StereoMode = "field sequential, left during stereo sync"
            } else {
                d.StereoMode = "2-way interleaved, left image on even lines"
            }
            break;
        case 3:
            if (edidBytes[17] & 0x1) {
                d.StereoMode = "side-by-side interleaved"
            } else {
                d.StereoMode = "4-way interleaved"
            }
            break;
    }
    switch ((edidBytes[17] & 0x10)>>4) {
        case 0:
            // Analog
            d.SyncMode = {
                Type: "Analog",
            }
            break;
        case 1:
            switch ((edidBytes[17] & 0x8)>>3) {
                case 0:
                    d.SyncMode = {
                        Type: "Digital",
                        Serration: (edidBytes[17] & 0x4)>>2?true:false,
                        HorizontalSyncPolarity : (edidBytes[17] & 0x2)>>1?"Positive":"Negative",
                    }
                    break;
                case 1:
                    d.SyncMode = {
                        Type: "Digital",
                        VerticalSyncPolarity: (edidBytes[17] & 0x4)>>2?"Positive":"Negative",
                        HorizontalSyncPolarity : (edidBytes[17] & 0x2)>>1?"Positive":"Negative",
                    }
                    break;
            }
            break;
    }

    d.horTotPix = d.HorizontalActive + d.HorizontalBlanking
	d.verTotPix = d.VerticalActive + d.VerticalBlanking
	d.VerticalRefreshRate = (d.PixelClockKHz*1000) / (d.horTotPix * d.verTotPix)
    return d
}

CEA.prototype.DecodeCEA = function(bytes) {
    this.raw = bytes
    // Parse header revision
    // 1, 2, 3 with differences
    this.Header = DecodeCEAHeader(this.raw)

    // Data Block Collection
    // If byte 2 is 04, the collection is of zero length (i.e. not present).
    for (let i = 4; i < this.Header.dtdStartByte; i++) {
         // slice datablock header + extended tag including IEEE VSDB
        let headerSlice = this.raw.slice(i, i+4)
        let dbHeader = DecodeDBHeader(headerSlice)
        // Hacky decode
        let dataSlice = this.raw.slice(i, i+dbHeader.Size)
        if (dbHeader.CEABlockType === "DBVideoDataBlock") {
            dbHeader.VICs = []
            for (let v = 1; v < dbHeader.Size; v++) {
                let vic = vicLookup[dataSlice[v]&0x7F]
                vic.Native = (dataSlice[v]&0x80 > 0)?true:false
                dbHeader.VICs.push(vic)
            }
        }
            
        this.DataBlocksCollection.push(dbHeader)
        i += dbHeader.Length
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

class DisplayID {
    raw = new Uint8Array()
    Version = 0
    Revision = 0
    VariableDataBlockLength = 0
}

DisplayID.prototype.DecodeDisplayID = function(bytes) {
    // DisplayID structure does not include header byte
    bytes = bytes.slice(1,bytes.length)
    
    this.Version = bytes[0] >> 4
    this.Revision = bytes[0] & 0xF
    this.VariableDataBlockLength = bytes[1]
    switch (bytes[2]) {
        case 0x00:
            this.DisplayPrimaryUsecase = "ExtensionSection"
            break;
        case 0x01:
            this.DisplayPrimaryUsecase = "TestStructure"
            break;
        case 0x02:
            this.DisplayPrimaryUsecase = "Generic"
            break;
        case 0x03:
            this.DisplayPrimaryUsecase = "Television"
            break;
        case 0x04:
            this.DisplayPrimaryUsecase = "Productivity"
            break;
        case 0x05:
            this.DisplayPrimaryUsecase = "Gaming"
            break;
        case 0x06:
            this.DisplayPrimaryUsecase = "Presentation"
            break;
        case 0x07:
            this.DisplayPrimaryUsecase = "VirtualReality"
            break;
        case 0x08:
            this.DisplayPrimaryUsecase = "AugmentedReality"
            break;
    }
    this.NumberOfExtensions = bytes[3]
}

