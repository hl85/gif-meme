// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AdSlot } from '../AdSlot';

vi.mock('../KlipyAd', () => ({
  KlipyAd: ({ ad }: { ad: any }) => <div data-testid="mock-klipy-ad">{ad.id}</div>,
}));

describe('AdSlot', () => {
  const mockAds = [
    {
      type: 'ad' as const,
      id: 'ad-1',
      image_url: 'https://example.com/ad1.gif',
      click_url: 'https://example.com/click1',
      impression_url: 'https://example.com/imp1',
      width: 300,
      height: 250,
    },
    {
      type: 'ad' as const,
      id: 'ad-2',
      image_url: 'https://example.com/ad2.gif',
      click_url: 'https://example.com/click2',
      impression_url: 'https://example.com/imp2',
      width: 300,
      height: 250,
    },
  ];

  afterEach(() => {
    cleanup();
  });

  it('renders nothing if ads array is empty', () => {
    const { container } = render(<AdSlot ads={[]} index={11} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing if index does not match frequency', () => {
    const { container } = render(<AdSlot ads={mockAds} index={10} frequency={12} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders ad if index matches frequency', () => {
    render(<AdSlot ads={mockAds} index={11} frequency={12} />);
    expect(screen.getByTestId('ad-slot')).toBeInTheDocument();
    expect(screen.getByTestId('mock-klipy-ad')).toHaveTextContent('ad-1');
  });

  it('cycles through ads based on index', () => {
    // First ad slot (index 11) -> ad-1
    const { unmount: unmount1 } = render(<AdSlot ads={mockAds} index={11} frequency={12} />);
    expect(screen.getByTestId('mock-klipy-ad')).toHaveTextContent('ad-1');
    unmount1();

    // Second ad slot (index 23) -> ad-2
    const { unmount: unmount2 } = render(<AdSlot ads={mockAds} index={23} frequency={12} />);
    expect(screen.getByTestId('mock-klipy-ad')).toHaveTextContent('ad-2');
    unmount2();

    // Third ad slot (index 35) -> ad-1 (cycles back)
    render(<AdSlot ads={mockAds} index={35} frequency={12} />);
    expect(screen.getByTestId('mock-klipy-ad')).toHaveTextContent('ad-1');
  });
});
