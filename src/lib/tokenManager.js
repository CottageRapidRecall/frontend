import { auth } from './firebase';

/**
 * Get a fresh ID token from Firebase
 * Refreshes the token if needed to ensure it's valid
 * @returns {Promise<string>} Fresh ID token
 */
export async function getFreshIdToken() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }
    
    // Force refresh to ensure token is valid (not expired)
    const token = await user.getIdToken(true);
    localStorage.setItem('idToken', token);
    return token;
  } catch (error) {
    console.error('Error getting fresh ID token:', error);
    throw error;
  }
}

/**
 * Wrapper for API calls that automatically handles token refresh
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithToken(url, options = {}) {
  try {
    const token = await getFreshIdToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('Error in fetchWithToken:', error);
    throw error;
  }
}
