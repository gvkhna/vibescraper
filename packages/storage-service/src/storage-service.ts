import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException
} from '@aws-sdk/client-s3'
import { FetchHttpHandler } from '@smithy/fetch-http-handler'
import type { BrowserClient } from '@smithy/types'
import type { Context } from 'hono'
import fs from 'node:fs'
import { dirname as pathDirname, isAbsolute, join as pathJoin, resolve as pathResolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { hashBytes } from './hash-bytes'
import { serveStatic } from './serve-static'
import { serveStream } from './serve-stream'
import {
  brotliCompressBytes,
  brotliCompressBytesSync,
  gzipCompressBytes,
  gzipCompressBytesSync
} from './zlib-utils'

export type Logger = (...args: unknown[]) => void

/** Error codes for storage operations */
export enum StorageErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  FAILED = 'FAILED'
}

/** Storage operation result */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: StorageErrorCode; message: string }

/** Helper to create success result */
function ok<T>(data: T): StorageResult<T> {
  return { success: true, data }
}

/** Helper to create error result */
function err<T>(error: StorageErrorCode, message: string): StorageResult<T> {
  return { success: false, error, message }
}

/** Configuration for filesystem storage backend */
export interface FilesystemStorageConfig {
  STORAGE_PROVIDER: 'filesystem'
  /** Base directory path where files will be stored Should be an absolute path */
  STORAGE_BASE_PATH: string | URL
  /** Optional public URL prefix for serving files e.g., "https://cdn.example.com" or R2 public bucket URL */
  // STORAGE_PUBLIC_URL_PREFIX?: string
  /** Default cache control header for uploaded objects */
  STORAGE_CACHE_CONTROL_HEADER?: string
}

/** Configuration for S3/bucket storage backend */
export interface BucketStorageConfig {
  STORAGE_PROVIDER: 'bucket'
  /** S3 bucket name */
  STORAGE_BUCKET_NAME: string
  /** S3 region (e.g., 'us-east-1', 'auto' for R2) */
  STORAGE_REGION?: string
  /** S3 endpoint URL (for S3-compatible services like R2, MinIO) */
  STORAGE_ENDPOINT: string
  /** AWS access key ID */
  STORAGE_ACCESS_KEY_ID?: string
  /** AWS secret access key */
  STORAGE_SECRET_ACCESS_KEY?: string
  /** Use path-style addressing (for S3-compatible services) */
  STORAGE_FORCE_PATH_STYLE?: boolean | string
  /** Optional public URL prefix for serving files e.g., "https://cdn.example.com" or R2 public bucket URL */
  // STORAGE_PUBLIC_URL_PREFIX?: string
  /** Default cache control header for uploaded objects */
  STORAGE_CACHE_CONTROL_HEADER?: string
}

/** Union type for storage configuration */
export type StorageConfig = FilesystemStorageConfig | BucketStorageConfig

/** Options for retrieving a file */
// export interface GetFileOptions {
//   /**
//    * Whether to return as stream instead of buffer
//    */
//   asStream?: boolean
//   /**
//    * Range of bytes to retrieve (for partial content)
//    */
//   range?: {
//     start: number
//     end?: number
//   }
// }

/** Metadata about stored file This interface aligns with ServeOptions for consistency */
export interface FileMetadata {
  /** Storage key for the file */
  key: string
  /** Original filename */
  filename: string
  /** File size in bytes */
  filesize: number
  /** MIME type */
  mimeType: string
  /** SHA256 hash of file content */
  hash: string
  /** Upload timestamp */
  lastModified: Date
  encoding: null | 'gzip' | 'br'
}

/** Options for serving stored bytes via HTTP These can be derived from FileMetadata or provided separately */
export interface ServeOptions {
  /** Force download with Content-Disposition header */
  download: boolean
  /** Force inline display */
  inline: boolean
  /** Cache Control header */
  cacheControl?: string
}

/** Main storage service class that handles both filesystem and bucket storage */
export class StorageService {
  private config: StorageConfig
  private s3Client?: S3Client
  private basePath?: string
  private log: Logger

  constructor(config: StorageConfig, logger?: Logger) {
    this.config = config
    this.log = logger ?? (() => {})
    this.initialize()
  }

  /** Initialize the storage service based on configuration */
  private initialize(): void {
    // Implementation will set up S3 client if using bucket storage
    // and ensure filesystem directories exist if using filesystem
    if (this.config.STORAGE_PROVIDER === 'bucket') {
      this.log(`Storage: S3/Bucket mode - endpoint: ${this.config.STORAGE_ENDPOINT}`)

      // AWS S3 / Cloudflare R2 Configuration
      this.s3Client = new S3Client({
        region: this.config.STORAGE_REGION ?? 'auto',
        endpoint: this.config.STORAGE_ENDPOINT,
        credentials: {
          accessKeyId: this.config.STORAGE_ACCESS_KEY_ID ?? '',
          secretAccessKey: this.config.STORAGE_SECRET_ACCESS_KEY ?? ''
        },
        forcePathStyle:
          typeof this.config.STORAGE_FORCE_PATH_STYLE === 'boolean'
            ? this.config.STORAGE_FORCE_PATH_STYLE
            : typeof this.config.STORAGE_FORCE_PATH_STYLE === 'string'
              ? this.config.STORAGE_FORCE_PATH_STYLE === 'true'
              : false,
        requestHandler: new FetchHttpHandler({})
      }) as BrowserClient<S3Client>
    } else {
      const filePath =
        this.config.STORAGE_BASE_PATH instanceof URL
          ? fileURLToPath(this.config.STORAGE_BASE_PATH)
          : this.config.STORAGE_BASE_PATH
      if (!isAbsolute(filePath)) {
        this.basePath = pathResolve(filePath)
      } else {
        this.basePath = filePath
      }

      if (this.basePath) {
        this.log(`Storage: Filesystem mode - path: ${this.basePath}`)
      } else {
        this.log(`ERROR: Storage: Filesystem mode - STORAGE_BASE_PATH not set`)
      }

      // Ensure base directory exists for filesystem storage
      if (!fs.existsSync(this.basePath)) {
        try {
          fs.mkdirSync(this.basePath, { recursive: true })
          this.log(`Storage: Created base directory`)
        } catch (error) {
          this.log(`Storage: Warning - could not create base directory: ${error}`)
        }
      }
    }
  }

  /** Get the storage type */
  public getStorageType(): StorageConfig['STORAGE_PROVIDER'] {
    return this.config.STORAGE_PROVIDER
  }

  /** Get the base path (for filesystem) or bucket name (for S3) */
  public getStorageLocation() {
    if (this.config.STORAGE_PROVIDER === 'filesystem') {
      return this.basePath
    }
    return null
  }

  private keyToPath(key: string): string {
    // aa/xx/yy/full-uuid
    return pathJoin(key.slice(0, 2), key.slice(2, 4), key.slice(4, 6), key)
  }

  /** Generate a new storage key and its path */
  private generateKey(): { key: string; path: string } {
    // Remove dashes and lowercase
    const uuid = globalThis.crypto.randomUUID().replace(/-/g, '').toLowerCase()
    return {
      key: uuid,
      path: this.keyToPath(uuid)
    }
  }

  /** Store bytes and return a storage key */
  private async store(
    bytes: Uint8Array,
    compress: boolean | 'gzip' | 'br' = false
    // options?: StoreFileOptions
  ): Promise<StorageResult<string>> {
    // Validate input
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!bytes) {
      return err(StorageErrorCode.FAILED, 'No data provided to store')
    }

    // Check if it's actually a Uint8Array
    if (!(bytes instanceof Uint8Array)) {
      return err(StorageErrorCode.FAILED, 'Data must be a Uint8Array')
    }

    // Check for empty data
    if (bytes.length === 0) {
      return err(StorageErrorCode.FAILED, 'Cannot store empty data')
    }

    // Sanity check - make sure we can actually read the data
    try {
      // Try to create a new Uint8Array from it - this will fail if the buffer is corrupted
      const testBytes = new Uint8Array(bytes)

      // Extra sanity check - make sure length matches
      if (testBytes.length !== bytes.length) {
        return err(StorageErrorCode.FAILED, 'Data corruption detected: length mismatch')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return err(StorageErrorCode.FAILED, `Invalid data format: ${message}`)
    }

    const { key, path } = this.generateKey()

    if (this.config.STORAGE_PROVIDER === 'bucket') {
      if (!this.s3Client) {
        return err(StorageErrorCode.FAILED, 'S3 client not initialized')
      }

      let saveBytes: Uint8Array | null = null
      if (compress === true || compress === 'br') {
        saveBytes = await brotliCompressBytes(bytes)
      } else if (compress === 'gzip') {
        saveBytes = await gzipCompressBytes(bytes)
      } else {
        saveBytes = bytes
      }
      const command = new PutObjectCommand({
        Bucket: this.config.STORAGE_BUCKET_NAME,
        Key: path,
        Body: saveBytes,
        // ContentType: contentType,
        CacheControl: this.config.STORAGE_CACHE_CONTROL_HEADER
      })

      try {
        await this.s3Client.send(command)
        this.log(`Storage: Stored ${saveBytes.length} bytes -> ${key} (S3)`)
        return ok(key)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.log(`Storage: Failed to store ${key} (S3) - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    } else if (this.basePath) {
      const filePath = pathJoin(this.basePath, path)
      try {
        let saveBytes: Uint8Array | null = null
        if (compress === true || compress === 'br') {
          saveBytes = brotliCompressBytesSync(bytes)
        } else if (compress === 'gzip') {
          saveBytes = gzipCompressBytesSync(bytes)
        } else {
          saveBytes = bytes
        }
        fs.mkdirSync(pathDirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, saveBytes)
        this.log(`Storage: Stored ${saveBytes.length} bytes -> ${key}`)
        return ok(key)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.log(`Storage: Failed to store ${key} - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    }

    return err(StorageErrorCode.FAILED, 'Storage provider not configured')
  }

  public async storeBytesMetadata(
    bytes: Uint8Array,
    meta: Pick<Partial<FileMetadata>, 'filename' | 'mimeType'>,
    compress: boolean | 'br' | 'gzip' = false
  ): Promise<StorageResult<FileMetadata>> {
    try {
      const storeResult = await this.store(bytes, compress)
      if (!storeResult.success) {
        return err(storeResult.error, storeResult.message)
      }

      // Generate metadata that matches what's needed for both DB storage and serving
      const metadata: FileMetadata = {
        key: storeResult.data,
        filename: meta.filename ?? 'attachment',
        filesize: bytes.length,
        mimeType: meta.mimeType ?? 'application/octet-stream',
        hash: hashBytes(bytes),
        lastModified: new Date(),
        encoding: compress === true ? 'br' : compress === false ? null : compress
      }

      this.log(`Storage: Stored file "${metadata.filename}" (${metadata.filesize} bytes) -> ${metadata.key}`)
      return ok(metadata)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.log(`Storage: Failed to store file - ${message}`)
      return err(StorageErrorCode.FAILED, `Failed to store file: ${message}`)
    }
  }

  /**
   * Store a File object (from multipart upload) with metadata extraction This is a convenience method that
   * handles the complete upload workflow
   */
  public async storeFile(
    file: File,
    compress: boolean | 'br' | 'gzip' = false
  ): Promise<StorageResult<FileMetadata>> {
    // Validate input is actually a File
    if (!(file instanceof File)) {
      this.log('Storage: Invalid input - not a File object')
      return err(StorageErrorCode.FAILED, 'Input must be a File object')
    }

    try {
      // Convert File to bytes
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Store the bytes
      const storeResult = await this.store(bytes, compress)
      if (!storeResult.success) {
        return err(storeResult.error, storeResult.message)
      }

      // Generate metadata that matches what's needed for both DB storage and serving
      const metadata: FileMetadata = {
        key: storeResult.data,
        filename: file.name,
        filesize: file.size,
        mimeType: file.type || 'application/octet-stream',
        hash: hashBytes(bytes),
        lastModified: file.lastModified ? new Date(file.lastModified) : new Date(),
        encoding: compress === true ? 'br' : compress === false ? null : compress
      }

      this.log(`Storage: Stored file "${metadata.filename}" (${metadata.filesize} bytes) -> ${metadata.key}`)
      return ok(metadata)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.log(`Storage: Failed to store file - ${message}`)
      return err(StorageErrorCode.FAILED, `Failed to store file: ${message}`)
    }
  }

  /** Retrieve bytes using a storage key */
  public async retrieve(
    key: string,
    decompress: boolean | 'br' | 'gzip' = false
  ): Promise<StorageResult<Uint8Array>> {
    const storagePath = this.keyToPath(key)

    if (this.config.STORAGE_PROVIDER === 'bucket') {
      if (!this.s3Client) {
        return err(StorageErrorCode.FAILED, 'S3 client not initialized')
      }

      const command = new GetObjectCommand({
        Bucket: this.config.STORAGE_BUCKET_NAME,
        Key: storagePath
      })

      try {
        const response = await this.s3Client.send(command)

        if (!response.Body) {
          return err(StorageErrorCode.FAILED, 'No body in S3 response')
        }
        const bytes = await response.Body.transformToByteArray()
        this.log(`Storage: Retrieved ${bytes.length} bytes <- ${key} (S3)`)
        return ok(bytes)
      } catch (error) {
        // Check for S3 NotFound using instanceof and status code
        if (error instanceof S3ServiceException && error.$response?.statusCode === 404) {
          this.log(`Storage: File not found - ${key} (S3)`)
          return err(StorageErrorCode.NOT_FOUND, `File not found: ${key}`)
        }
        const message = error instanceof Error ? error.message : String(error)
        this.log(`Storage: Failed to retrieve ${key} (S3) - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    } else if (this.basePath) {
      const filePath = pathJoin(this.basePath, storagePath)

      try {
        const buffer = fs.readFileSync(filePath)
        const bytes = new Uint8Array(buffer)
        this.log(`Storage: Retrieved ${bytes.length} bytes <- ${key}`)
        return ok(bytes)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        // Check for filesystem not found using error code
        if (
          typeof error === 'object' &&
          error &&
          'code' in error &&
          typeof error.code === 'string' &&
          error.code === 'ENOENT'
        ) {
          this.log(`Storage: File not found - ${key}`)
          return err(StorageErrorCode.NOT_FOUND, `File not found: ${key}`)
        }
        this.log(`Storage: Failed to retrieve ${key} - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    }

    return err(StorageErrorCode.FAILED, 'Storage provider not configured')
  }

  /** Stream bytes using a storage key */
  public async stream(
    key: string,
    decompress: boolean | 'gzip' | 'br' = false
  ): Promise<StorageResult<ReadableStream<Uint8Array>>> {
    const storagePath = this.keyToPath(key)

    if (this.config.STORAGE_PROVIDER === 'bucket') {
      if (!this.s3Client) {
        return err(StorageErrorCode.FAILED, 'S3 client not initialized')
      }

      const command = new GetObjectCommand({
        Bucket: this.config.STORAGE_BUCKET_NAME,
        Key: storagePath
      })

      try {
        const response = await this.s3Client.send(command)
        if (!response.Body) {
          return err(StorageErrorCode.FAILED, 'No body in S3 response')
        }
        this.log(`Storage: Created stream <- ${key} (S3)`)
        let returnStream: ReadableStream | null = null
        if (decompress === true || decompress === 'br') {

        } else if (decompress === 'gzip') {
          returnStream =
        } else {
          returnStream = response.Body.transformToWebStream()
        }
        return ok(returnStream)
      } catch (error) {
        // Check for S3 NotFound using instanceof and status code
        if (error instanceof S3ServiceException && error.$response?.statusCode === 404) {
          this.log(`Storage: File not found for stream - ${key} (S3)`)
          return err(StorageErrorCode.NOT_FOUND, `File not found: ${key}`)
        }
        const message = error instanceof Error ? error.message : String(error)
        this.log(`Storage: Failed to create stream for ${key} (S3) - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    } else if (this.basePath) {
      const filePath = pathJoin(this.basePath, storagePath)

      try {
        const buffer = fs.readFileSync(filePath)
        const bytes = new Uint8Array(buffer)
        let offset = 0
        // const stream = bytesToStream(bytes)
        const stream = new ReadableStream<typeof bytes>({
          pull(controller) {
            // Send the whole buffer as a single chunk
            if (offset < bytes.length) {
              controller.enqueue(bytes)
              offset = bytes.length
            }
            controller.close()
          }
        })
        this.log(`Storage: Created stream for ${bytes.length} bytes <- ${key}`)
        return ok(stream)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        // Check for filesystem not found using error code
        if (
          typeof error === 'object' &&
          error &&
          'code' in error &&
          typeof error.code === 'string' &&
          error.code === 'ENOENT'
        ) {
          this.log(`Storage: File not found for stream - ${key}`)
          return err(StorageErrorCode.NOT_FOUND, `File not found: ${key}`)
        }
        this.log(`Storage: Failed to create stream for ${key} - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    }

    return err(StorageErrorCode.FAILED, 'Storage provider not configured')
  }

  /** Get file information without retrieving content */
  // public async getFileInfo(key: string): Promise<FileInfo | null> {
  //   // Implementation will get metadata from filesystem or S3
  //   throw new Error('Not implemented')
  // }

  /** Check if a file exists */
  // public async fileExists(key: string): Promise<boolean> {
  //   // Implementation will check existence in filesystem or S3
  //   throw new Error('Not implemented')
  // }

  /** Delete stored bytes using a storage key */
  public async delete(key: string): Promise<StorageResult<void>> {
    const storagePath = this.keyToPath(key)

    if (this.config.STORAGE_PROVIDER === 'bucket') {
      if (!this.s3Client) {
        return err(StorageErrorCode.FAILED, 'S3 client not initialized')
      }

      // For S3, we need to check if file exists first since S3 delete is always "successful"
      try {
        // First check if the file exists
        const getCommand = new GetObjectCommand({
          Bucket: this.config.STORAGE_BUCKET_NAME,
          Key: storagePath
        })

        try {
          await this.s3Client.send(getCommand)
        } catch (error) {
          // Check for S3 NotFound using instanceof and status code
          if (error instanceof S3ServiceException && error.$response?.statusCode === 404) {
            this.log(`Storage: File not found for delete - ${key} (S3)`)
            return err(StorageErrorCode.NOT_FOUND, `File not found: ${key}`)
          }
          // Other errors during check
          const message = error instanceof Error ? error.message : String(error)
          this.log(`Storage: Failed to check ${key} before delete (S3) - ${message}`)
          return err(StorageErrorCode.FAILED, message)
        }

        // File exists, now delete it
        const deleteCommand = new DeleteObjectCommand({
          Bucket: this.config.STORAGE_BUCKET_NAME,
          Key: storagePath
        })
        await this.s3Client.send(deleteCommand)
        this.log(`Storage: Deleted ${key} (S3)`)
        // eslint-disable-next-line no-undefined
        return ok(undefined)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.log(`Storage: Failed to delete ${key} (S3) - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    } else if (this.basePath) {
      const filePath = pathJoin(this.basePath, storagePath)

      try {
        fs.unlinkSync(filePath)
        this.log(`Storage: Deleted ${key}`)
        // eslint-disable-next-line no-undefined
        return ok(undefined)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        // Check for filesystem not found using error code
        if (
          typeof error === 'object' &&
          error &&
          'code' in error &&
          typeof error.code === 'string' &&
          error.code === 'ENOENT'
        ) {
          this.log(`Storage: File not found for delete - ${key}`)
          return err(StorageErrorCode.NOT_FOUND, `File not found: ${key}`)
        }

        this.log(`Storage: Failed to delete ${key} - ${message}`)
        return err(StorageErrorCode.FAILED, message)
      }
    }

    return err(StorageErrorCode.FAILED, 'Storage provider not configured')
  }

  /** Generate a public URL for a file (if configured) */
  // public getPublicUrl(key: string): string | null {
  //   // Implementation will generate URL based on config
  //   throw new Error('Not implemented')
  // }

  /** Generate a signed URL for temporary access (S3 only) */
  // public async getSignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
  //   // Implementation will generate presigned URL for S3
  //   throw new Error('Not implemented')
  // }

  /** Create Hono app with storage endpoints */
  // private createHonoApp(): Hono {
  //   // Implementation will create Hono routes for:
  //   // - GET /blob/:key - Retrieve file
  //   // - POST /upload - Upload file
  //   // - DELETE /blob/:key - Delete file
  //   // - GET /info/:key - Get file info
  //   // throw new Error('Not implemented')
  // }

  /**
   * Serve stored bytes as HTTP response with FileMetadata Convenience overload that accepts FileMetadata
   * directly
   */
  public async serveWithMetadata(c: Context, metadata: FileMetadata): Promise<Response> {
    return this.serve(c, metadata.key, {
      filename: metadata.filename,
      filesize: metadata.filesize,
      mimeType: metadata.mimeType,
      hash: metadata.hash,
      lastModified: metadata.lastModified
    })
  }

  /** Serve stored bytes as HTTP response */
  public async serve(
    c: Context,
    key: string,
    metadata?: Partial<FileMetadata>,
    options?: Partial<ServeOptions>
  ): Promise<Response> {
    const storagePath = this.keyToPath(key)

    const { download: queryDownload, inline: queryInline, filename: queryFilename } = c.req.query()

    const download = options?.download ?? !(queryDownload === '0' || queryDownload === 'false')
    const inline = options?.inline ?? !(queryInline === '0' || queryInline === 'false')

    const filename =
      typeof metadata?.filename === 'string' && metadata.filename
        ? metadata.filename
        : queryFilename
          ? queryFilename
          : key
    const filesize = metadata?.filesize
    const mimeType = metadata?.mimeType
    const hash = metadata?.hash
    const lastModified = metadata?.lastModified

    if (this.config.STORAGE_PROVIDER === 'bucket') {
      const result = await this.stream(key)
      if (result.success) {
        return serveStream(
          c,
          result.data,
          {
            filename,
            filesize,
            mimeType,
            lastModified,
            hash
          },
          {
            download,
            inline,
            cacheControl: this.config.STORAGE_CACHE_CONTROL_HEADER
          }
        )
      } else {
        // Return appropriate HTTP status based on error type
        if (result.error === StorageErrorCode.NOT_FOUND) {
          this.log(`Storage: HTTP 404 - ${key} not found`)
          return c.notFound()
        }
        // All other errors return 500
        this.log(`Storage: HTTP 500 - Failed to serve ${key}: ${result.message}`)
        return c.text('Internal server error', 500)
      }
    } else if (this.basePath) {
      const filePath = pathJoin(this.basePath, storagePath)

      // Check if file exists first for better error handling
      if (!fs.existsSync(filePath)) {
        this.log(`Storage: HTTP 404 - ${key} not found (filesystem)`)
        return c.notFound()
      }

      try {
        return serveStatic(
          c,
          filePath,
          {
            filename,
            filesize,
            mimeType,
            lastModified,
            hash
          },
          {
            download,
            inline,
            cacheControl: this.config.STORAGE_CACHE_CONTROL_HEADER
          }
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.log(`Storage: HTTP 500 - Failed to serve ${key} (filesystem): ${message}`)
        return c.text('Internal server error', 500)
      }
    }

    // Storage provider not configured
    return c.text('Storage not configured', 500)
  }

  /** Handle file upload from Hono request */
  // public async handleUpload(
  //   c: any // Hono context type
  // ): Promise<StoreFileResult> {
  //   // Implementation will parse multipart and store file
  //   throw new Error('Not implemented')
  // }

  /** Clean up resources (close connections, etc.) */
  public async cleanup(): Promise<void> {
    if (this.s3Client) {
      this.s3Client.destroy()
    }
  }
}
