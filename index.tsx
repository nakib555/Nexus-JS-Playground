import React, { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Robust Error Boundary to prevent "White Screen of Death"
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state to satisfy strict type checking
  public state: ErrorBoundaryState = { hasError: false, error: null };

  // Fix: Explicitly declare 'props' property to resolve TypeScript error.
  // This is usually inherited from React.Component, but sometimes
  // TypeScript inference can be tricky in specific environments,
  // leading to the "Property 'props' does not exist" error.
  public readonly props: Readonly<ErrorBoundaryProps>;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-red-400 p-8 font-mono text-center">
          <div className="bg-red-950/20 p-4 rounded-full mb-6 ring-1 ring-red-500/20">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2 text-red-200">Application Crashed</h1>
          <p className="text-sm text-gray-500 mb-6 max-w-md">Something went wrong while rendering the UI. Please check the console for more details.</p>
          <pre className="bg-gray-900 px-6 py-4 rounded-lg border border-red-900/30 text-xs text-left overflow-auto max-w-2xl w-full shadow-xl">
            {this.state.error?.toString()}
            {this.state.error?.stack && (
              <span className="block mt-4 text-gray-600 opacity-50 border-t border-gray-800 pt-4">
                {this.state.error.stack}
              </span>
            )}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = createRoot(rootElement);

// Clean up loader immediately before rendering
const loader = document.getElementById('loading-overlay');
if (loader) {
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 500);
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);