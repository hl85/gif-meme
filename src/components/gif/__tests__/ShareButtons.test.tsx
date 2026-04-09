// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/lib/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
}));

import { copyToClipboard } from '@/lib/utils/clipboard';
import { CopyUrlButton } from '../CopyUrlButton';
import { EmbedCodeButton } from '../EmbedCodeButton';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Share buttons', () => {
  it('copies the source gif url with the shared clipboard utility', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);

    render(
      <CopyUrlButton
        url="https://cdn.example.com/funny-cat.gif"
        label="Copy GIF URL"
        ariaLabel="Copy source GIF URL"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy source GIF URL' }));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('https://cdn.example.com/funny-cat.gif');
    });

    expect(screen.getByText('Copied')).toBeInTheDocument();
  });

  it('reveals and copies the iframe embed code', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);

    render(<EmbedCodeButton embedUrl="https://gifmeme.org/embed/gif-123" />);

    fireEvent.click(screen.getByRole('button', { name: 'Embed' }));

    expect(screen.getByRole('dialog', { name: 'Embed code popup' })).toBeInTheDocument();
    expect(
      screen.getByText(
        '<iframe src="https://gifmeme.org/embed/gif-123" width="480" height="360" frameBorder="0"></iframe>'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy Code' }));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(
        '<iframe src="https://gifmeme.org/embed/gif-123" width="480" height="360" frameBorder="0"></iframe>'
      );
    });
  });
});
