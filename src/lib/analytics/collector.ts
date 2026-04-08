export interface PageViewEvent {
  visitorId: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
}

export function writePageView(
  analytics: AnalyticsEngineDataset,
  event: PageViewEvent
) {
  analytics.writeDataPoint({
    blobs: [
      event.visitorId,
      event.path,
      event.referrer || '',
      event.userAgent || '',
      event.country || '',
    ],
    doubles: [1],
    indexes: [event.visitorId],
  });
}
