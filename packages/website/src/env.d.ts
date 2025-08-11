/// <reference types="astro/client" />
/// <reference lib="dom" />

declare namespace App {
  interface Locals {
    trailingSlashRedirected: boolean | undefined
    canonical: URL | undefined
  }
}
