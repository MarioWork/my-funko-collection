import type { ActionFunctionArgs } from 'react-router';
import { string } from 'yup';
import { HttpVerbsUtil } from '@app-types/utility';
import { actionForVerbs, failWhenInvalid } from './actionUtils';

const ACTION_URL = 'http://localhost/tags/1';

function argsFor(method: string): ActionFunctionArgs {
  return { request: new Request(ACTION_URL, { method }), params: {}, context: {} } as ActionFunctionArgs;
}

describe('failWhenInvalid', () => {
  it('returns what the body returns', async () => {
    const result = await failWhenInvalid(async () => ({ success: true, data: await string().validate('Box 1') }));

    expect(result).toEqual({ success: true, data: 'Box 1' });
  });

  it('answers a plain failure when the schema rejects the input', async () => {
    const result = await failWhenInvalid(async () => ({ success: true, data: await string().required().validate('') }));

    expect(result).toEqual({ success: false });
  });

  it('still throws any other error', async () => {
    const failure = new Error('network');

    await expect(failWhenInvalid(() => Promise.reject(failure))).rejects.toBe(failure);
  });
});

describe('actionForVerbs', () => {
  const action = actionForVerbs({
    [HttpVerbsUtil.PATCH]: () => Promise.resolve({ success: true, data: 'patched' }),
    [HttpVerbsUtil.DELETE]: () => Promise.resolve({ success: true, data: 'deleted' }),
  });

  it('hands each request to the action for its verb', async () => {
    await expect(action(argsFor(HttpVerbsUtil.PATCH))).resolves.toEqual({ success: true, data: 'patched' });
    await expect(action(argsFor(HttpVerbsUtil.DELETE))).resolves.toEqual({ success: true, data: 'deleted' });
  });

  it('fails a verb with no action', async () => {
    await expect(action(argsFor(HttpVerbsUtil.POST))).resolves.toEqual({ success: false });
  });
});
