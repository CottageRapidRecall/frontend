import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
// import { Documents } from './pages/Documents';

// Helper function to get page title based on route
function getPageTitle(pathname, user, userRole) {
  if (!user) {
    return 'RapidMD - Login';
  }

  switch (pathname) {
    case '/':
      return userRole === 'admin' ? 'RapidMD - Admin Dashboard' : 'RapidMD - Dashboard';
    case '/admin/users':
      return 'RapidMD - Manage Users';
    case '/documents':
      return 'RapidMD - Documents';
    default:
      return 'RapidMD';
  }
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const location = useLocation();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verify and refresh user role from backend when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      const refreshUserRole = async () => {
        try {
          const idToken = localStorage.getItem('idToken');
          if (!idToken) return;

          const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: idToken,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const newRole = data.role || 'user';
            
            // Update localStorage and state if role changed
            if (newRole !== userRole) {
              localStorage.setItem('userRole', newRole);
              setUserRole(newRole);
            }
          }
        } catch (error) {
          console.error('Error refreshing user role:', error);
        }
      };

      refreshUserRole();
      // Refresh role every 30 seconds to catch any admin privilege changes
      const interval = setInterval(refreshUserRole, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading]);

  // Update page title based on route and authentication state
  useEffect(() => {
    if (!loading) {
      document.title = getPageTitle(location.pathname, user, userRole);
    }
  }, [user, loading, location.pathname, userRole]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear user data from localStorage
      localStorage.removeItem('idToken');
      localStorage.removeItem('uid');
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Redirect to regular dashboard if user is on admin route but no longer has admin role
  if (location.pathname.startsWith('/admin') && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route 
            path="/" 
            element={userRole === 'admin' ? <AdminDashboard /> : <Dashboard />} 
          />
          <Route 
            path="/admin/users" 
            element={userRole === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />} 
          />
          {/* <Route path="/documents" element={<Documents user={user} />} /> */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
