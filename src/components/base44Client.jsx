// Environment variables для Railway (используем import.meta.env для Vite)
const APP_ID = import.meta.env.VITE_APP_ID || 'kasbook-app';
const N8N_URL = import.meta.env.VITE_N8N_URL || 'https://n8n.kasbook.io';
const THEME_DEFAULT = import.meta.env.VITE_THEME_DEFAULT || 'dark';
const IS_PRODUCTION = import.meta.env.PROD;

import { createClient } from '@/api/integrations';

// Auto-detect theme preference
const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEME_DEFAULT;
  
  // Check user's system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return THEME_DEFAULT;
};

// Initialize theme
const initializeTheme = () => {
  if (typeof window === 'undefined') return THEME_DEFAULT;
  
  const savedTheme = localStorage.getItem('kasbook-ui-theme');
  if (savedTheme) return savedTheme;
  
  const systemTheme = getSystemTheme();
  localStorage.setItem('kasbook-ui-theme', systemTheme);
  return systemTheme;
};

// Base44 Client Configuration
const clientConfig = {
  appId: APP_ID,
  requiresAuth: true,
  debug: !IS_PRODUCTION,
  theme: initializeTheme(),
  features: {
    realtime: true,
    caching: true,
    offline: false,
    analytics: IS_PRODUCTION
  }
};

// Health check function для Railway
export const healthCheck = async () => {
  try {
    // Test database connection
    const { Book } = await import('@/api/entities');
    const testQuery = await Book.list('-created_date', 1);
    
    // Test integrations
    const { InvokeLLM } = await import('@/api/integrations');
    const integrationTest = await InvokeLLM({
      prompt: 'Health check test',
      response_json_schema: {
        type: 'object',
        properties: {
          status: { type: 'string' }
        }
      }
    });

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      integrations: 'healthy',
      theme: clientConfig.theme,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: IS_PRODUCTION ? 'production' : 'development'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error(`Health check failed: ${error.message}`);
  }
};

// Theme management
export const themeManager = {
  get current() {
    return initializeTheme();
  },
  
  set(theme) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kasbook-ui-theme', theme);
      document.documentElement.classList.remove('light', 'dark', 'sepia');
      document.documentElement.classList.add(theme);
      
      // Dispatch event for components to listen
      window.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
    }
  },
  
  toggle() {
    const current = this.current;
    const next = current === 'dark' ? 'light' : 'dark';
    this.set(next);
    return next;
  },
  
  watchSystem() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        // Only auto-switch if user hasn't manually set a theme
        const savedTheme = localStorage.getItem('kasbook-ui-theme');
        if (!savedTheme) {
          const systemTheme = e.matches ? 'dark' : 'light';
          this.set(systemTheme);
        }
      };
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }
    }
  }
};

// N8N integration helper
export const n8nClient = {
  baseUrl: N8N_URL,
  
  async webhook(path, data) {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('N8N webhook error:', error);
      if (IS_PRODUCTION) {
        throw error;
      }
      // Return mock data in development
      return { success: true, mock: true, data: null };
    }
  }
};

// Performance monitoring
export const performanceMonitor = {
  startTime: Date.now(),
  
  mark(name) {
    if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  },
  
  measure(name, startMark, endMark) {
    if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  },
  
  getMetrics() {
    if (typeof window === 'undefined') return null;
    
    return {
      loadTime: Date.now() - this.startTime,
      memory: window.performance && window.performance.memory ? {
        used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }
};

// Export configuration for other modules
export const config = {
  APP_ID,
  N8N_URL,
  THEME_DEFAULT,
  IS_PRODUCTION,
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0'
};

// Initialize theme watcher on module load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      themeManager.watchSystem();
      performanceMonitor.mark('app-initialized');
    });
  } else {
    themeManager.watchSystem();
    performanceMonitor.mark('app-initialized');
  }
}

// Global error handling for production
if (IS_PRODUCTION && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // В production можно отправлять в сервис аналитики
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // В production можно отправлять в сервис аналитики
  });
}

export default config;