/**
 * Byte-exact preservation of unedited structures.
 *
 * Several codecs model only part of what a real EDID carries: reserved bits,
 * vendor extensions, non-canonical padding and fields whose meaning the
 * library does not (yet) decode. Re-encoding such a structure from its model
 * silently drops whatever the model doesn't hold, so simply opening and saving
 * a file would change it.
 *
 * To prevent that, decoders remember the exact bytes each structure came from
 * (`rememberSource`), and encoders route through `encodePreservingSource`: if
 * the structure still decodes from its original bytes to the same model — the
 * user hasn't changed anything visible — the original bytes are written back
 * verbatim. Only structures the user actually edited are re-encoded.
 *
 * The bytes live under a non-enumerable symbol key, so they never appear in
 * `Object.keys`, spreads, JSON or test equality, and a spread copy of an edited
 * structure naturally falls back to a fresh encode.
 */

const SOURCE_BYTES = Symbol('edidts.sourceBytes');

/** Attach the bytes `target` was decoded from. Returns `target` for chaining. */
export function rememberSource<T extends object>(target: T, bytes: Uint8Array): T {
  Object.defineProperty(target, SOURCE_BYTES, {
    value: bytes.slice(),
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return target;
}

/** The bytes `target` was decoded from, if it was decoded (and not copied). */
export function sourceBytesOf(target: object): Uint8Array | undefined {
  const value = (target as Record<symbol, unknown>)[SOURCE_BYTES];
  return value instanceof Uint8Array ? value : undefined;
}

/**
 * True when `original` (a fresh decode of `target`'s source bytes) still
 * describes the same structure as `target`. A decoder that throws or returns
 * nothing counts as "changed".
 */
export function isUnchangedFromSource<T extends object>(
  target: T,
  decode: (bytes: Uint8Array) => unknown,
): boolean {
  const source = sourceBytesOf(target);
  if (!source) return false;
  let original: unknown;
  try {
    original = decode(source);
  } catch {
    return false;
  }
  return original != null && sameModel(original, target);
}

/**
 * Encode `target`, writing its original bytes back verbatim when it is
 * unchanged since decode (see {@link isUnchangedFromSource}); otherwise fall
 * back to `encode`.
 */
export function encodePreservingSource<T extends object>(
  target: T,
  decode: (bytes: Uint8Array) => unknown,
  encode: (target: T) => Uint8Array,
): Uint8Array {
  if (isUnchangedFromSource(target, decode)) {
    return sourceBytesOf(target)!.slice();
  }
  return encode(target);
}

/**
 * Structural equality over decoded models: primitives by `Object.is`, typed
 * arrays element-wise, arrays element-wise, and objects by their own
 * enumerable keys (prototype ignored, keys holding `undefined` treated as
 * absent — the encoders treat them the same). Works through Vue reactive
 * proxies, which forward key enumeration and property reads.
 */
export function sameModel(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  const aIsView = ArrayBuffer.isView(a);
  const bIsView = ArrayBuffer.isView(b);
  if (aIsView || bIsView) {
    if (!aIsView || !bIsView) return false;
    const x = a as unknown as ArrayLike<number>;
    const y = b as unknown as ArrayLike<number>;
    if (x.length !== y.length) return false;
    for (let i = 0; i < x.length; i++) {
      if (!Object.is(x[i], y[i])) return false;
    }
    return true;
  }

  const aIsArray = Array.isArray(a);
  if (aIsArray !== Array.isArray(b)) return false;
  if (aIsArray) {
    const x = a as unknown[];
    const y = b as unknown[];
    if (x.length !== y.length) return false;
    for (let i = 0; i < x.length; i++) {
      if (!sameModel(x[i], y[i])) return false;
    }
    return true;
  }

  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const xKeys = Object.keys(x).filter((k) => x[k] !== undefined);
  const yKeys = Object.keys(y).filter((k) => y[k] !== undefined);
  if (xKeys.length !== yKeys.length) return false;
  for (const key of xKeys) {
    if (!Object.prototype.hasOwnProperty.call(y, key) || !sameModel(x[key], y[key])) {
      return false;
    }
  }
  return true;
}
