/**
 * Scoped logger — no-op in test environments, console-backed elsewhere.
 *
 * Replaces bare `catch {}` blocks so errors are never completely swallowed.
 * In production, swap `console` for a structured sink (e.g. electron-log).
 */
export interface Logger {
  error(message: string, error?: unknown): void
  warn(message: string, error?: unknown): void
  info(message: string): void
  debug(message: string): void
}

const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'

function format(scope: string, message: string): string {
  return `[${scope}] ${message}`
}

export function createLogger(scope: string): Logger {
  if (isTestEnv) {
    return {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {}
    }
  }

  return {
    error(message, error) {
      // eslint-disable-next-line no-console
      console.error(format(scope, message), error ?? '')
    },
    warn(message, error) {
      // eslint-disable-next-line no-console
      console.warn(format(scope, message), error ?? '')
    },
    info(message) {
      // eslint-disable-next-line no-console
      console.info(format(scope, message))
    },
    debug(message) {
      if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.debug(format(scope, message))
      }
    }
  }
}
