import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// Error boundary pro production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AstraCore Application Error:', error, errorInfo);
    
    // V production můžeme poslat error do logging service
    if (import.meta.env.PROD) {
      // TODO: Send to logging service
      console.error('Production error logged:', {
        error: error.message,
        stack: error.stack,
        errorInfo
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-astra-500 to-astra-700 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Něco se pokazilo
            </h1>
            <p className="text-gray-600 mb-6">
              Omlouváme se za problémy. Zkuste obnovit stránku.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-astra-500 hover:bg-astra-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Obnovit stránku
            </button>
            {import.meta.env.DEV && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Detaily chyby (dev only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded text-red-600 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Kontrola prostředí
if (import.meta.env.DEV) {
  console.log('🚀 AstraCore Solutions - Development Mode');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Missing');
}

// Kontrola podpory prohlížeče
const checkBrowserSupport = () => {
  const isSupported = 
    'Promise' in window &&
    'fetch' in window &&
    'localStorage' in window &&
    'sessionStorage' in window;
  
  if (!isSupported) {
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>Nepodporovaný prohlížeč</h1>
        <p>AstraCore Solutions vyžaduje moderní prohlížeč. Aktualizujte prosím váš prohlížeč.</p>
      </div>
    `;
    return false;
  }
  return true;
};

// Mount aplikace pouze pokud je prohlížeč podporován
if (checkBrowserSupport()) {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// Service Worker pro PWA (optional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Performance monitoring
if (import.meta.env.PROD) {
  // Monitor aplikačních metrik
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        console.log('Page Load Time:', entry.loadEventEnd - entry.loadEventStart);
      }
    }
  });
  
  observer.observe({ entryTypes: ['navigation'] });
}
