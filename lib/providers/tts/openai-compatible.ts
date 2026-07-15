import "server-only";

import { readArrayBufferWithLimit } from "../http-response";
import type {
  TTSAudioResult,
  TTSLanguage,
  TTSProvider,
  TTSRequest,
} from "./contracts";

type VoiceConfiguration = Record<TTSLanguage, string>;

type OpenAICompatibleTTSOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
  voices: VoiceConfiguration;
  timeoutMs?: number;
};

function speechEndpoint(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/audio/speech")
    ? normalized
    : `${normalized}/audio/speech`;
}

export class OpenAICompatibleTTSProvider implements TTSProvider {
  readonly id = "openai-compatible-tts";
  readonly kind = "provider" as const;

  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly model: string;
  private readonly voices: VoiceConfiguration;
  private readonly timeoutMs: number;

  constructor(options: OpenAICompatibleTTSOptions) {
    if (!options.apiKey.trim() || !options.model.trim()) {
      throw new Error("Speech provider configuration is incomplete.");
    }

    const endpoint = speechEndpoint(options.baseUrl);
    const protocol = new URL(endpoint).protocol;
    if (protocol !== "https:" && protocol !== "http:") {
      throw new Error("Speech provider URL must use HTTP or HTTPS.");
    }

    this.apiKey = options.apiKey;
    this.endpoint = endpoint;
    this.model = options.model;
    this.voices = options.voices;
    this.timeoutMs = Math.max(2_000, Math.min(options.timeoutMs ?? 20_000, 60_000));
  }

  async synthesize(input: TTSRequest): Promise<TTSAudioResult> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: input.text,
        voice: input.voice ?? this.voices[input.language],
        response_format: "mp3",
        speed: input.speed,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Speech provider request failed with status ${response.status}.`);
    }

    const audio = await readArrayBufferWithLimit(response, 15 * 1024 * 1024);
    if (audio.byteLength === 0) {
      throw new Error("Speech provider returned an invalid audio payload.");
    }

    const responseType = response.headers.get("content-type")?.split(";")[0]?.trim();
    const mimeType = responseType?.startsWith("audio/")
      ? responseType
      : "audio/mpeg";

    return {
      mode: "audio",
      audio,
      mimeType,
      provider: this.id,
    };
  }
}
