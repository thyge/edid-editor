export class DisplayID {
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