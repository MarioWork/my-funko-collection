import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchRemoteFile } from './remoteFetch.ts';

// A public, routable address so no DNS lookup is needed; MSW answers every request, nothing leaves the machine.
const PUBLIC_HOST = 'http://93.184.216.34';
const PUBLIC_URL = `${PUBLIC_HOST}/photo.jpg`;
const MOVED_URL = `${PUBLIC_HOST}/moved.jpg`;
const PRIVATE_URL = 'http://192.168.1.10/photo.jpg';
const MAX_BYTES = 1024;
const SHORT_TIMEOUT_MS = 50;
const SERVER_ERROR_STATUS = 500;
const FOUND_STATUS = 302;

const server = setupServer();

beforeAll(() => {
  // MSW 3's name for onUnhandledRequest: any request no handler answers fails the test.
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function redirectTo(location: string): Response {
  return new HttpResponse(null, { status: FOUND_STATUS, headers: { location } });
}

describe('fetchRemoteFile', () => {
  it('returns the bytes when the server answers 200', async () => {
    server.use(http.get(PUBLIC_URL, () => HttpResponse.arrayBuffer(new TextEncoder().encode('bytes').buffer)));

    const result = await fetchRemoteFile(PUBLIC_URL, MAX_BYTES);

    expect(result.toString()).toBe('bytes');
  });

  it('follows the redirect and returns the bytes when it points at a public host', async () => {
    server.use(
      http.get(PUBLIC_URL, () => redirectTo(MOVED_URL)),
      http.get(MOVED_URL, () => HttpResponse.arrayBuffer(new TextEncoder().encode('moved').buffer)),
    );

    const result = await fetchRemoteFile(PUBLIC_URL, MAX_BYTES);

    expect(result.toString()).toBe('moved');
  });

  it('throws VALIDATION_ERROR without contacting the target when a redirect points into the local network', async () => {
    const privateHandler = vi.fn(() => HttpResponse.text('never'));
    server.use(
      http.get(PUBLIC_URL, () => redirectTo(PRIVATE_URL)),
      http.get(PRIVATE_URL, privateHandler),
    );

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(privateHandler).not.toHaveBeenCalled();
  });

  it('gives up when the server keeps redirecting', async () => {
    server.use(http.get(PUBLIC_URL, () => redirectTo(PUBLIC_URL)));

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({
      message: 'The remote server redirected too many times',
    });
  });

  it('throws PAYLOAD_TOO_LARGE when the body is over the cap even without a content-length header', async () => {
    server.use(
      http.get(PUBLIC_URL, () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(MAX_BYTES + 1));
            controller.close();
          },
        });

        return new HttpResponse(stream);
      }),
    );

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });

  it('throws VALIDATION_ERROR naming the status when the server answers 500', async () => {
    server.use(http.get(PUBLIC_URL, () => new HttpResponse(null, { status: SERVER_ERROR_STATUS })));

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: `The remote server answered ${SERVER_ERROR_STATUS}`,
    });
  });

  it('throws VALIDATION_ERROR when the connection fails', async () => {
    server.use(http.get(PUBLIC_URL, () => HttpResponse.error()));

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'The remote file could not be downloaded',
    });
  });

  it('throws VALIDATION_ERROR when the server does not answer in time', async () => {
    server.use(
      http.get(PUBLIC_URL, async () => {
        await delay('infinite');

        return HttpResponse.text('too late');
      }),
    );

    await expect(fetchRemoteFile(PUBLIC_URL, MAX_BYTES, SHORT_TIMEOUT_MS)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'The remote file could not be downloaded',
    });
  });
});
