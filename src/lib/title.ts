export function setTitle(board?: string, text = ''): void {
  document.title = board ? `/${board}/ ${text}`.trim() : '4image';
}
