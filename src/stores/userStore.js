// src/stores/userStore.js - Versión con localStorage

// Estado inicial
const initialState = {
  balance: 10000,
  username: 'Usuario Demo',
  level: 'Novato',
  avatar: '/images/avatar-default.png'
};

// Obtener datos del localStorage o usar estado inicial
const getStoredState = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('userStore');
    return stored ? JSON.parse(stored) : initialState;
  }
  return initialState;
};

// Guardar en localStorage
const saveState = (state) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userStore', JSON.stringify(state));
  }
};

// Store simple (sin nanostores)
export const userStore = {
  get: () => getStoredState(),
  
  set: (newState) => {
    saveState(newState);
    // Disparar evento personalizado para notificar cambios
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userStoreUpdate', { detail: newState }));
    }
  },
  
  setKey: (key, value) => {
    const current = getStoredState();
    const newState = { ...current, [key]: value };
    saveState(newState);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userStoreUpdate', { detail: newState }));
    }
  }
};

// Actions
export const depositMoney = (amount) => {
  const current = userStore.get();
  const newBalance = current.balance + amount;
  userStore.setKey('balance', newBalance);
  
  // Guardar transacción
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  transactions.push({
    id: Date.now(),
    type: 'deposit',
    amount,
    date: new Date().toISOString(),
    status: 'completed'
  });
  localStorage.setItem('transactions', JSON.stringify(transactions));
  
  return newBalance;
};

export const placeBet = (betData) => {
  const user = userStore.get();
  if (user.balance >= betData.amount) {
    const newBalance = user.balance - betData.amount;
    userStore.setKey('balance', newBalance);
    
    // Guardar apuesta
    const bets = JSON.parse(localStorage.getItem('bets') || '[]');
    bets.push({
      id: Date.now(),
      ...betData,
      status: 'active',
      placedAt: new Date().toISOString()
    });
    localStorage.setItem('bets', JSON.stringify(bets));
    
    return true;
  }
  return false;
};

// Obtener transacciones
export const getTransactions = () => {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('transactions') || '[]');
  }
  return [];
};

// Obtener apuestas
export const getBets = () => {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('bets') || '[]');
  }
  return [];
};