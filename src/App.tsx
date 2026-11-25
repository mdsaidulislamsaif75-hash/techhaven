import React from 'react';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { CompareModal } from './components/CompareModal';
import { AuthModal } from './components/AuthModal';
import { InvoiceModal } from './components/InvoiceModal';
import { FooterAndSupport } from './components/FooterAndSupport';
import { ToastContainer } from './components/ToastContainer';
import { SplashScreen } from './components/SplashScreen';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailView } from './pages/ProductDetailView';
import { CheckoutView } from './pages/CheckoutView';
import { AccountPortal } from './pages/AccountPortal';

const StorefrontRouter: React.FC = () => {
  const { page } = useStore();

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SplashScreen />
      <Header />
      <main className="flex-1 w-full min-w-0">
        {page === 'home' && <HomePage />}
        {page === 'shop' && <ShopPage />}
        {page === 'product' && <ProductDetailView />}
        {page === 'checkout' && <CheckoutView />}
        {page === 'account' && <AccountPortal />}
      </main>
      <FooterAndSupport />

      {/* Global Drawers & Modals */}
      <CartDrawer />
      <WishlistDrawer />
      <QuickViewModal />
      <CompareModal />
      <AuthModal />
      <InvoiceModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <StoreProvider>
            <StorefrontRouter />
          </StoreProvider>
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
