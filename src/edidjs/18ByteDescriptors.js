export function DecodeDTD(edidBytes) {
    let d = new DisplayDescriptor()
    d.Type = "Detailed Timing Descriptor"
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
