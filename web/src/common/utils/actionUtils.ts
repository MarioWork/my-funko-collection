import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { JSONResponseUtil } from '@app-types/utility';

type VerbAction = (args: ActionFunctionArgs) => Promise<JSONResponseUtil>;

// Keyed by the request's method (`HttpVerbsUtil`): one route path, one action per verb.
export type VerbActionMap = Record<string, VerbAction>;

// Runs an action body that validates its form with yup. A form the schema rejects never reaches the API: the action
// answers a plain failure (the form already showed the field errors). Any other error still throws.
export async function failWhenInvalid<Result>(run: () => Promise<Result>): Promise<Result | JSONResponseUtil<never>> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}

// One route action that hands each request to the action for its verb. A verb with no action is a failure.
export function actionForVerbs(actionMap: VerbActionMap) {
  return async function verbAction(args: ActionFunctionArgs): Promise<JSONResponseUtil> {
    const action = actionMap[args.request.method];

    if (!action) return { success: false };

    return action(args);
  };
}
