import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the ID token for backend verification
      const idToken = await user.getIdToken();
      
      // Send token to backend for verification and to create/update user session
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
          photoURL: user.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend verification failed');
      }

      const data = await response.json();
      
      // Store the token in localStorage for API requests
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('uid', user.uid);
      
      // User is signed in and verified, navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      
      // Handle specific error codes
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else if (error.message === 'Backend verification failed') {
        setError('Failed to verify with backend. Please try again.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              RapidRecall
            </h1>
            <p className="text-gray-600">
              Recall your information faster than ever
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Welcome to RapidRecall!</span>
              <br />
              Sign in with your Google account to get started. We use Google's secure authentication to keep your data safe.
            </p>
          </div>

          <p className="text-xs text-center text-gray-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Having trouble signing in?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
