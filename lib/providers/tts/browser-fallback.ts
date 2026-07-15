import type {
  TTSBrowserFallback,
  TTSProvider,
  TTSRequest,
} from "./contracts";

/**
 * Returns instructions for a client-side SpeechSynthesis fallback. It never tries
 * to access browser globals from the server.
 */
export class BrowserFallbackTTSProvider implements TTSProvider {
  readonly id = "browser-fallback";
  readonly kind = "mock" as const;

  async synthesize(input: TTSRequest): Promise<TTSBrowserFallback> {
    return {
      mode: "browser",
      fallback: true,
      text: input.text,
      language: input.language,
      voice: input.voice,
      speed: input.speed,
      message:
        "Neural narration is unavailable. Your browser voice can be used as a lower-quality fallback.",
    };
  }
}
