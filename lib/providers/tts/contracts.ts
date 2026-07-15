import { z } from "zod";

export const ttsLanguageSchema = z.enum(["en-US", "en-GB", "tr-TR"]);
export const ttsSpeedSchema = z.union([
  z.literal(0.75),
  z.literal(1),
  z.literal(1.25),
]);

export const ttsRequestSchema = z.object({
  text: z.string().trim().min(1).max(1_500),
  language: ttsLanguageSchema,
  voice: z.string().trim().min(1).max(100).optional(),
  speed: ttsSpeedSchema.default(1),
});

export type TTSLanguage = z.infer<typeof ttsLanguageSchema>;
export type TTSSpeed = z.infer<typeof ttsSpeedSchema>;
export type TTSRequest = z.infer<typeof ttsRequestSchema>;

export type TTSAudioResult = {
  mode: "audio";
  audio: ArrayBuffer;
  mimeType: string;
  provider: string;
};

export type TTSBrowserFallback = {
  mode: "browser";
  fallback: true;
  text: string;
  language: TTSLanguage;
  voice?: string;
  speed: TTSSpeed;
  message: string;
};

export type TTSSynthesisResult = TTSAudioResult | TTSBrowserFallback;

export interface TTSProvider {
  readonly id: string;
  readonly kind: "mock" | "provider";
  synthesize(input: TTSRequest): Promise<TTSSynthesisResult>;
}

export type TTSRunResult = {
  data: TTSSynthesisResult;
  source: "mock" | "provider";
  fallback?: boolean;
  cache: "hit" | "miss" | "bypass";
};
