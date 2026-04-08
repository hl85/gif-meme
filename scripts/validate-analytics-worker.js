// Usage:
//   Deploy: npx wrangler deploy scripts/validate-analytics-worker.js --name analytics-validator --config scripts/wrangler-validator.toml
//   Cleanup: npx wrangler delete --name analytics-validator --config scripts/wrangler-validator.toml

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/write-test-data") {
      const testEvents = [
        { cookieId: "user-aaa", referrer: "https://google.com", path: "/", userAgent: "Chrome/120" },
        { cookieId: "user-aaa", referrer: "https://google.com", path: "/category/trending", userAgent: "Chrome/120" },
        { cookieId: "user-bbb", referrer: "https://twitter.com", path: "/", userAgent: "Firefox/119" },
        { cookieId: "user-bbb", referrer: "https://twitter.com", path: "/search?q=funny", userAgent: "Firefox/119" },
        { cookieId: "user-ccc", referrer: "https://reddit.com", path: "/", userAgent: "Safari/17" },
        { cookieId: "user-ccc", referrer: "", path: "/gif/12345", userAgent: "Safari/17" },
        { cookieId: "user-ddd", referrer: "https://google.com", path: "/", userAgent: "Chrome/120" },
        { cookieId: "user-ddd", referrer: "https://google.com", path: "/category/reactions", userAgent: "Chrome/120" },
        { cookieId: "user-eee", referrer: "https://facebook.com", path: "/", userAgent: "Chrome/119" },
        { cookieId: "user-aaa", referrer: "https://google.com", path: "/", userAgent: "Chrome/120" },
        { cookieId: "user-fff", referrer: "https://twitter.com", path: "/search?q=cats", userAgent: "Edge/120" },
        { cookieId: "user-ggg", referrer: "", path: "/gif/67890", userAgent: "Chrome/120" },
      ];

      for (const evt of testEvents) {
        env.ANALYTICS.writeDataPoint({
          blobs: [evt.cookieId, evt.referrer, evt.path, "", evt.userAgent],
          doubles: [1],
          indexes: [evt.path],
        });
      }

      return new Response(JSON.stringify({
        status: "ok",
        eventsWritten: testEvents.length,
        message: "Test events written. Wait 30-60s for indexing, then run query validation.",
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      endpoints: {
        "/write-test-data": "Write 12 test page view events to Analytics Engine",
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
