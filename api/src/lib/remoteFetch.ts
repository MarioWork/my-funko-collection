// Downloads a remote file into memory with a size cap, a timeout, and a refusal to talk to the local network.
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { BadRequestError, PayloadTooLargeError } from './httpErrors.ts';

const FETCH_TIMEOUT_MS = 10_000;
// Redirects are followed by hand so every hop gets the same public-host check as the first URL.
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const LOOPBACK_V4 = /^127\./;
const LINK_LOCAL_V4 = /^169\.254\./;
const PRIVATE_V4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
const UNSPECIFIED_V4 = '0.0.0.0';
const LOCAL_V6 = new Set(['::1', '::']);
const LINK_LOCAL_V6 = /^fe80:/i;
const UNIQUE_LOCAL_V6 = /^f[cd][0-9a-f]{2}:/i;
const LOCALHOST_NAMES = new Set(['localhost', 'localhost.localdomain']);
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function isLocalAddress(address: string): boolean {
  if (address === UNSPECIFIED_V4 || LOCAL_V6.has(address)) return true;
  if (LOOPBACK_V4.test(address) || LINK_LOCAL_V4.test(address) || PRIVATE_V4.test(address)) return true;

  return LINK_LOCAL_V6.test(address) || UNIQUE_LOCAL_V6.test(address);
}

// Loopback, link-local and private ranges are off limits: a URL must point at the public internet.
async function assertPublicUrl(url: URL): Promise<void> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) throw new BadRequestError('The URL must use http or https');
  if (LOCALHOST_NAMES.has(hostname)) throw new BadRequestError('The URL must point at a public host');

  const addresses = isIP(hostname) ? [hostname] : (await lookup(hostname, { all: true })).map((entry) => entry.address);
  const hasLocalAddress = addresses.some(isLocalAddress);

  if (addresses.length === 0 || hasLocalAddress) throw new BadRequestError('The URL must point at a public host');
}

async function fetchOnce(url: URL, timeoutMs: number): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'manual' });
  } catch (error: unknown) {
    throw new BadRequestError('The remote file could not be downloaded', { cause: error });
  }
}

// Follows up to MAX_REDIRECTS hops, checking each target before it is contacted.
async function fetchFollowingRedirects(startUrl: URL, timeoutMs: number): Promise<Response> {
  let url = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicUrl(url);

    const response = await fetchOnce(url, timeoutMs);
    const isRedirect = REDIRECT_STATUSES.has(response.status);

    if (!isRedirect) return response;

    const location = response.headers.get('location');

    if (!location) throw new BadRequestError('The remote server redirected without a target');

    url = new URL(location, url);
  }

  throw new BadRequestError('The remote server redirected too many times');
}

async function readWithCap(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(response.headers.get('content-length') ?? 0);

  if (declaredLength > maxBytes) throw new PayloadTooLargeError('The remote file is too large');
  if (!response.body) throw new BadRequestError('The remote file is empty');

  const chunks: Uint8Array[] = [];
  let received = 0;

  for await (const chunk of response.body) {
    received += chunk.byteLength;

    if (received > maxBytes) throw new PayloadTooLargeError('The remote file is too large');

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// `timeoutMs` bounds each hop; the default is for real use, tests pass a short one.
export async function fetchRemoteFile(
  rawUrl: string,
  maxBytes: number,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Buffer> {
  const response = await fetchFollowingRedirects(new URL(rawUrl), timeoutMs);

  if (!response.ok) throw new BadRequestError(`The remote server answered ${response.status}`);

  return readWithCap(response, maxBytes);
}
