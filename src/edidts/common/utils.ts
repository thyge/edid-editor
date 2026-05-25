export function formatByte(byte: number): string {
  const hex = (byte & 0xff).toString(16).toUpperCase();
  return hex.length === 1 ? "0" + hex : hex;
}
