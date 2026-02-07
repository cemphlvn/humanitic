import { z } from "zod";

// ─── Age Groups ───
export const AgeGroupSchema = z.enum(["K-6", "7-12", "13-18", "18-24"]);
export type AgeGroup = z.infer<typeof AgeGroupSchema>;

// ─── Prompt Types ───
export const PromptTypeSchema = z.enum(["lyrics", "style", "both"]);
export type PromptType = z.infer<typeof PromptTypeSchema>;

// ─── Learning Approaches ───
export const LearningApproachSchema = z.enum(["memorization", "six-layer-andragogy"]);
export type LearningApproach = z.infer<typeof LearningApproachSchema>;

// ─── Thought Pipelines ───
export const ThoughtPipelineSchema = z.enum([
  "wonder-question-discovery",
  "pattern-rhythm-recall",
  "story-character-lesson",
  "connect-layer-integrate",
  "play-explore-build",
]);
export type ThoughtPipeline = z.infer<typeof ThoughtPipelineSchema>;

// ─── Logic Sticks ───
export const LogicStickSchema = z.enum([
  "ladder",
  "mirror",
  "zoom",
  "anchor",
  "rhythm-lock",
  "web",
]);
export type LogicStick = z.infer<typeof LogicStickSchema>;

// ─── Curiosity Techniques ───
export const CuriosityTechniqueSchema = z.enum([
  "impossible-fact",
  "unanswered-question",
  "personal-stake",
  "pattern-reveal",
  "wrong-answer",
  "tiny-giant",
  "time-machine",
]);
export type CuriosityTechnique = z.infer<typeof CuriosityTechniqueSchema>;

// ─── Memorization Techniques ───
export const MemorizationTechniqueSchema = z.enum([
  "acronym-songs",
  "rhyme-chains",
  "counting-songs",
  "body-mapping",
  "story-mnemonics",
  "call-and-response",
]);
export type MemorizationTechnique = z.infer<typeof MemorizationTechniqueSchema>;

// ─── Suno Style Components ───
export const SunoGenreSchema = z.string().min(1).describe("Primary music genre");
export const SunoMoodSchema = z.array(z.string()).min(1).describe("Mood descriptors");
export const SunoTempoSchema = z.number().min(60).max(200).describe("BPM");
export const SunoKeySchema = z.string().describe("Musical key signature");

export const SunoStyleSchema = z.object({
  genre: SunoGenreSchema,
  subGenre: z.string().optional(),
  moods: SunoMoodSchema,
  tempo: SunoTempoSchema,
  key: SunoKeySchema,
  instruments: z.array(z.string()),
  vocalGender: z.enum(["male", "female", "both", "none"]),
  vocalStyle: z.string().optional(),
  vocalRange: z.string().optional(),
  production: z.array(z.string()),
  excludeStyles: z.array(z.string()).optional(),
});
export type SunoStyle = z.infer<typeof SunoStyleSchema>;

// ─── Prompt Request (User Input) ───
export const PromptRequestSchema = z.object({
  subject: z.string().min(1).max(200),
  ageGroup: AgeGroupSchema,
  promptType: PromptTypeSchema,
  learningApproach: LearningApproachSchema,
  additionalContext: z.string().max(500).optional(),
});
export type PromptRequest = z.infer<typeof PromptRequestSchema>;

// ─── CSA Strategy Output ───
export const CSAStrategySchema = z.object({
  pipeline: ThoughtPipelineSchema,
  logicStick: LogicStickSchema,
  curiosityTechniques: z.array(CuriosityTechniqueSchema).min(1).max(2),
  memorizationTechnique: MemorizationTechniqueSchema.optional(),
  emotionalArc: z.string(),
  reasoning: z.string(),
  approved: z.boolean(),
  redirectReason: z.string().optional(),
  styleRecommendation: z.object({
    genre: z.string(),
    mood: z.string(),
    tempoRange: z.string(),
    vocalSuggestion: z.string(),
  }),
});
export type CSAStrategy = z.infer<typeof CSAStrategySchema>;

// ─── Lyrics Output ───
export const LyricsOutputSchema = z.object({
  lyrics: z.string(),
  sections: z.array(
    z.object({
      tag: z.string(),
      content: z.string(),
    })
  ),
  characterCount: z.number(),
  curiosityHook: z.string(),
});
export type LyricsOutput = z.infer<typeof LyricsOutputSchema>;

// ─── Style Output ───
export const StyleOutputSchema = z.object({
  styleString: z.string().max(1000),
  components: SunoStyleSchema,
  characterCount: z.number(),
});
export type StyleOutput = z.infer<typeof StyleOutputSchema>;

// ─── Full Generation Result ───
export const GenerationResultSchema = z.object({
  request: PromptRequestSchema,
  strategy: CSAStrategySchema,
  lyrics: LyricsOutputSchema.optional(),
  style: StyleOutputSchema.optional(),
  sessionId: z.string(),
  timestamp: z.string(),
});
export type GenerationResult = z.infer<typeof GenerationResultSchema>;

// ─── Pipeline State ───
export const PipelineStageSchema = z.enum([
  "idle",
  "input-received",
  "csa-thinking",
  "csa-approved",
  "lyrics-generating",
  "style-generating",
  "memory-storing",
  "complete",
  "error",
]);
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const PipelineStateSchema = z.object({
  stage: PipelineStageSchema,
  progress: z.number().min(0).max(100),
  message: z.string().optional(),
  error: z.string().optional(),
});
export type PipelineState = z.infer<typeof PipelineStateSchema>;

// ─── Memory Entry ───
export const MemoryEntrySchema = z.object({
  sessionId: z.string(),
  subject: z.string(),
  ageGroup: AgeGroupSchema,
  approach: LearningApproachSchema,
  pipeline: ThoughtPipelineSchema,
  logicStick: LogicStickSchema,
  curiosityTechniques: z.array(CuriosityTechniqueSchema),
  generatedLyrics: z.string().optional(),
  generatedStyle: z.string().optional(),
  timestamp: z.string(),
  topicConnections: z.array(z.string()),
});
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

// ─── Style Builder (Frontend) ───
export const StyleBuilderStateSchema = z.object({
  genre: z.string(),
  subGenre: z.string(),
  moods: z.array(z.string()),
  tempo: z.number(),
  key: z.string(),
  energy: z.enum(["low", "medium", "high"]),
  instruments: z.array(z.string()),
  vocalGender: z.enum(["male", "female", "both", "none"]),
  vocalStyle: z.string(),
  vocalRange: z.string(),
  production: z.array(z.string()),
});
export type StyleBuilderState = z.infer<typeof StyleBuilderStateSchema>;
