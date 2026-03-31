/**
 * Compress block state management for DCP.
 * Tracks compressed message ranges that can be decompressed/recompressed.
 */

export interface CompressionBlock {
  blockId: number;
  active: boolean;
  topic: string;
  /** Indices in the message array that this block covers */
  messageIndices: number[];
  /** The summary text that replaced these messages */
  summary: string;
  /** Approximate tokens saved by this compression */
  compressedTokens: number;
  /** Timestamp when compression was applied */
  createdAt: number;
  /** If deactivated, when and by which block */
  deactivatedAt?: number;
  deactivatedByBlockId?: number;
}

export interface CompressState {
  /** All blocks by ID */
  blocksById: Map<number, CompressionBlock>;
  /** Currently active block IDs */
  activeBlockIds: Set<number>;
  /** Next block ID to allocate */
  nextBlockId: number;
  /** Session stats */
  totalTokensSaved: number;
  totalBlocksCreated: number;
}

export function createCompressState(): CompressState {
  return {
    blocksById: new Map(),
    activeBlockIds: new Set(),
    nextBlockId: 1,
    totalTokensSaved: 0,
    totalBlocksCreated: 0,
  };
}

export function allocateBlockId(state: CompressState): number {
  const id = state.nextBlockId;
  state.nextBlockId = id + 1;
  return id;
}

/** Serializable form for session persistence */
export interface SerializedCompressState {
  blocks: Array<{
    blockId: number;
    active: boolean;
    topic: string;
    messageIndices: number[];
    summary: string;
    compressedTokens: number;
    createdAt: number;
    deactivatedAt?: number;
    deactivatedByBlockId?: number;
  }>;
  activeBlockIds: number[];
  nextBlockId: number;
  totalTokensSaved: number;
  totalBlocksCreated: number;
}

export const COMPRESS_STATE_ENTRY = "dcp:compress-state";

export function serializeCompressState(state: CompressState): SerializedCompressState {
  return {
    blocks: [...state.blocksById.values()],
    activeBlockIds: [...state.activeBlockIds],
    nextBlockId: state.nextBlockId,
    totalTokensSaved: state.totalTokensSaved,
    totalBlocksCreated: state.totalBlocksCreated,
  };
}

export function deserializeCompressState(data: SerializedCompressState | undefined): CompressState {
  const state = createCompressState();
  if (!data) return state;

  state.nextBlockId = data.nextBlockId ?? 1;
  state.totalTokensSaved = data.totalTokensSaved ?? 0;
  state.totalBlocksCreated = data.totalBlocksCreated ?? 0;

  if (Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      state.blocksById.set(block.blockId, block);
    }
  }
  if (Array.isArray(data.activeBlockIds)) {
    state.activeBlockIds = new Set(data.activeBlockIds);
  }

  return state;
}

/**
 * Estimate token count from character count (rough: 4 chars per token).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Wrap a summary in the standard DCP block format.
 */
export function wrapCompressedSummary(blockId: number, topic: string, summary: string): string {
  const header = `[DCP Compressed: ${topic} (block #${blockId})]`;
  const body = summary.trim();
  const footer = `[End of compressed block #${blockId}. Use /dcp decompress ${blockId} to restore.]`;
  return `${header}\n${body}\n${footer}`;
}

/**
 * Create a synthetic user message that replaces a compressed range.
 */
export function createCompressedUserMessage(
  blockId: number,
  topic: string,
  summary: string,
  timestamp: number,
): { role: "user"; content: string; timestamp: number } {
  return {
    role: "user",
    content: wrapCompressedSummary(blockId, topic, summary),
    timestamp,
  };
}
