export function parseUrlEncoded(encoded: string) {
  const result: Record<string, string> = {};
  for (const pair of encoded.split("&")) {
    const [key, value] = pair.split("=");
    result[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return result;
}