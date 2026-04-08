// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { KlipyAd } from '../KlipyAd';
import * as adTracker from '@/lib/klipy/ad-tracker';

vi.mock('@/lib/klipy/ad-tracker', () => ({
  trackImpression: vi.fn(),
  trackClick: vi.fn(),
}));

describe('KlipyAd', () => {
  const mockAd = {
    type: 'ad' as const,
    id: 'ad-1',
    image_url: 'https://example.com/ad.gif',
    click_url: 'https://example.com/click',
    impression_url: 'https://example.com/impression',
    width: 300,
    height: 250,
  };

  let observeMock: ReturnType<typeof vi.fn>;
  let unobserveMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    observeMock = vi.fn();
    unobserveMock = vi.fn();
    disconnectMock = vi.fn();

    global.IntersectionObserver = vi.fn().mockImplementation(function(callback) {
      // Store callback to trigger it manually in tests
      (global as any).triggerIntersection = callback;
      return {
        observe: observeMock,
        unobserve: unobserveMock,
        disconnect: disconnectMock,
      };
    }) as any;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete (global as any).triggerIntersection;
  });

  it('renders the ad image correctly', () => {
    render(<KlipyAd ad={mockAd} />);
    
    const img = screen.getByAltText('Advertisement');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockAd.image_url);
  });

  it('tracks click when clicked', () => {
    render(<KlipyAd ad={mockAd} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', mockAd.click_url);
    
    fireEvent.click(link);
    expect(adTracker.trackClick).toHaveBeenCalledWith(mockAd.click_url);
  });

  it('tracks impression when visible for 1 second', () => {
    render(<KlipyAd ad={mockAd} />);
    
    // Trigger intersection observer (visible)
    (global as any).triggerIntersection([{ isIntersecting: true }]);
    
    // Fast-forward 500ms - should not track yet
    vi.advanceTimersByTime(500);
    expect(adTracker.trackImpression).not.toHaveBeenCalled();
    
    // Fast-forward another 500ms - should track now
    vi.advanceTimersByTime(500);
    expect(adTracker.trackImpression).toHaveBeenCalledWith(mockAd.impression_url);
  });

  it('does not track impression if visibility is lost before 1 second', () => {
    render(<KlipyAd ad={mockAd} />);
    
    // Trigger intersection observer (visible)
    (global as any).triggerIntersection([{ isIntersecting: true }]);
    
    // Fast-forward 500ms
    vi.advanceTimersByTime(500);
    
    // Trigger intersection observer (not visible)
    (global as any).triggerIntersection([{ isIntersecting: false }]);
    
    // Fast-forward another 500ms
    vi.advanceTimersByTime(500);
    
    expect(adTracker.trackImpression).not.toHaveBeenCalled();
  });

  it('cleans up observer on unmount', () => {
    const { unmount } = render(<KlipyAd ad={mockAd} />);
    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});
