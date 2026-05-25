export type DisplayPrimaryUsecase =
    | "ExtensionSection"
    | "TestStructure"
    | "Generic"
    | "Television"
    | "Productivity"
    | "Gaming"
    | "Presentation"
    | "VirtualReality"
    | "AugmentedReality";

export class DisplayID {
    raw: Uint8Array = new Uint8Array();
    Version: number = 0;
    Revision: number = 0;
    VariableDataBlockLength: number = 0;
    DisplayPrimaryUsecase?: DisplayPrimaryUsecase;
    NumberOfExtensions?: number;
    Extension: number = 0;

    DecodeDisplayID(bytes: Uint8Array): void {
        // DisplayID structure does not include header byte
        const data = bytes.slice(1);
        this.Version = data[0]! >> 4;
        this.Revision = data[0]! & 0xf;
        this.VariableDataBlockLength = data[1]!;
        switch (data[2]!) {
            case 0x00:
                this.DisplayPrimaryUsecase = "ExtensionSection";
                break;
            case 0x01:
                this.DisplayPrimaryUsecase = "TestStructure";
                break;
            case 0x02:
                this.DisplayPrimaryUsecase = "Generic";
                break;
            case 0x03:
                this.DisplayPrimaryUsecase = "Television";
                break;
            case 0x04:
                this.DisplayPrimaryUsecase = "Productivity";
                break;
            case 0x05:
                this.DisplayPrimaryUsecase = "Gaming";
                break;
            case 0x06:
                this.DisplayPrimaryUsecase = "Presentation";
                break;
            case 0x07:
                this.DisplayPrimaryUsecase = "VirtualReality";
                break;
            case 0x08:
                this.DisplayPrimaryUsecase = "AugmentedReality";
                break;
        }
        this.NumberOfExtensions = data[3]!;
    }
}