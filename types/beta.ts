import type {
  BetaMessageParam as AnthropicMessageParam,
  BetaMessage as AnthropicMessage,
  BetaContentBlock as AnthropicContentBlock,
  BetaTool,
  BetaToolComputerUse20241022,
  BetaToolComputerUse20250124,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { ActionParams } from "../tools/types/computer";

// Re-export the SDK types
export type BetaMessageParam = AnthropicMessageParam;
export type BetaMessage = AnthropicMessage;
export type BetaContentBlock = AnthropicContentBlock;
export type {
  BetaTool,
  BetaToolComputerUse20241022,
  BetaToolComputerUse20250124,
};

// Keep our local types for internal use
export interface BetaTextBlock {
  type: "text";
  text: string;
  id?: string;
  cache_control?: { type: "ephemeral" };
}

export interface BetaImageBlock {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png";
    data: string;
  };
  id?: string;
  cache_control?: { type: "ephemeral" };
}

export interface BetaToolUseBlock {
  type: "tool_use";
  name: string;
  input: ActionParams;
  id?: string;
  cache_control?: { type: "ephemeral" };
}

export interface BetaThinkingBlock {
  type: "thinking";
  thinking:
    | {
        type: "enabled";
        budget_tokens: number;
      }
    | {
        type: "disabled";
      };
  signature?: string;
  id?: string;
  cache_control?: { type: "ephemeral" };
}

export interface BetaToolResultBlock {
  type: "tool_result";
  content: (BetaTextBlock | BetaImageBlock)[] | string;
  tool_use_id: string;
  is_error: boolean;
  id?: string;
  cache_control?: { type: "ephemeral" };
}

export type BetaLocalContentBlock =
  | BetaTextBlock
  | BetaImageBlock
  | BetaToolUseBlock
  | BetaThinkingBlock
  | BetaToolResultBlock;
