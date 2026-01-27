import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getFreshIdToken } from './lib/tokenManager';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { RecallsDatabase } from './pages/RecallsDatabase';
import { Login } from './pages/Login';
import { Documents } from './pages/Documents';

// Helper function to get page title based on route
function getPageTitle(pathname, user) {
  if (!user) {
    return 'RapidRecall - Login';
  }

  switch (pathname) {
    case '/':
      return 'RapidRecall - Dashboard';
    case '/admin/users':
      return 'RapidRecall - Manage Users';
    case '/admin/recalls':
      return 'RapidRecall - Manage Recalls';
    case '/my-recalls':
      return 'RapidRecall - My Recalls';
    case '/documents':
      return 'RapidRecall - Documents';
    default:
      return 'RapidRecall';
  }
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const location = useLocation();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Refresh ID token to ensure it's valid
        try {
          const newToken = await user.getIdToken(true);
          localStorage.setItem('idToken', newToken);
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verify user role from backend on login
  useEffect(() => {
    if (user && !loading) {
      const verifyUserRole = async () => {
        try {
          const idToken = await getFreshIdToken();

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
            localStorage.setItem('userRole', newRole);
            setUserRole(newRole);
          } else if (response.status === 401) {
            console.error('Token expired or invalid, user needs to re-login');
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error verifying user role:', error);
        }
      };

      verifyUserRole();
    }
  }, [user, loading]);

  // Update page title based on route and authentication state
  useEffect(() => {
    if (!loading) {
      document.title = getPageTitle(location.pathname, user);
    }
  }, [user, loading, location.pathname]);

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

  // Redirect to dashboard if non-admin tries to access admin panel
  if (location.pathname.startsWith('/admin') && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} userRole={userRole} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={userRole === 'admin' ? <AdminDashboard /> : <Dashboard />} />
          <Route 
            path="/admin/users" 
            element={userRole === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/admin/recalls" 
            element={userRole === 'admin' ? <RecallsDatabase /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/my-recalls" 
            element={userRole !== 'admin' ? <RecallsDatabase /> : <Navigate to="/admin/recalls" replace />} 
          />
          <Route path="/documents" element={<Documents user={user} />} />
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
