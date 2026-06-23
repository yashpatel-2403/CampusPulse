import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState((prev) => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-screen bg-red-50 flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-600 text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 max-h-40 overflow-y-auto">
                <summary className="font-mono font-bold cursor-pointer mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="font-mono text-[10px] whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
