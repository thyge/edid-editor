export function calculateDisplayIdChecksum(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length - 1; i += 1) {
    sum += data[i];
  }

  return (256 - (sum % 256)) % 256;
}

export function isDisplayIdChecksumValid(data: Uint8Array): boolean {
  let sum = 0;
  for (const byte of data) {
    sum += byte;
  }

  return (sum & 0xff) === 0;
}
