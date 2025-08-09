import {getMimeType as honoGetMimeType} from 'hono/utils/mime'
// Extended file categories as string literals
export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'font'
  | 'text'
  | 'unknown'

// Icon names for each category (matching HeroIcons)
export type FileIconName =
  | 'photo'
  | 'play'
  | 'musical-note'
  | 'document-text'
  | 'document'
  | 'table-cells'
  | 'presentation-chart-bar'
  | 'archive-box'
  | 'code-bracket'
  | 'font'
  | 'text'
  | 'question-mark-circle'

// Color schemes for file types
export type FileColorScheme =
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'gray'
  | 'indigo'
  | 'teal'

// Complete file type information
export interface FileTypeInfo {
  category: FileCategory
  icon: FileIconName
  colorScheme: FileColorScheme
  mimeType: string
  displayName: string
  isCompressible: boolean
  canInline: boolean
}

// Extended MIME type mappings (combining your overrides with Hono's base)
const EXTENDED_MIME_OVERRIDES: Record<string, string | undefined> = {
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',

  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.avif': 'image/avif',

  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  // '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.3gp': 'video/3gpp',
  '.3g2': 'video/3gpp2',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.flac': 'audio/flac',
  '.wma': 'audio/x-ms-wma',

  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.bz2': 'application/x-bzip2',
  '.xz': 'application/x-xz',

  // Code/Text
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.jsx': 'text/javascript',
  '.tsx': 'text/typescript',
  '.py': 'text/x-python',
  '.java': 'text/x-java-source',
  '.cpp': 'text/x-c++src',
  '.c': 'text/x-csrc',
  '.php': 'text/x-php',
  '.rb': 'text/x-ruby',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.sql': 'text/x-sql',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.toml': 'text/toml',
  '.ini': 'text/plain',
  '.conf': 'text/plain',
  '.log': 'text/plain',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',

  // Web
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.scss': 'text/scss',
  '.sass': 'text/sass',
  '.less': 'text/less'
}

// File category mappings based on MIME types and extensions
const FILE_CATEGORY_MAPPINGS: Record<string, FileTypeInfo | undefined> = {
  // Images
  'image/jpeg': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/jpeg',
    displayName: 'JPEG Image',
    isCompressible: false,
    canInline: true
  },
  'image/png': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/png',
    displayName: 'PNG Image',
    isCompressible: false,
    canInline: true
  },
  'image/gif': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/gif',
    displayName: 'GIF Image',
    isCompressible: false,
    canInline: true
  },
  'image/webp': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/webp',
    displayName: 'WebP Image',
    isCompressible: false,
    canInline: true
  },
  'image/svg+xml': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/svg+xml',
    displayName: 'SVG Image',
    isCompressible: true,
    canInline: true
  },
  'image/bmp': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/bmp',
    displayName: 'BMP Image',
    isCompressible: false,
    canInline: true
  },
  'image/tiff': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/tiff',
    displayName: 'TIFF Image',
    isCompressible: false,
    canInline: true
  },
  'image/avif': {
    category: 'image',
    icon: 'photo',
    colorScheme: 'green',
    mimeType: 'image/avif',
    displayName: 'AVIF Image',
    isCompressible: false,
    canInline: true
  },

  // Videos
  'video/mp4': {
    category: 'video',
    icon: 'play',
    colorScheme: 'purple',
    mimeType: 'video/mp4',
    displayName: 'MP4 Video',
    isCompressible: false,
    canInline: true
  },
  'video/webm': {
    category: 'video',
    icon: 'play',
    colorScheme: 'purple',
    mimeType: 'video/webm',
    displayName: 'WebM Video',
    isCompressible: false,
    canInline: true
  },
  'video/ogg': {
    category: 'video',
    icon: 'play',
    colorScheme: 'purple',
    mimeType: 'video/ogg',
    displayName: 'OGG Video',
    isCompressible: false,
    canInline: true
  },
  'video/quicktime': {
    category: 'video',
    icon: 'play',
    colorScheme: 'purple',
    mimeType: 'video/quicktime',
    displayName: 'MOV Video',
    isCompressible: false,
    canInline: true
  },
  'video/x-msvideo': {
    category: 'video',
    icon: 'play',
    colorScheme: 'purple',
    mimeType: 'video/x-msvideo',
    displayName: 'AVI Video',
    isCompressible: false,
    canInline: true
  },

  // Audio
  'audio/mpeg': {
    category: 'audio',
    icon: 'musical-note',
    colorScheme: 'pink',
    mimeType: 'audio/mpeg',
    displayName: 'MP3 Audio',
    isCompressible: false,
    canInline: true
  },
  'audio/wav': {
    category: 'audio',
    icon: 'musical-note',
    colorScheme: 'pink',
    mimeType: 'audio/wav',
    displayName: 'WAV Audio',
    isCompressible: false,
    canInline: true
  },
  'audio/mp4': {
    category: 'audio',
    icon: 'musical-note',
    colorScheme: 'pink',
    mimeType: 'audio/mp4',
    displayName: 'M4A Audio',
    isCompressible: false,
    canInline: true
  },
  'audio/ogg': {
    category: 'audio',
    icon: 'musical-note',
    colorScheme: 'pink',
    mimeType: 'audio/ogg',
    displayName: 'OGG Audio',
    isCompressible: false,
    canInline: true
  },
  'audio/aac': {
    category: 'audio',
    icon: 'musical-note',
    colorScheme: 'pink',
    mimeType: 'audio/aac',
    displayName: 'AAC Audio',
    isCompressible: false,
    canInline: true
  },

  // Documents
  'application/pdf': {
    category: 'document',
    icon: 'document-text',
    colorScheme: 'red',
    mimeType: 'application/pdf',
    displayName: 'PDF Document',
    isCompressible: false,
    canInline: true
  },
  'application/msword': {
    category: 'document',
    icon: 'document',
    colorScheme: 'blue',
    mimeType: 'application/msword',
    displayName: 'Word Document',
    isCompressible: false,
    canInline: false
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    category: 'document',
    icon: 'document',
    colorScheme: 'blue',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    displayName: 'Word Document',
    isCompressible: false,
    canInline: false
  },
  'application/rtf': {
    category: 'document',
    icon: 'document',
    colorScheme: 'blue',
    mimeType: 'application/rtf',
    displayName: 'RTF Document',
    isCompressible: true,
    canInline: false
  },

  // Spreadsheets
  'application/vnd.ms-excel': {
    category: 'spreadsheet',
    icon: 'table-cells',
    colorScheme: 'teal',
    mimeType: 'application/vnd.ms-excel',
    displayName: 'Excel Spreadsheet',
    isCompressible: false,
    canInline: false
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    category: 'spreadsheet',
    icon: 'table-cells',
    colorScheme: 'teal',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    displayName: 'Excel Spreadsheet',
    isCompressible: false,
    canInline: false
  },
  'text/csv': {
    category: 'spreadsheet',
    icon: 'table-cells',
    colorScheme: 'teal',
    mimeType: 'text/csv',
    displayName: 'CSV File',
    isCompressible: true,
    canInline: true
  },

  // Presentations
  'application/vnd.ms-powerpoint': {
    category: 'presentation',
    icon: 'presentation-chart-bar',
    colorScheme: 'orange',
    mimeType: 'application/vnd.ms-powerpoint',
    displayName: 'PowerPoint Presentation',
    isCompressible: false,
    canInline: false
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    category: 'presentation',
    icon: 'presentation-chart-bar',
    colorScheme: 'orange',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    displayName: 'PowerPoint Presentation',
    isCompressible: false,
    canInline: false
  },

  // Archives
  'application/zip': {
    category: 'archive',
    icon: 'archive-box',
    colorScheme: 'yellow',
    mimeType: 'application/zip',
    displayName: 'ZIP Archive',
    isCompressible: false,
    canInline: false
  },
  'application/x-tar': {
    category: 'archive',
    icon: 'archive-box',
    colorScheme: 'yellow',
    mimeType: 'application/x-tar',
    displayName: 'TAR Archive',
    isCompressible: false,
    canInline: false
  },
  'application/gzip': {
    category: 'archive',
    icon: 'archive-box',
    colorScheme: 'yellow',
    mimeType: 'application/gzip',
    displayName: 'GZIP Archive',
    isCompressible: false,
    canInline: false
  },
  'application/x-rar-compressed': {
    category: 'archive',
    icon: 'archive-box',
    colorScheme: 'yellow',
    mimeType: 'application/x-rar-compressed',
    displayName: 'RAR Archive',
    isCompressible: false,
    canInline: false
  },
  'application/x-7z-compressed': {
    category: 'archive',
    icon: 'archive-box',
    colorScheme: 'yellow',
    mimeType: 'application/x-7z-compressed',
    displayName: '7-Zip Archive',
    isCompressible: false,
    canInline: false
  },

  // Code
  'text/javascript': {
    category: 'code',
    icon: 'code-bracket',
    colorScheme: 'indigo',
    mimeType: 'text/javascript',
    displayName: 'JavaScript',
    isCompressible: true,
    canInline: true
  },
  'text/typescript': {
    category: 'code',
    icon: 'code-bracket',
    colorScheme: 'indigo',
    mimeType: 'text/typescript',
    displayName: 'TypeScript',
    isCompressible: true,
    canInline: true
  },
  'text/x-python': {
    category: 'code',
    icon: 'code-bracket',
    colorScheme: 'indigo',
    mimeType: 'text/x-python',
    displayName: 'Python',
    isCompressible: true,
    canInline: true
  },
  'text/html': {
    category: 'code',
    icon: 'code-bracket',
    colorScheme: 'indigo',
    mimeType: 'text/html',
    displayName: 'HTML',
    isCompressible: true,
    canInline: true
  },
  'text/css': {
    category: 'code',
    icon: 'code-bracket',
    colorScheme: 'indigo',
    mimeType: 'text/css',
    displayName: 'CSS',
    isCompressible: true,
    canInline: true
  },
  'application/json': {
    category: 'code',
    icon: 'code-bracket',
    colorScheme: 'indigo',
    mimeType: 'application/json',
    displayName: 'JSON',
    isCompressible: true,
    canInline: true
  },
  'application/xml': {
    category: 'code',
    icon: 'code-bracket',
    colorScheme: 'indigo',
    mimeType: 'application/xml',
    displayName: 'XML',
    isCompressible: true,
    canInline: true
  },

  // Text
  'text/plain': {
    category: 'text',
    icon: 'document',
    colorScheme: 'gray',
    mimeType: 'text/plain',
    displayName: 'Text File',
    isCompressible: true,
    canInline: true
  },
  'text/markdown': {
    category: 'text',
    icon: 'document',
    colorScheme: 'gray',
    mimeType: 'text/markdown',
    displayName: 'Markdown',
    isCompressible: true,
    canInline: true
  },

  // Fonts
  'font/woff': {
    category: 'font',
    icon: 'font',
    colorScheme: 'gray',
    mimeType: 'font/woff',
    displayName: 'WOFF Font',
    isCompressible: false,
    canInline: false
  },
  'font/woff2': {
    category: 'font',
    icon: 'font',
    colorScheme: 'gray',
    mimeType: 'font/woff2',
    displayName: 'WOFF2 Font',
    isCompressible: false,
    canInline: false
  },
  'font/ttf': {
    category: 'font',
    icon: 'font',
    colorScheme: 'gray',
    mimeType: 'font/ttf',
    displayName: 'TrueType Font',
    isCompressible: false,
    canInline: false
  },
  'font/otf': {
    category: 'font',
    icon: 'font',
    colorScheme: 'gray',
    mimeType: 'font/otf',
    displayName: 'OpenType Font',
    isCompressible: false,
    canInline: false
  }
}

/**
 * Get complete file type information
 */
export function getFileTypeInfo(filepath?: string, mimeType?: string): FileTypeInfo {
  const detectedMimeType = mimeType ?? (filepath && getMimeType(filepath))

  // Check if we have specific mapping for this MIME type
  if (detectedMimeType) {
    const detectedCategory = FILE_CATEGORY_MAPPINGS[detectedMimeType]
    if (detectedCategory) {
      return detectedCategory
    }

    // Fallback to category detection based on MIME type prefix
    if (detectedMimeType.startsWith('image/')) {
      return {
        category: 'image',
        icon: 'photo',
        colorScheme: 'green',
        mimeType: detectedMimeType,
        displayName: 'Image',
        isCompressible: false,
        canInline: true
      }
    }
    if (detectedMimeType.startsWith('video/')) {
      return {
        category: 'video',
        icon: 'play',
        colorScheme: 'purple',
        mimeType: detectedMimeType,
        displayName: 'Video',
        isCompressible: false,
        canInline: true
      }
    }
    if (detectedMimeType.startsWith('audio/')) {
      return {
        category: 'audio',
        icon: 'musical-note',
        colorScheme: 'pink',
        mimeType: detectedMimeType,
        displayName: 'Audio',
        isCompressible: false,
        canInline: true
      }
    }
    if (detectedMimeType.startsWith('text/')) {
      return {
        category: 'text',
        icon: 'document',
        colorScheme: 'gray',
        mimeType: detectedMimeType,
        displayName: 'Text',
        isCompressible: true,
        canInline: true
      }
    }
    if (detectedMimeType.startsWith('font/')) {
      return {
        category: 'font',
        icon: 'font',
        colorScheme: 'gray',
        mimeType: detectedMimeType,
        displayName: 'Font',
        isCompressible: false,
        canInline: false
      }
    }
  }

  // Default fallback
  return {
    category: 'unknown',
    icon: 'question-mark-circle',
    colorScheme: 'gray',
    mimeType: detectedMimeType ?? 'application/octet-stream',
    displayName: 'Unknown',
    isCompressible: false,
    canInline: false
  }
}

/**
 * Get Tailwind CSS classes for file type colors
 */
export function getFileTypeColors(colorScheme: FileColorScheme): {text: string; background: string} {
  const colorMap: Record<FileColorScheme, {text: string; background: string} | undefined> = {
    green: {text: 'text-green-600', background: 'bg-green-100'},
    blue: {text: 'text-blue-600', background: 'bg-blue-100'},
    purple: {text: 'text-purple-600', background: 'bg-purple-100'},
    pink: {text: 'text-pink-600', background: 'bg-pink-100'},
    red: {text: 'text-red-600', background: 'bg-red-100'},
    orange: {text: 'text-orange-600', background: 'bg-orange-100'},
    yellow: {text: 'text-yellow-600', background: 'bg-yellow-100'},
    gray: {text: 'text-gray-600', background: 'bg-gray-100'},
    indigo: {text: 'text-indigo-600', background: 'bg-indigo-100'},
    teal: {text: 'text-teal-600', background: 'bg-teal-100'}
  }

  const mappedColorScheme = colorMap[colorScheme]
  const defaultColorScheme = colorMap.gray!
  if (mappedColorScheme) {
    return mappedColorScheme
  }
  return defaultColorScheme
}

/**
 * Get MIME type for a file path with custom overrides
 */
export function getMimeType(filepath: string): string | undefined {
  // Check for extension-based override first
  const ext = /\.[^.]+$/.exec(filepath)?.[0]?.toLowerCase()
  if (ext) {
    const mimeOverride = EXTENDED_MIME_OVERRIDES[ext]
    if (mimeOverride) {
      return EXTENDED_MIME_OVERRIDES[ext]
    }
  }

  // Fall back to Hono's mime type detection
  return honoGetMimeType(filepath) ?? 'application/octet-stream'
}

export function encodeContentDispositionFilename(filename: string) {
  // Properly encode filename for RFC 5987
  const encodedFilename = encodeURIComponent(filename)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
  return encodedFilename
}

/**
 * Determine if a MIME type should be displayed inline or as attachment
 */
export function getContentDisposition({
  mimeType,
  filename,
  inline,
  download
}: {
  mimeType: string
  filename: string
  inline: boolean
  download: boolean
}): string | null {
  const inlineTypes = [
    'image/',
    'video/',
    'audio/',
    'text/',
    'application/pdf',
    'application/json',
    'application/xml'
  ]
  if (download) {
    if (!filename) {
      return 'attachment'
    }
    const encodedFilename = encodeContentDispositionFilename(filename)
    return `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
  }

  if (inline) {
    if (!filename) {
      return 'inline'
    }
    const encodedFilename = encodeContentDispositionFilename(filename)
    return `inline; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
  }
  return null

  // const shouldInline = !download && inlineTypes.some((type) => mimeType.startsWith(type))
  // const disposition = shouldInline ? 'inline' : 'attachment'

  // if (!filename) {
  //   return disposition
  // }

  // return `${disposition}; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
}

/**
 * Check if content type is compressible
 */
export function isCompressibleContentType(contentType: string): boolean {
  const COMPRESSIBLE_CONTENT_TYPE_REGEX =
    /^\s*(?:text\/[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i

  return COMPRESSIBLE_CONTENT_TYPE_REGEX.test(contentType)
}
