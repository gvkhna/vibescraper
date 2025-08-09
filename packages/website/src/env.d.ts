/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    trailingSlashRedirected: boolean | undefined
    canonical: URL | undefined
  }
}
