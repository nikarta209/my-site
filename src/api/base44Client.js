import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "687cff323bca1e91d67e5f14", 
  requiresAuth: true // Ensure authentication is required for all operations
});
