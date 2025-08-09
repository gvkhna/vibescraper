// TODO: need to remove
export function windowNavigate(url?: string | null) {
  if (url) {
    globalThis.window.location.href = url
  }
}
