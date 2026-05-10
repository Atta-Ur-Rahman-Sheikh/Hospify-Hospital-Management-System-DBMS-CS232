import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
        <div className="max-w-md w-full bg-ink-800 rounded-2xl border border-ink-500/60 shadow-2xl p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-danger-500/15 ring-1 ring-danger-500/30 flex items-center justify-center mb-5">
            <AlertTriangle className="h-7 w-7 text-danger-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-200">
            An unexpected error occurred. Try refreshing the page — your session is still safe.
          </p>
          {this.state.error?.message && (
            <pre className="mt-4 p-3 bg-ink-900 border border-ink-500/40 rounded-lg text-left text-xs text-ink-100 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
