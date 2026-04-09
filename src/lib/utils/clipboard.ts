'use client';

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  if (typeof document === 'undefined') {
    return false;
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', 'true');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';

  document.body.appendChild(input);
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(input);
  }
}
