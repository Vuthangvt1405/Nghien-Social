export async function shortenWithTinyUrl(longUrl: string): Promise<string> {
  const api = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(
    longUrl
  )}`;
  const res = await fetch(api);
  if (!res.ok) throw new Error(`TinyURL error: ${res.status}`);
  const shortUrl = await res.text(); // trả về chuỗi plain-text
  return shortUrl;
}
