// Every auth job's routes, under /auth: the session (status, signing out), first-run setup, signing in (and the
// recent sign-in), the password, and the user's own passkeys.
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { passkeysRoutes } from './passkeys/passkeys.route.ts';
import { passwordRoutes } from './password/password.route.ts';
import { sessionRoutes } from './session/session.route.ts';
import { setupRoutes } from './setup/setup.route.ts';
import { signInRoutes } from './signIn/signIn.route.ts';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(sessionRoutes);
  await app.register(setupRoutes);
  await app.register(signInRoutes);
  await app.register(passwordRoutes);
  await app.register(passkeysRoutes);
};
