import type {
  BetaMessage,
  BetaMessageParam,
  BetaToolResultBlock,
  BetaContentBlock,
  BetaLocalContentBlock,
} from "../types/beta";

export function responseToParams(response: BetaMessage): BetaContentBlock[] {
  return response.content.map((block) => {
    if (block.type === "text" && block.text) {
      return {
        type: "text",
        text: block.text,
        citations: block.citations || null,
      };
    }
    if (block.type === "thinking") {
      return {
        type: "thinking" as const,
        thinking: block.thinking,
        signature: block.signature,
      };
    }
    if (block.type === "redacted_thinking") {
      return {
        type: "redacted_thinking" as const,
        data: block.data,
      };
    }
    return block as BetaContentBlock;
  });
}

export function maybeFilterToNMostRecentImages(
  messages: BetaMessageParam[],
  imagesToKeep: number,
  minRemovalThreshold: number,
): void {
  if (!imagesToKeep) return;

  const toolResultBlocks = messages
    .flatMap((message) =>
      Array.isArray(message?.content) ? message.content : [],
    )
    .filter(
      (item): item is BetaToolResultBlock =>
        typeof item === "object" && item.type === "tool_result",
    );

  const totalImages = toolResultBlocks.reduce((count, toolResult) => {
    if (!Array.isArray(toolResult.content)) return count;
    return (
      count +
      toolResult.content.filter(
        (content) => typeof content === "object" && content.type === "image",
      ).length
    );
  }, 0);

  let imagesToRemove =
    Math.floor((totalImages - imagesToKeep) / minRemovalThreshold) *
    minRemovalThreshold;

  for (const toolResult of toolResultBlocks) {
    if (Array.isArray(toolResult.content)) {
      toolResult.content = toolResult.content.filter((content) => {
        if (typeof content === "object" && content.type === "image") {
          if (imagesToRemove > 0) {
            imagesToRemove--;
            return false;
          }
        }
        return true;
      });
    }
  }
}

const PROMPT_CACHING_BETA_FLAG = "prompt-caching-2024-07-31";

export function injectPromptCaching(messages: BetaMessageParam[]): void {
  let breakpointsRemaining = 3;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message) continue;
    if (message.role === "user" && Array.isArray(message.content)) {
      if (breakpointsRemaining > 0) {
        breakpointsRemaining--;
        const lastContent = message.content[message.content.length - 1];
        if (lastContent) {
          (lastContent as BetaLocalContentBlock).cache_control = {
            type: "ephemeral",
          };
        }
      } else {
        const lastContent = message.content[message.content.length - 1];
        if (lastContent) {
          delete (lastContent as BetaLocalContentBlock).cache_control;
        }
        break;
      }
    }
  }
}

export { PROMPT_CACHING_BETA_FLAG };

/**
 * Truncate message history to keep only the most recent messages
 * This helps prevent context overflow in long-running tasks
 * Preserves thinking blocks structure for extended thinking compatibility
 *
 * @param messages - Array of conversation messages
 * @param maxMessages - Maximum number of messages to keep (default: 20)
 * @param preserveSystemMessage - Whether to always preserve the first user message (default: true)
 */
export function truncateMessageHistory(
  messages: BetaMessageParam[],
  maxMessages: number = 20,
  preserveSystemMessage: boolean = true,
): void {
  if (messages.length <= maxMessages) return;

  const messagesToRemove = messages.length - maxMessages;

  if (preserveSystemMessage && messages.length > 0) {
    // Keep the first user message (usually the initial task description)
    const firstUserMessage = messages.find((msg) => msg.role === "user");
    if (firstUserMessage) {
      const firstUserIndex = messages.indexOf(firstUserMessage);
      // Remove messages from the middle, keeping the first user message and the most recent ones
      const keepFromIndex = Math.max(firstUserIndex + 1, messagesToRemove);
      messages.splice(1, keepFromIndex - 1);
    } else {
      // No user message found, just remove from the beginning
      messages.splice(0, messagesToRemove);
    }
  } else {
    // Remove from the beginning
    messages.splice(0, messagesToRemove);
  }

  // After truncation, ensure assistant messages with thinking blocks maintain proper structure
  for (const message of messages) {
    if (message.role === "assistant" && Array.isArray(message.content)) {
      const thinkingBlocks = message.content.filter(
        (block) =>
          typeof block === "object" &&
          (block.type === "thinking" || block.type === "redacted_thinking"),
      );
      const textBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "text",
      );
      const toolUseBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "tool_use",
      );
      const toolResultBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "tool_result",
      );

      // Reconstruct with proper order: thinking -> text -> tool_use -> tool_result
      message.content = [
        ...thinkingBlocks,
        ...textBlocks,
        ...toolUseBlocks,
        ...toolResultBlocks,
      ];
    }
  }
}

/**
 * Clean message history to ensure tool_use and tool_result blocks are properly paired
 * and preserve thinking blocks for extended thinking compatibility
 * This prevents the "unexpected tool_use_id found in tool_result blocks" error
 *
 * IMPORTANT: The API requires that each tool_result must have its corresponding tool_use
 * in the IMMEDIATELY PREVIOUS message, not just anywhere in history.
 *
 * @param messages - Array of conversation messages
 */
export function cleanMessageHistory(messages: BetaMessageParam[]): void {
  // Process messages in order to maintain tool_use/tool_result pairing
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (!message || !Array.isArray(message.content)) continue;

    // For user messages with tool_result blocks, verify the previous message has matching tool_use
    if (message.role === "user") {
      const prevMessage = i > 0 ? messages[i - 1] : null;
      const prevToolUseIds = new Set<string>();

      // Collect tool_use IDs from the immediately previous message
      if (prevMessage?.role === "assistant" && Array.isArray(prevMessage.content)) {
        for (const block of prevMessage.content) {
          if (
            typeof block === "object" &&
            block.type === "tool_use" &&
            block.id
          ) {
            prevToolUseIds.add(block.id);
          }
        }
      }

      // Filter out tool_result blocks that don't have a corresponding tool_use in the previous message
      message.content = message.content.filter((block) => {
        if (
          typeof block === "object" &&
          block.type === "tool_result" &&
          block.tool_use_id
        ) {
          return prevToolUseIds.has(block.tool_use_id);
        }
        return true;
      });
    }

    // Ensure proper ordering for assistant messages:
    // 1. thinking/redacted_thinking blocks first
    // 2. text blocks
    // 3. tool_use blocks
    // Note: tool_result blocks should never be in assistant messages
    if (message.role === "assistant") {
      const thinkingBlocks = message.content.filter(
        (block) =>
          typeof block === "object" &&
          (block.type === "thinking" || block.type === "redacted_thinking"),
      );
      const textBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "text",
      );
      const toolUseBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "tool_use",
      );

      // Reconstruct with proper order
      message.content = [
        ...thinkingBlocks,
        ...textBlocks,
        ...toolUseBlocks,
      ];
    }
  }
}

/**
 * Ensure all assistant messages start with thinking blocks when extended thinking is enabled
 * This prevents the 400 error: "Expected `thinking` or `redacted_thinking`, but found `text`"
 * 
 * When thinking is enabled, the API requires that every assistant message must start with
 * a thinking or redacted_thinking block. This function filters out any assistant messages
 * that don't meet this requirement.
 *
 * Additionally, when removing assistant messages, we also need to remove the corresponding
 * user message that follows (if any) to maintain proper conversation flow.
 *
 * @param messages - Array of conversation messages
 * @param thinkingEnabled - Whether extended thinking is enabled
 */
export function ensureThinkingBlocksForExtendedThinking(
  messages: BetaMessageParam[],
  thinkingEnabled: boolean,
): void {
  if (!thinkingEnabled) {
    return;
  }

  // Filter out assistant messages that don't start with a thinking block
  // Also remove the following user message to maintain conversation flow
  const indicesToRemove: number[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message?.role === "assistant" && Array.isArray(message.content)) {
      const firstBlock = message.content[0];
      const hasThinkingBlock = 
        firstBlock &&
        typeof firstBlock === "object" &&
        (firstBlock.type === "thinking" || firstBlock.type === "redacted_thinking");
      
      if (!hasThinkingBlock) {
        indicesToRemove.push(i);
        
        // Also mark the following user message for removal (if it exists)
        // This maintains proper conversation flow (user -> assistant -> user -> assistant)
        if (i + 1 < messages.length && messages[i + 1]?.role === "user") {
          indicesToRemove.push(i + 1);
        }
      }
    }
  }

  // Remove messages in reverse order to maintain correct indices
  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    const index = indicesToRemove[i];
    if (index !== undefined) {
      messages.splice(index, 1);
    }
  }
}
