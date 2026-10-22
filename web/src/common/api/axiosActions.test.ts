import axios from 'axios';
import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { HttpVerbsUtil } from '@app-types/utility';
import { axiosActions } from './axiosActions';

const TEST_PATH = '/actions-test';
const TEST_URL = `${TEST_BASE_API_URL}${TEST_PATH}`;

it('wraps the response data as a success', async () => {
  server.use(http.post(TEST_URL, () => HttpResponse.json({ id: 7 })));

  const result = await axiosActions<{ id: number }>({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result).toEqual({ success: true, data: { id: 7 } });
});

it('returns a failure with the status instead of throwing', async () => {
  server.use(http.post(TEST_URL, () => HttpResponse.json({ message: 'Conflict' }, { status: 409 })));

  const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result).toEqual({ success: false, error: { statusCode: 409 } });
});

it('returns a failure with no status when the request never gets an answer', async () => {
  server.use(http.post(TEST_URL, () => HttpResponse.error()));

  const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result).toEqual({ success: false, error: { statusCode: undefined } });
});

it('rethrows an error that is not a request failure', async () => {
  vi.spyOn(axios, 'request').mockRejectedValueOnce(new TypeError('bug'));

  await expect(axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST })).rejects.toThrow('bug');
});
