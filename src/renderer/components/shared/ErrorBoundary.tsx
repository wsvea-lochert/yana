import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
  readonly fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  readonly error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Intentionally surfaced via console.error so devtools picks it up.
    // eslint-disable-next-line no-console
    console.error('Unhandled render error', error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }
      return (
        <div
          role="alert"
          style={{
            padding: '2rem',
            maxWidth: 520,
            margin: '4rem auto',
            fontFamily: 'system-ui, sans-serif',
            color: 'var(--foreground)'
          }}
        >
          <h1 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: '1rem', opacity: 0.75 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            Reload window
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
