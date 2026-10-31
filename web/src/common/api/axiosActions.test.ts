import axios from 'axios';
import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { HttpVerbsUtil } from '@app-types/utility';
import { FORBIDDEN_STATUS, SERVER_ERROR_STATUS, UNAUTHORIZED_STATUS } from '@utils/httpStatusUtils';
import {
  ADMIN_ONLY_ERROR_CODE,
  axiosActions,
  isAdminOnlyFailure,
  isUnauthorizedFailure,
  UNAUTHORIZED_ERROR_CODE,
} from './axiosActions';

const TEST_PATH = '/actions-test';
const TEST_URL = `${TEST_BASE_API_URL}${TEST_PATH}`;

type CreatedRecord = { id: number };

describe('axiosActions', () => {
  it('wraps the response data as a success', async () => {
    server.use(http.post(TEST_URL, () => HttpResponse.json({ id: 7 })));

    const result = await axiosActions<CreatedRecord>({ url: TEST_PATH, method: HttpVerbsUtil.POST });

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
});

describe('isUnauthorizedFailure', () => {
  it('is true for a read rejected with 401', async () => {
    server.use(http.get(TEST_URL, () => new HttpResponse(null, { status: UNAUTHORIZED_STATUS })));

    await expect(axios.get(TEST_PATH)).rejects.toSatisfy(isUnauthorizedFailure);
  });

  it('is false for a read rejected with another status', async () => {
    server.use(http.get(TEST_URL, () => new HttpResponse(null, { status: SERVER_ERROR_STATUS })));

    await expect(axios.get(TEST_PATH)).rejects.not.toSatisfy(isUnauthorizedFailure);
  });

  it('is true for a write envelope with the unauthorized code', async () => {
    server.use(
      http.post(TEST_URL, () =>
        HttpResponse.json({ code: UNAUTHORIZED_ERROR_CODE, message: 'Sign in' }, { status: UNAUTHORIZED_STATUS }),
      ),
    );

    const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

    expect(isUnauthorizedFailure(result)).toBe(true);
  });

  it('is false for a 401 envelope that carries its own code', async () => {
    server.use(
      http.post(TEST_URL, () =>
        HttpResponse.json({ code: 'INVALID_SETUP_CODE', message: 'Wrong code' }, { status: UNAUTHORIZED_STATUS }),
      ),
    );

    const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

    expect(isUnauthorizedFailure(result)).toBe(false);
  });

  it('is false for a success envelope and for an error that is not a request failure', () => {
    expect(isUnauthorizedFailure({ success: true, data: {} })).toBe(false);
    expect(isUnauthorizedFailure(new TypeError('bug'))).toBe(false);
  });
});

describe('isAdminOnlyFailure', () => {
  function refuseAsAdminOnly() {
    return HttpResponse.json({ code: ADMIN_ONLY_ERROR_CODE, message: 'Admins only' }, { status: FORBIDDEN_STATUS });
  }

  it('is true for a read rejected with 403 ADMIN_ONLY', async () => {
    server.use(http.get(TEST_URL, refuseAsAdminOnly));

    await expect(axios.get(TEST_PATH)).rejects.toSatisfy(isAdminOnlyFailure);
  });

  it('is true for a write envelope with 403 ADMIN_ONLY', async () => {
    server.use(http.post(TEST_URL, refuseAsAdminOnly));

    const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

    expect(isAdminOnlyFailure(result)).toBe(true);
  });

  it('is false for a 403 that carries another code', async () => {
    server.use(
      http.post(TEST_URL, () =>
        HttpResponse.json({ code: 'REAUTH_REQUIRED', message: 'Confirm' }, { status: FORBIDDEN_STATUS }),
      ),
    );

    const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

    expect(isAdminOnlyFailure(result)).toBe(false);
  });

  it('is false for a success envelope and for an error that is not a request failure', () => {
    expect(isAdminOnlyFailure({ success: true, data: {} })).toBe(false);
    expect(isAdminOnlyFailure(new TypeError('bug'))).toBe(false);
  });
});
