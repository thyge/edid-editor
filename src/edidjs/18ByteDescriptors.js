export class DetailedTimingDescriptor {
    raw = Uint8Array
    // Stored Value = Pixel clock ÷ 10,000
    // Range: 10 kHz to 655.35 MHz in 10 kHz steps
    Type = "Detailed Timing Descriptor"
    PixelClockKHz = 0
    HorizontalActive
    HorizontalBlanking
    HorizontalFrontPorch
    HorizontalSyncPulseWidth
    VerticalActive
    VerticalBlanking
    VerticalFrontPorch
    VerticalSyncPulseWidth

    HorizontalImageSize
	VerticalImageSize

    HorizontalBorder
	VerticalBorder

    Interlaced = false
    StereoMode
    Digital
    SyncMode = {

    }
}

DetailedTimingDescriptor.prototype.Encode = function() {
    // Reset the raw array
    for (let i = 0; i < this.raw.length; i++) {
        this.raw[i] = 0
    }
    // Input the data
    this.raw[0] = (this.PixelClockKHz/10000) & 0xFF
    this.raw[1] = (this.PixelClockKHz/10000) >> 8

    this.raw[2] = this.HorizontalActive & 0xFF
    this.raw[3] = this.HorizontalBlanking & 0xFF
    this.raw[4] |= (this.HorizontalActive&0xF00)>>4
    this.raw[4] |= (this.HorizontalBlanking&0xF00)>>8

    this.raw[5] = this.VerticalActive & 0xFF
    this.raw[6] = this.VerticalBlanking & 0xFF
    this.raw[7] |= (this.VerticalActive&0xF00)>>4
    this.raw[7] |= (this.VerticalBlanking&0xF00)>>8
    
    this.raw[8] = this.HorizontalFrontPorch & 0xFF
    this.raw[11] |= (this.HorizontalFrontPorch & 0x300)>>2

    this.raw[9] = this.HorizontalSyncPulseWidth & 0xFF
    this.raw[11] |= (this.HorizontalSyncPulseWidth & 0x300)>>4
    
    this.raw[10] |= (this.VerticalFrontPorch&0xF)<<4
    this.raw[11] |= (this.VerticalFrontPorch & 0x30)>>2

    this.raw[10] |= (this.VerticalSyncPulseWidth&0xF)
    this.raw[11] |= (this.VerticalSyncPulseWidth & 0x30)>>4
    
    this.raw[12] = this.HorizontalImageSize&0xFF
    this.raw[13] = this.VerticalImageSize&0xFF

    this.raw[14] |= (this.HorizontalImageSize&0xF00)>>4
    this.raw[14] |= (this.VerticalImageSize&0xF00)>>8

    this.raw[15] = this.HorizontalBorder
	this.raw[16] = this.VerticalBorder

    this.raw[17] |= this.Interlaced?0x80:0

    switch (this.StereoMode) {
        case "No Stereo":
            this.raw[17] |= 0
            break;
        case "Field sequential, right image on sync signal":
            this.raw[17] |= 0x20
            break;
        case "Field sequential, left image on sync signal":
            this.raw[17] |= 0x40
            break;
        case "2-way interleaved, right image on even lines":
            this.raw[17] |= 0x21
            break;
        case "2-way interleaved, left image on even lines":
            this.raw[17] |= 0x41
            break;
        case "4-way interleaved":
            this.raw[17] |= 0x60
            break;
        case "side-by-side interleaved":
            this.raw[17] |= 0x61
            break;
    }
    this.raw[17] |= this.Interlaced?0x80:0
    this.raw[17] |= this.Digital?0x10:0
    if (this.Sync === "Separate") {
        this.raw[17] |= 0x8
        this.raw[17] |= (this.VerticalSyncPolarity === "Positive")?0x4:0
        this.raw[17] |= (this.HorizontalSyncPolarity === "Positive")?0x2:0
    } else {
        this.raw[17] |= this.Serrations?0x4:0
    }
}

export function DecodeDTD(edidBytes) {
    let d = new DetailedTimingDescriptor()
    d.raw = edidBytes
    d.PixelClockKHz = (edidBytes[1] << 8 | edidBytes[0])*10000
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
            d.StereoMode = "No Stereo"
            break;
        case 1:
            if (edidBytes[17] & 0x1) {
                d.StereoMode = "2-way interleaved, right image on even lines"
            } else {
                d.StereoMode = "Field sequential, right image on sync signal"
            }
            break;
        case 2:
            if (edidBytes[17] & 0x1) {
                d.StereoMode = "2-way interleaved, left image on even lines"
            } else {
                d.StereoMode = "Field sequential, left image on sync signal"
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
    if ((edidBytes[17]&0x10)>0) {
        // Digital
        d.Digital = true
        if ((edidBytes[17] & 0x8)>0) {
            // Digital Separate Sync:
            d.Sync = "Separate"
            d.VerticalSyncPolarity = (edidBytes[17] & 0x4)>0?"Positive":"Negative"
            d.HorizontalSyncPolarity = (edidBytes[17] & 0x2)>0?"Positive":"Negative"
        } else {
            // Digital Composite Sync:
            d.SyncMode = "Composite"
            d.SyncMode.Serrations = (edidBytes[17] & 0x4)>0?true:false
        }
    } else {
        // Analog
        d.Digital = false
        d.SyncMode.BipolarCompositeSync = (edidBytes[17]&0x8)>0?true:false
        d.SyncMode.Serrations = (edidBytes[17]&0x4)>0?true:false
        d.SyncMode.SyncOn = (edidBytes[17]&0x2)>0?"Green Signal only":"all three (RGB) video signals"
    }

    // Supplemental information
    d.horTotPix = d.HorizontalActive + d.HorizontalBlanking
	d.verTotPix = d.VerticalActive + d.VerticalBlanking
	d.VerticalRefreshRate = (d.PixelClockKHz*1000) / (d.horTotPix * d.verTotPix)
    return d
}

const DD_SerialNumber = 0xFF
const DD_UnspecifiedText = 0xFE
const DD_DisplayRangeLimits = 0xFD
const DD_DisplayProductName = 0xFC
const DD_ColorPointData = 0xFB
const DD_StandardTimingDefinitions = 0xFA
const DD_DCM = 0xF9
const DD_CVT3_ByteCodes = 0xF8
const DD_EstablishedTimingsIII = 0xF8
const DD_DummyIdentifier = 0x10

class DisplayDescriptor {
    raw = []
    Type
    Content = ""
}

DisplayDescriptor.prototype.Encode = function() {
    // console.log("Encoding... current raw:")
    // console.log(this.raw);
}

export function MakeDummyDescriptor() {
    let dummyBytes = new Uint8Array(18)
    dummyBytes[3] = DD_DummyIdentifier
    return DecodeDisplayDescriptor(dummyBytes, 0)
}

export function DecodeDisplayDescriptor(descriptorBytes) {
    // Type is decalred with strings so
    //the frontend does not have to import this file for const declarations
    let dd = new DisplayDescriptor()
    dd.raw = descriptorBytes;
    switch (descriptorBytes[3]) {
        case DD_SerialNumber:
            // Display serial number (ASCII text)
            dd.Type = "Display serial number (ASCII text)"
            // This field takes presidence over [12:15]
            for (let d = 5; d < 19; d++) {
                dd.Content += String.fromCharCode(descriptorBytes[d])
            }
            break;
        case DD_UnspecifiedText:
            dd.Type = "Unspecified text (ASCII text)"
            // Unspecified text (ASCII text)
            for (let d = 5; d < 19; d++) {
                dd.Content += String.fromCharCode(descriptorBytes[d])
            }
            break;
        case DD_DisplayRangeLimits:
            // Display Range Limits:
            dd.Type = "Display Range Limits";
            // Includes optional timing information --- GTF using default parameters, GTF Secondary Curve or CVT Descriptor.
            // The Display Range Limits Descriptor will include one of the following sets of information:
            // 1. Range Limits Only --- no additional timing information provided (defined in table 3.26) - Default GTF, GTF Secondary Curve and CVT are not supported or
            // 2. Range Limits provided & Default GTF is supported - no additional timing information provided (defined in Table 3.26) or
            // 3. Range Limits provided & GTF Secondary Curve Timing Formula is supported – Secondary GTF Curve Data (defined in Table 3.27) or
            // 4. Range Limits provided & CVT Timing Formula is supported – Coordinated Video Timing Data (defined in Table 3.28).
            var DisplayRangeLimits = DecodeRangeLimits(descriptorBytes)
            dd.Content = DisplayRangeLimits;
            break;
        case DD_DisplayProductName:
            // Display Product Name
            dd.Type = "Display Product Name";
            for (let d = 5; d < 19; d++) {
                dd.Content += String.fromCharCode(descriptorBytes[d])
            }
            break;
        case DD_ColorPointData:
            // Color Point Data:
            dd.Type = "Color Point Data";
            dd.Content = "Decode not supported yet"
            break;
        case DD_StandardTimingDefinitions:
            // Standard Timing Definitions
            dd.Type = "Standard Timing Definitions";
            dd.Content = "Decode not supported yet"
            break;
        case DD_DCM:
            // Display Color Management (DCM)
            dd.Type = "Display Color Management (DCM)";
            dd.Content = "Decode not supported yet"
            break;
        case DD_CVT3_ByteCodes:
            // CVT 3-Byte Timing Codes
            dd.Type = "CVT 3-Byte Timing Codes";
            dd.Content = "Decode not supported yet"
            break;
        case DD_EstablishedTimingsIII:
            // Established Timings 3
            dd.Type = "Established Timings III";
            dd.Content = "Decode not supported yet"
            break;
        case DD_DummyIdentifier:
            // Dummy identifier.
            dd.Type = "Dummy Identifier";
            break;
        default:
            return null
    }
    return dd;
}


export function DecodeRangeLimits(bytes) {
    var drld = new DisplayDescriptor()
    drld.MinVerticalRateOffset = bytes[4]&0x01?true:false
    drld.MaxVerticalRateOffset = bytes[4]&0x02?true:false
    drld.MinHorizontalRateOffset = bytes[4]&0x04?true:false
    drld.MaxHorizontalRateOffset = bytes[4]&0x08?true:false
	// Vertical Minimum
	if (drld.MinVerticalRateOffset && drld.MaxVerticalRateOffset) {
		drld.MinimumVerticalRate = bytes[5] + 256
	} else {
		drld.MinimumVerticalRate = bytes[5] + 1
	}
	// Vertical Maximum
	if (drld.MaxVerticalRateOffset) {
		drld.MaximumVerticalRate = bytes[6] + 256
	} else {
		drld.MaximumVerticalRate = bytes[6] + 1
	}
	// Horizontal Minimum
	if (drld.MinHorizontalRateOffset && drld.MaxHorizontalRateOffset) {
		drld.MinimumHorizontalRate = bytes[7] + 256
	} else {
        drld.MinimumHorizontalRate = bytes[7] + 1
	}
	// Horizontal Maximum
	if (drld.MaxHorizontalRateOffset) {
		drld.MaximumHorizontalRate = bytes[8] + 256
	} else {
        drld.MaximumHorizontalRate = bytes[8] + 1
	}
	// Maximum Pixel Clock
	drld.MaximumPixelClock = bytes[9] * 10

    // Video Timing Support Flags: Bytes 10 → 17 indicate support for additional video timings.
    drld.DefaultGTF = (bytes[10]&0x7 === 0)?true:false
    drld.RangeLimitsOnly = (bytes[10]&0x7 === 1)?true:false
    drld.SecondaryGTF = (bytes[10]&0x7 === 2)?true:false
    drld.CVTSupported = (bytes[10]&0x7 === 4)?true:false
	
	if (drld.SecondaryGTF || drld.CVTSupported) {
        drld.VideoTimingData = "Decode not supported"
    }
	return drld
}