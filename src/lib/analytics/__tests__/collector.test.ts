import { describe, it, expect, vi } from 'vitest';
import { writePageView } from '../collector';

describe('Analytics Collector', () => {
  it('maps PageViewEvent to Analytics Engine format correctly', () => {
    const mockWriteDataPoint = vi.fn();
    const mockAnalytics = {
      writeDataPoint: mockWriteDataPoint,
    } as any;

    const event = {
      visitorId: 'test-visitor-123',
      path: '/search?q=funny',
      referrer: 'https://google.com',
      userAgent: 'Mozilla/5.0',
      country: 'US',
    };

    writePageView(mockAnalytics, event);

    expect(mockWriteDataPoint).toHaveBeenCalledWith({
      blobs: [
        'test-visitor-123',
        '/search?q=funny',
        'https://google.com',
        'Mozilla/5.0',
        'US',
      ],
      doubles: [1],
      indexes: ['test-visitor-123'],
    });
  });

  it('handles missing optional fields', () => {
    const mockWriteDataPoint = vi.fn();
    const mockAnalytics = {
      writeDataPoint: mockWriteDataPoint,
    } as any;

    const event = {
      visitorId: 'test-visitor-456',
      path: '/',
    };

    writePageView(mockAnalytics, event);

    expect(mockWriteDataPoint).toHaveBeenCalledWith({
      blobs: [
        'test-visitor-456',
        '/',
        '',
        '',
        '',
      ],
      doubles: [1],
      indexes: ['test-visitor-456'],
    });
  });
});
