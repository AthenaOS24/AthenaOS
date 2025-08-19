// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import layouts and pages
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { TeamPage } from './pages/TeamPage';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { useAuthStore } from './context/authStore';
import { Navigate } from 'react-router-dom';
import { ContactPage } from './pages/ContactPage'; 

// Import your new pages
import Blog from './pages/Blog';
import { ServicesPage } from './pages/ServicePage'; // ✅ Import ServicesPage

// Component to handle redirect if already logged in
function GuestRoute() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return isAuthenticated ? <Navigate to="/chat" replace /> : <MainLayout />;
}

function App() {
  return (
    <BrowserRouter>
        <Routes>
            {/* Public routes rendered inside MainLayout */}
            <Route element={<GuestRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/services" element={<ServicesPage />} /> {/* ✅ Added services route */}
                <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Private chat route rendered inside its own layout */}
            <Route element={<ProtectedRoute />}>
                <Route path="/chat" element={<ChatPage />} />
            </Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
