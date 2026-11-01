export function hintIfCut(e: MouseEvent, text: string): void {
  const el = e.currentTarget as HTMLElement;
  if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) el.title = text;
  else el.removeAttribute('title');
}
