export function checksum8(data: Uint8Array, checksumIndex = data.length - 1): number {
  let sum = 0;

  for (let i = 0; i < data.length; i += 1) {
    if (i !== checksumIndex) {
      sum += data[i];
    }
  }

  return (256 - (sum % 256)) % 256;
}

export function isChecksum8Valid(data: Uint8Array): boolean {
  let sum = 0;

  for (const byte of data) {
    sum += byte;
  }

  return (sum & 0xff) === 0;
}
