/**
 * Validated Agent Wrapper
 *
 * Generic wrapper that:
 * 1. Calls an agent function
 * 2. Validates output against Zod schema
 * 3. Retries with error context if invalid (max retries configurable)
 * 4. Fails explicitly if still invalid (no silent fallbacks)
 *
 * Pattern: Pydantic AI's output validation with automatic retry
 * Source: https://deepwiki.com/pydantic/pydantic-ai/2.5-output-processing-and-validation
 */

import { z, ZodError, ZodSchema } from 'zod';
import { createMessage, MODELS } from './anthropic';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidatedAgentConfig<TOutput> {
  name: string;
  schema: ZodSchema<TOutput>;
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxRetries?: number;
}

export interface AgentCallResult<TOutput> {
  success: boolean;
  data?: TOutput;
  error?: string;
  attempts: number;
  validationErrors?: string[];
}

export interface RetryContext {
  attempt: number;
  previousOutput: string;
  validationErrors: string[];
}

// ============================================================================
// CORE WRAPPER
// ============================================================================

/**
 * Call an agent with schema validation and retry logic.
 *
 * @param config - Agent configuration including schema
 * @param userMessage - The user message to send
 * @param retryContext - Optional context from previous failed attempt
 */
export async function callValidatedAgent<TOutput>(
  config: ValidatedAgentConfig<TOutput>,
  userMessage: string,
  retryContext?: RetryContext
): Promise<AgentCallResult<TOutput>> {
  const maxRetries = config.maxRetries ?? 2;
  const attempt = retryContext?.attempt ?? 1;

  // Build prompt with retry context if this is a retry
  let enhancedPrompt = config.systemPrompt;
  let enhancedMessage = userMessage;

  if (retryContext) {
    enhancedPrompt += `

═══════════════════════════════════════════════════════════════════════════════
RETRY ATTEMPT ${attempt} — Your previous output had validation errors.
═══════════════════════════════════════════════════════════════════════════════

VALIDATION ERRORS:
${retryContext.validationErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

YOUR PREVIOUS OUTPUT:
${retryContext.previousOutput.slice(0, 1000)}${retryContext.previousOutput.length > 1000 ? '...' : ''}

FIX these errors in your new output. The schema MUST be satisfied.
═══════════════════════════════════════════════════════════════════════════════`;
  }

  // Add schema documentation to system prompt
  enhancedPrompt += `

OUTPUT SCHEMA (Zod):
You MUST output valid JSON that matches this schema exactly.
Do not include any text before or after the JSON.

${generateSchemaDocumentation(config.schema)}`;

  try {
    // Call the LLM
    const response = await createMessage(enhancedPrompt, enhancedMessage, {
      model: config.model ?? MODELS.ORCHESTRATOR,
      maxTokens: config.maxTokens ?? 2048,
      temperature: config.temperature ?? 0.5,
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const error = 'No JSON object found in response';

      if (attempt < maxRetries) {
        return callValidatedAgent(config, userMessage, {
          attempt: attempt + 1,
          previousOutput: response,
          validationErrors: [error],
        });
      }

      return {
        success: false,
        error,
        attempts: attempt,
        validationErrors: [error],
      };
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      const error = `JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`;

      if (attempt < maxRetries) {
        return callValidatedAgent(config, userMessage, {
          attempt: attempt + 1,
          previousOutput: response,
          validationErrors: [error],
        });
      }

      return {
        success: false,
        error,
        attempts: attempt,
        validationErrors: [error],
      };
    }

    // Validate against schema
    const validation = config.schema.safeParse(parsed);

    if (!validation.success) {
      const validationErrors = formatZodErrors(validation.error);

      if (attempt < maxRetries) {
        return callValidatedAgent(config, userMessage, {
          attempt: attempt + 1,
          previousOutput: JSON.stringify(parsed, null, 2),
          validationErrors,
        });
      }

      return {
        success: false,
        error: `Schema validation failed after ${attempt} attempts`,
        attempts: attempt,
        validationErrors,
      };
    }

    // Success!
    return {
      success: true,
      data: validation.data,
      attempts: attempt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
      attempts: attempt,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format Zod errors into readable strings.
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((e) => {
    const path = e.path.join('.');
    return `${path ? `[${path}] ` : ''}${e.message}`;
  });
}

/**
 * Generate human-readable schema documentation from Zod schema.
 */
function generateSchemaDocumentation(schema: ZodSchema): string {
  // Get the schema shape if it's an object
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const fields: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as ZodSchema;
      const description = getSchemaDescription(fieldSchema);
      const type = getSchemaType(fieldSchema);
      fields.push(`  "${key}": ${type}${description ? ` // ${description}` : ''}`);
    }

    return `{
${fields.join(',\n')}
}`;
  }

  return schema.description ?? 'See schema definition';
}

/**
 * Get type string from Zod schema.
 */
function getSchemaType(schema: ZodSchema): string {
  if (schema instanceof z.ZodString) return 'string';
  if (schema instanceof z.ZodNumber) return 'number';
  if (schema instanceof z.ZodBoolean) return 'boolean';
  if (schema instanceof z.ZodArray) return `array<${getSchemaType(schema.element)}>`;
  if (schema instanceof z.ZodEnum) return `enum(${schema.options.map((o: string) => `"${o}"`).join(' | ')})`;
  if (schema instanceof z.ZodUnion) return schema._def.options.map((o: ZodSchema) => getSchemaType(o)).join(' | ');
  if (schema instanceof z.ZodLiteral) return JSON.stringify(schema.value);
  if (schema instanceof z.ZodOptional) return `${getSchemaType(schema.unwrap())}?`;
  if (schema instanceof z.ZodObject) return 'object';
  return 'unknown';
}

/**
 * Get description from Zod schema if available.
 */
function getSchemaDescription(schema: ZodSchema): string | undefined {
  // Check for describe() method result
  if ('description' in schema && typeof schema.description === 'string') {
    return schema.description;
  }
  // Check _def for description
  if ('_def' in schema && schema._def && typeof schema._def === 'object' && 'description' in schema._def) {
    return schema._def.description as string;
  }
  return undefined;
}

// ============================================================================
// CONVENIENCE BUILDERS
// ============================================================================

/**
 * Create a validated agent function from config.
 */
export function createValidatedAgent<TInput, TOutput>(
  config: Omit<ValidatedAgentConfig<TOutput>, 'systemPrompt'> & {
    buildSystemPrompt: (input: TInput) => string;
    buildUserMessage: (input: TInput) => string;
  }
) {
  return async (input: TInput): Promise<AgentCallResult<TOutput>> => {
    return callValidatedAgent(
      {
        ...config,
        systemPrompt: config.buildSystemPrompt(input),
      },
      config.buildUserMessage(input)
    );
  };
}

/**
 * Unwrap a successful agent result or throw.
 */
export function unwrapAgentResult<T>(result: AgentCallResult<T>, agentName: string): T {
  if (!result.success || !result.data) {
    const errorDetails = result.validationErrors?.join(', ') ?? result.error ?? 'Unknown error';
    throw new Error(`[${agentName}] Failed after ${result.attempts} attempts: ${errorDetails}`);
  }
  return result.data;
}
