import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackImpression, trackClick, resetTracker } from '../ad-tracker';

describe('ad-tracker', () => {
  let originalImage: typeof Image;

  beforeEach(() => {
    resetTracker();
    originalImage = global.Image;
    global.Image = vi.fn().mockImplementation(function() {
      return { src: '' };
    }) as any;
  });

  afterEach(() => {
    global.Image = originalImage;
    vi.restoreAllMocks();
  });

  describe('trackImpression', () => {
    it('should fire an impression beacon using Image', () => {
      const url = 'https://example.com/impression';
      trackImpression(url);
      
      expect(global.Image).toHaveBeenCalledTimes(1);
      const imgInstance = vi.mocked(global.Image).mock.results[0].value;
      expect(imgInstance.src).toBe(url);
    });

    it('should deduplicate impressions for the same URL', () => {
      const url = 'https://example.com/impression';
      trackImpression(url);
      trackImpression(url);
      trackImpression(url);
      
      expect(global.Image).toHaveBeenCalledTimes(1);
    });

    it('should not fire if URL is empty', () => {
      trackImpression('');
      expect(global.Image).not.toHaveBeenCalled();
    });
  });

  describe('trackClick', () => {
    it('should fire a click beacon using Image', () => {
      const url = 'https://example.com/click';
      trackClick(url);
      
      expect(global.Image).toHaveBeenCalledTimes(1);
      const imgInstance = vi.mocked(global.Image).mock.results[0].value;
      expect(imgInstance.src).toBe(url);
    });

    it('should not deduplicate clicks', () => {
      const url = 'https://example.com/click';
      trackClick(url);
      trackClick(url);
      
      expect(global.Image).toHaveBeenCalledTimes(2);
    });

    it('should not fire if URL is empty', () => {
      trackClick('');
      expect(global.Image).not.toHaveBeenCalled();
    });
  });
});
