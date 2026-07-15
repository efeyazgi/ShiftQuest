import "server-only";

function declaredContentLength(response: Response): number | null {
  const raw = response.headers.get("content-length");
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function readArrayBufferWithLimit(
  response: Response,
  maximumBytes: number,
): Promise<ArrayBuffer> {
  const declared = declaredContentLength(response);
  if (declared !== null && declared > maximumBytes) {
    throw new Error("Provider response exceeded the size limit.");
  }

  if (!response.body) {
    const result = await response.arrayBuffer();
    if (result.byteLength > maximumBytes) {
      throw new Error("Provider response exceeded the size limit.");
    }
    return result;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maximumBytes) {
        await reader.cancel();
        throw new Error("Provider response exceeded the size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined.buffer as ArrayBuffer;
}

export async function readJsonWithLimit(
  response: Response,
  maximumBytes: number,
): Promise<unknown> {
  const bytes = await readArrayBufferWithLimit(response, maximumBytes);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(text) as unknown;
}
