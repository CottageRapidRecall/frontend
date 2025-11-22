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
      
      // Store the token and role in localStorage for API requests
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('uid', user.uid);
      localStorage.setItem('userRole', data.role || 'user');
      
      // User is signed in and verified -> navigate to dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-cyan-200 to-green-100 p-4">
      {/* Main Container - White Rounded Box */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[550px]">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-start px-6 sm:px- py-20">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 mb-3">
                Log in to Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
              </p>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
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
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {/* Placeholder Buttons */}
            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="#0078D4"/>
              </svg>
              Continue with Microsoft
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Footer */}
            <p className="text-xs text-center text-gray-500 mt-8">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Right Panel - Decorative Image (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-start relative p-8 py-20 bg-blue-200 opacity-90">
          <div className="w-full">
            <h1 className="text-3xl justify-center md:text-4xl font-bold text-white mb-3">
              Welcome to RapidMD!
            </h1>
            <p className="text-gray-700 text-sm md:text-base">
              RapidMD automates medical device recall detection and response, ensuring your organization can identify affected products quickly and take action with confidence.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
