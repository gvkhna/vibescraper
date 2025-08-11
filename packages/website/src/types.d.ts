/// <reference types="astro/client" />
/// <reference lib="dom" />

declare namespace App {
  interface Locals {
    trailingSlashRedirected: boolean | undefined
    canonical: URL | undefined
  }
}

declare global {
  // Remove Node.js timer types
  // @ts-ignore
  export type Timeout = number
  // @ts-ignore
  export type Timer = number

  namespace NodeJS {
    // Override NodeJS timer types
    export interface Timeout extends Number {}
    export interface Timer extends Number {}
  }

  // Declare browser-style timer functions
  function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): number
  function clearTimeout(id?: number): void
  function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): number
  function clearInterval(id?: number): void

  var setTimeout: typeof globalThis.setTimeout
  var clearTimeout: typeof globalThis.clearTimeout
  var setInterval: typeof globalThis.setInterval
  var clearInterval: typeof globalThis.clearInterval
}

export {}
