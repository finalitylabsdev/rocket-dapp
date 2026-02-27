import { Component, type ErrorInfo, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  onNavigateHome?: () => void;
  resetKey?: string;
  sectionLabel: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Route section failed to render (${this.props.sectionLabel}):`, error, errorInfo);
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps): void {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="max-w-3xl mx-auto p-6"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid rgba(239,68,68,0.28)',
          }}
        >
          <p className="font-mono font-black text-sm uppercase tracking-wider text-text-primary">
            Section Unavailable
          </p>
          <p className="mt-3 text-sm font-mono text-text-secondary">
            {this.props.sectionLabel} hit a render error. The rest of the app is still available.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {this.props.onNavigateHome && (
              <button
                onClick={this.props.onNavigateHome}
                className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider"
                style={{
                  background: 'rgba(148,163,184,0.08)',
                  border: '1px solid rgba(148,163,184,0.28)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Return Home
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.28)',
                color: '#FCA5A5',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      </section>
    );
  }
}
