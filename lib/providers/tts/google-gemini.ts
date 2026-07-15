import "server-only";

import { Buffer } from "node:buffer";
import { z } from "zod";

import { readJsonWithLimit } from "../http-response";
import type {
  TTSAudioResult,
  TTSLanguage,
  TTSProvider,
  TTSRequest,
} from "./contracts";
import { wrapPcm16AsWav } from "./wav";

type VoiceConfiguration = Record<TTSLanguage, string>;

type GoogleGeminiTTSOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
  voices: VoiceConfiguration;
  timeoutMs?: number;
};

const MAX_PCM_BYTES = 15 * 1024 * 1024;
const MAX_JSON_BYTES = 22 * 1024 * 1024;

const responseSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({
            content: z
              .object({
                parts: z.array(
                  z
                    .object({
                      inlineData: z
                        .object({
                          data: z.string().min(1),
                          mimeType: z.string().optional(),
                        })
                        .passthrough()
                        .optional(),
                    })
                    .passthrough(),
                ),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

function generateContentEndpoint(baseUrl: string, model: string): string {
  let normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith(":generateContent")) return normalized;
  if (normalized.endsWith("/openai")) {
    normalized = normalized.slice(0, -"/openai".length);
  }
  const modelName = model.replace(/^models\//, "");
  return `${normalized}/models/${encodeURIComponent(modelName)}:generateContent`;
}

function decodePcmBase64(value: string): Uint8Array {
  const normalized = value.replace(/\s+/g, "");
  const maximumBase64Length = Math.ceil(MAX_PCM_BYTES / 3) * 4;
  if (
    normalized.length === 0 ||
    normalized.length > maximumBase64Length ||
    normalized.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)
  ) {
    throw new Error("Gemini returned invalid base64 audio.");
  }

  const decoded = Buffer.from(normalized, "base64");
  const canonical = decoded.toString("base64").replace(/=+$/, "");
  if (
    decoded.byteLength === 0 ||
    decoded.byteLength > MAX_PCM_BYTES ||
    canonical !== normalized.replace(/=+$/, "")
  ) {
    throw new Error("Gemini returned invalid PCM audio.");
  }

  return new Uint8Array(decoded.buffer, decoded.byteOffset, decoded.byteLength);
}

export class GoogleGeminiTTSProvider implements TTSProvider {
  readonly id = "google-gemini-tts";
  readonly kind = "provider" as const;

  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly voices: VoiceConfiguration;
  private readonly timeoutMs: number;

  constructor(options: GoogleGeminiTTSOptions) {
    if (!options.apiKey.trim() || !options.model.trim()) {
      throw new Error("Gemini speech configuration is incomplete.");
    }

    const endpoint = generateContentEndpoint(options.baseUrl, options.model);
    const protocol = new URL(endpoint).protocol;
    if (protocol !== "https:" && protocol !== "http:") {
      throw new Error("Gemini speech URL must use HTTP or HTTPS.");
    }

    this.apiKey = options.apiKey;
    this.endpoint = endpoint;
    this.voices = options.voices;
    this.timeoutMs = Math.max(2_000, Math.min(options.timeoutMs ?? 20_000, 60_000));
  }

  async synthesize(input: TTSRequest): Promise<TTSAudioResult> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: input.text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: input.voice ?? this.voices[input.language],
              },
            },
          },
        },
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Gemini speech request failed with status ${response.status}.`);
    }

    const payload = responseSchema.parse(
      await readJsonWithLimit(response, MAX_JSON_BYTES),
    );
    const inlineData = payload.candidates
      .flatMap((candidate) => candidate.content.parts)
      .map((part) => part.inlineData)
      .find((part) => part?.data);
    if (!inlineData) {
      throw new Error("Gemini speech response contained no audio.");
    }
    if (
      inlineData.mimeType &&
      !/^audio\/(?:L16|pcm)(?:;|$)/i.test(inlineData.mimeType)
    ) {
      throw new Error("Gemini speech response used an unsupported audio format.");
    }

    const pcm = decodePcmBase64(inlineData.data);
    return {
      mode: "audio",
      audio: wrapPcm16AsWav(pcm, 24_000, 1),
      mimeType: "audio/wav",
      provider: this.id,
    };
  }
}
