import Anthropic from '@anthropic-ai/sdk';

// Singleton client instance
let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Model configuration (verified Feb 2026)
// See: https://platform.claude.com/docs/en/about-claude/models/overview
// Format: claude-{tier}-{version}-{YYYYMMDD}
export const MODELS = {
  ORCHESTRATOR: 'claude-sonnet-4-5-20250929', // Sonnet 4.5 — agents/coding balance
  CONTEXT_GATHERER: 'claude-sonnet-4-5-20250929',
  LYRICS_AGENT: 'claude-sonnet-4-5-20250929',
  STYLE_AGENT: 'claude-haiku-4-5-20251001', // Haiku 4.5 — fast, style is simpler
} as const;

// Token limits
export const TOKEN_LIMITS = {
  MAX_INPUT: 100000,
  MAX_OUTPUT: 4096,
  CONTEXT_GATHERER_OUTPUT: 2048,
  LYRICS_OUTPUT: 2048,
  STYLE_OUTPUT: 512,
} as const;

// Helper to create message with defaults
export async function createMessage(
  systemPrompt: string,
  userMessage: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: options.model ?? MODELS.ORCHESTRATOR,
    max_tokens: options.maxTokens ?? TOKEN_LIMITS.MAX_OUTPUT,
    temperature: options.temperature ?? 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

// Streaming helper
export async function* streamMessage(
  systemPrompt: string,
  userMessage: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): AsyncGenerator<string, void, unknown> {
  const anthropic = getAnthropicClient();

  const stream = anthropic.messages.stream({
    model: options.model ?? MODELS.ORCHESTRATOR,
    max_tokens: options.maxTokens ?? TOKEN_LIMITS.MAX_OUTPUT,
    temperature: options.temperature ?? 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
