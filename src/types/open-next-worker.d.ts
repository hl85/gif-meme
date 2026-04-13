declare module '*.open-next/worker.js' {
  interface OpenNextWorkerDefaultExport {
    fetch: (request: Request, env: CloudflareEnv, ctx: ExecutionContext) => Response | Promise<Response>;
  }

  const worker: OpenNextWorkerDefaultExport;
  export default worker;
}
