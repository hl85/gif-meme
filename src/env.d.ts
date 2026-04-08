declare global {
  interface CloudflareEnv {
    KLIPY_API_KEY: string;
    cache: KVNamespace;
    main_db: D1Database;
    gifmeme_analytics: AnalyticsEngineDataset;
  }
}

export {};
