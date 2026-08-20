import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AppLayout from './layout/AppLayout';
import BuyerLayout from './layout/BuyerLayout';
import SignIn from './pages/AuthPages/SignIn';
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';
import LandingPage from './pages/Public/LandingPage';
import AboutPage from './pages/Public/AboutPage';
import Home from './pages/Dashboard/Home';
import ProductsPage from './pages/Dashboard/ProductsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfiles from './pages/UserProfiles';
import AdminStockManagement from './pages/Admin/AdminStockManagement';
import ShopPage from './pages/Buyer/ShopPage';
import ProductDetailPage from './pages/Buyer/ProductDetailPage';
import CartPage from './pages/Buyer/CartPage';
import CheckoutPage from './pages/Buyer/CheckoutPage';
import NotFound from './pages/OtherPage/NotFound';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
        return <Navigate to="/signin" replace />;
    }

    try {
        const user = JSON.parse(storedUser) as { role?: string };
        if (user.role !== 'ADMIN') {
            return <Navigate to="/shop" replace />;
        }
    } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/explore" element={<Navigate to="/shop" replace />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/signin" element={<SignIn />} />

                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <AppLayout />
                                </AdminRoute>
                            }
                        >
                            <Route index element={<Home />} />
                            <Route path="products" element={<ProductsPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            <Route path="orders" element={<AdminOrdersPage />} />
                            <Route path="stock" element={<AdminStockManagement />} />
                            <Route path="profile" element={<UserProfiles />} />
                        </Route>

                        <Route path="/shop" element={<BuyerLayout />}>
                            <Route index element={<ShopPage />} />
                            <Route path="product/:asin" element={<ProductDetailPage />} />
                            <Route path="cart" element={<CartPage />} />
                            <Route path="checkout" element={<CheckoutPage />} />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
