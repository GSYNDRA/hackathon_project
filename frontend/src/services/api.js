// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const registerUser = async (walletAddress, role) => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: walletAddress,
      role: role
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to register user');
  }
  
  return response.json();
};

export const getUserRole = async (walletAddress) => {
  const response = await fetch(`${API_URL}/users/${walletAddress}/role`);
  return response.json();
};
