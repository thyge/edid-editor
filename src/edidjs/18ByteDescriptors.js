export function DecodeDTD(edidBytes, i) {
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