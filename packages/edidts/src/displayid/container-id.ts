import {
  DisplayIdDataBlockTag,
  type DisplayIdContainerIdBlock,
  type DisplayIdDataBlock,
} from './types';

const CONTAINER_ID_PAYLOAD_LENGTH = 16;

export function isContainerIdPayloadLengthValid(length: number): boolean {
  return length === CONTAINER_ID_PAYLOAD_LENGTH;
}

export function decodeContainerIdBlock(block: DisplayIdDataBlock): DisplayIdContainerIdBlock {
  return {
    ...block,
    tag: DisplayIdDataBlockTag.ContainerId,
    containerId: block.payload.slice(),
  };
}

export function encodeContainerIdBlock(block: DisplayIdContainerIdBlock): Uint8Array {
  if (!isContainerIdPayloadLengthValid(block.containerId.length)) {
    throw new Error(`DisplayID ContainerID payload length ${block.containerId.length} is not 16 bytes`);
  }

  return block.containerId.slice();
}
