import type { Session } from 'electron'

type CspOptions = {
  readonly dev: boolean
}

export function buildCspHeader({ dev }: CspOptions): string {
  const scriptSrc = dev
    ? ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'blob:']
    : ["'self'"]

  const connectSrc = dev
    ? ["'self'", 'ws:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*']
    : ["'self'"]

  const directives: readonly (readonly [string, readonly string[]])[] = [
    ['default-src', ["'self'"]],
    ['script-src', scriptSrc],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'blob:']],
    ['font-src', ["'self'", 'data:']],
    ['connect-src', connectSrc],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['frame-ancestors', ["'none'"]]
  ]

  return directives.map(([name, values]) => `${name} ${values.join(' ')}`).join('; ')
}

export function applyCsp(session: Session, options: CspOptions): void {
  const csp = buildCspHeader(options)
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })
}
