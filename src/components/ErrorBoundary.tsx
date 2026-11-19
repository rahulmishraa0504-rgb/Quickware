import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let displayMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed && parsed.error) {
          displayMsg = `${parsed.operationType?.toUpperCase() || 'DATA'} error on ${parsed.path || 'database'}: ${parsed.error}`;
        }
      } catch {
        // Use raw message
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Something went wrong</h2>
            <p className="text-xs text-slate-600 break-words bg-slate-50 p-3 rounded-lg border border-slate-200">
              {displayMsg}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Quickware</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
