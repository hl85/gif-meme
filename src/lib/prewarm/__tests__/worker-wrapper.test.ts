import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../open-next-worker', () => ({
  default: {
    fetch: vi.fn(),
  },
}));

vi.mock('../handler', () => ({
  handleScheduled: vi.fn(),
}));

import openNextWorker from '../open-next-worker';
import { handleScheduled } from '../handler';
import worker, { fetch, scheduled } from '../worker-wrapper';

describe('prewarm worker wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports fetch and delegates to OpenNext fetch handler', async () => {
    const request = new Request('https://gifmeme.org/api/ping');
    const response = new Response('ok', { status: 200 });
    const env = {} as CloudflareEnv;
    const ctx = { waitUntil: vi.fn() } as unknown as ExecutionContext;

    const openNextFetch = vi.mocked(openNextWorker.fetch);
    openNextFetch.mockResolvedValueOnce(response);

    const result = await fetch(request, env, ctx);

    expect(openNextFetch).toHaveBeenCalledWith(request, env, ctx);
    expect(result).toBe(response);
    expect(worker.fetch).toBe(fetch);
    expect(typeof worker.scheduled).toBe('function');
  });

  it('scheduled handler uses ctx.waitUntil(handleScheduled(env))', () => {
    const env = {} as CloudflareEnv;
    const pending = Promise.resolve({
      total: 0,
      succeeded: 0,
      failed: 0,
      failedUrls: [],
      durationMs: 0,
    });
    const handleScheduledMock = vi.mocked(handleScheduled);
    handleScheduledMock.mockReturnValueOnce(pending);

    const waitUntil = vi.fn();
    const ctx = { waitUntil } as unknown as ExecutionContext;

    scheduled({} as ScheduledController, env, ctx);

    expect(handleScheduledMock).toHaveBeenCalledWith(env);
    expect(waitUntil).toHaveBeenCalledWith(pending);
    expect(worker.scheduled).toBe(scheduled);
  });
});
