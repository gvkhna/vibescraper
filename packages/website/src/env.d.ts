/// <reference types="astro/client" />
/// <reference types="@vibescraper/node-types" />

declare namespace App {
  interface Locals {
    trailingSlashRedirected: boolean | undefined
    canonical: URL | undefined
  }
}
