const WAV_HEADER_BYTES = 44;

export function wrapPcm16AsWav(
  pcm: Uint8Array,
  sampleRate = 24_000,
  channels = 1,
): ArrayBuffer {
  if (pcm.byteLength === 0 || pcm.byteLength % 2 !== 0) {
    throw new Error("PCM audio must contain complete 16-bit samples.");
  }
  if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new Error("PCM sample rate is invalid.");
  }
  if (!Number.isInteger(channels) || channels <= 0 || channels > 8) {
    throw new Error("PCM channel count is invalid.");
  }

  const dataBytes = pcm.byteLength;
  const wav = new Uint8Array(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(wav.buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      wav[offset + index] = value.charCodeAt(index);
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataBytes, true);
  wav.set(pcm, WAV_HEADER_BYTES);

  return wav.buffer;
}
