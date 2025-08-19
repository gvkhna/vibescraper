/// <reference types="astro/client" />
/// <reference types="@scrapeloop/node-types" />

declare namespace App {
  interface Locals {
    trailingSlashRedirected: boolean | undefined
    canonical: URL | undefined
  }
}
