import { fetchRemoteFile } from './remoteFetch.ts';

// A public, routable address so no DNS lookup is needed; nothing is contacted because fetch is stubbed.
const PUBLIC_URL = 'http://93.184.216.34/photo.jpg';
const PRIVATE_URL = 'http://192.168.1.10/photo.jpg';
const MAX_BYTES = 1024;

function redirectTo(location: string): Response {
  return new Response(null, { status: 302, headers: { location } });
}

describe('fetchRemoteFile', () => {
  it('refuses a redirect that points into the local network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(redirectTo(PRIVATE_URL));

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('follows a public redirect and returns the bytes', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(redirectTo('http://93.184.216.34/moved.jpg'))
      .mockResolvedValueOnce(new Response(Buffer.from('bytes')));

    const result = await fetchRemoteFile(PUBLIC_URL, MAX_BYTES);

    expect(result.toString()).toBe('bytes');
  });

  it('gives up after too many redirects', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(redirectTo(PUBLIC_URL));

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({
      message: 'The remote server redirected too many times',
    });
  });

  it('rejects a body larger than the cap even without a content-length header', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(Buffer.alloc(MAX_BYTES + 1)));

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });
});
