import openNextWorker from './open-next-worker';
import { handleScheduled } from './handler';

export * from './open-next-worker';

export const fetch = (request: Request, env: CloudflareEnv, ctx: ExecutionContext) => {
  return openNextWorker.fetch(request, env, ctx);
};

export const scheduled = (_event: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) => {
  ctx.waitUntil(handleScheduled(env));
};

export default {
  fetch,
  scheduled,
};
