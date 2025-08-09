// https://github.com/jshttp/cookie/blob/26031e362d8473112b24a76c7c03b45ef7576d61/index.js#L47
export function cookieParse(str: string) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string')
  }

  const map = new Map<string, string>()
  let index = 0
  while (index < str.length) {
    const eqIdx = str.indexOf('=', index)

    // no more cookie pairs
    if (eqIdx === -1) {
      break
    }

    let endIdx = str.indexOf(';', index)

    if (endIdx === -1) {
      endIdx = str.length
    } else if (endIdx < eqIdx) {
      // backtrack on prior semicolon
      index = str.lastIndexOf(';', eqIdx - 1) + 1
      continue
    }

    const key = str.slice(index, eqIdx).trim()

    // only assign once
    if (!map.has(key)) {
      let val = str.slice(eqIdx + 1, endIdx).trim()

      // quoted values
      if (val.charCodeAt(0) === 0x22) {
        val = val.slice(1, -1)
      }

      try {
        if (str.includes('%')) {
          map.set(key, decodeURIComponent(val))
        } else {
          map.set(key, val)
        }
      } catch (e) {
        map.set(key, val)
      }
    }

    index = endIdx + 1
  }

  return map
}
