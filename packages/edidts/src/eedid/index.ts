export { EEDID } from './eedid';
export {
  decodeExtension,
  encodeExtension,
  isCEAExtension,
  isDisplayIdExtension,
  isOpaqueExtension,
  decodeCtaExtensionBlock,
  getCEAExtension,
  getDisplayIdExtension,
} from './extension';
export type {
  Extension,
  CEAExtension,
  DisplayIdExtension,
  OpaqueExtension,
  ExtensionDispatch,
} from './extension';
