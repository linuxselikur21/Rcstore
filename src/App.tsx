import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartDrawer } from './components/CartDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { SearchOverlay } from './components/SearchOverlay';
import { ToastContainer } from './components/ToastContainer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { StoreProvider } from './context/StoreContext';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <div className="min-h-screen flex flex-col bg-white text-zinc-950">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/login" element={<AccountPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
            <Footer />
            <CartDrawer />
            <WishlistDrawer />
            <SearchOverlay />
            <ToastContainer />
          </div>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
