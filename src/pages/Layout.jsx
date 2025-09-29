
import React, { useState } from 'react';
import { AuthProvider } from '@/components/auth/Auth';
import { CartProvider } from '@/components/cart/CartContext';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import SubNavigation from '@/components/layout/SubNavigation';
import Footer from '@/components/layout/Footer';
import { ExchangeRateProvider } from '@/components/utils/ExchangeRateContext';
import AuthModal from '@/components/auth/AuthModal';

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  in: { 
    opacity: 1, 
    y: 0,
    scale: 1
  },
  out: { 
    opacity: 0, 
    y: -20,
    scale: 0.98
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

export default function Layout({ children, currentPageName }) {
  const [isAuthOpen, setAuthOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ExchangeRateProvider>
          <CartProvider>
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => setAuthOpen(false)}
            />
            <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
              <Header
                currentPageName={currentPageName}
                onLoginClick={() => setAuthOpen(true)}
              />
              <SubNavigation />
              
              <main className="flex-1 mobile-safe-bottom">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentPageName || 'page'}
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    style={{ height: '100%' }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </main>
              
              <Footer />
              
              <Toaster 
                position="top-right" 
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }
                }}
              />
            </div>
          </CartProvider>
        </ExchangeRateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
