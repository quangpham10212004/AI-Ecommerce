const ICONS: Record<string, string> = {
  headphones: '🎧', laptop: '💻', monitor: '🖥', keyboard: '⌨️',
  mouse: '🖱', speaker: '🔊', phone: '📱',
}
export const productIcon = (key?: string) => ICONS[key ?? ''] ?? '📦'
export const fmtPrice = (v: string | number) =>
  Number(String(v).replace(/,/g, '')).toLocaleString('vi-VN') + '₫'
