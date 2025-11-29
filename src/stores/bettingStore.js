// src/stores/bettingStore.js
import { authStore } from './authStore';

// DATOS MOCK - Eventos deportivos realistas
export const mockEvents = {
  fútbol: [
    {
      id: 'ftb-1',
      sport: 'fútbol',
      league: 'Liga BetSimulator',
      teamA: 'Barcelona',
      teamB: 'Real Madrid',
      date: '2024-01-15T20:00:00',
      time: '20:00',
      markets: [
        {
          type: 'ganador',
          name: 'Ganador del Partido',
          odds: [
            { option: 'Barcelona', odds: 2.10 },
            { option: 'Empate', odds: 3.25 },
            { option: 'Real Madrid', odds: 3.00 }
          ]
        },
        {
          type: 'ambos_marcan',
          name: 'Ambos equipos marcan',
          odds: [
            { option: 'Sí', odds: 1.80 },
            { option: 'No', odds: 1.90 }
          ]
        },
        {
          type: 'mas_menos',
          name: 'Más/Menos 2.5 goles',
          odds: [
            { option: 'Más de 2.5', odds: 2.05 },
            { option: 'Menos de 2.5', odds: 1.75 }
          ]
        }
      ]
    },
    {
      id: 'ftb-2',
      sport: 'fútbol',
      league: 'Premier League',
      teamA: 'Manchester United',
      teamB: 'Liverpool',
      date: '2024-01-16T18:30:00',
      time: '18:30',
      markets: [
        {
          type: 'ganador',
          name: 'Ganador del Partido',
          odds: [
            { option: 'Manchester Utd', odds: 2.80 },
            { option: 'Empate', odds: 3.40 },
            { option: 'Liverpool', odds: 2.30 }
          ]
        }
      ]
    }
  ],
  
  baloncesto: [
    {
      id: 'bkt-1',
      sport: 'baloncesto',
      league: 'NBA',
      teamA: 'Lakers',
      teamB: 'Warriors',
      date: '2024-01-15T22:00:00',
      time: '22:00',
      markets: [
        {
          type: 'ganador',
          name: 'Ganador del Partido',
          odds: [
            { option: 'Lakers', odds: 1.95 },
            { option: 'Warriors', odds: 1.85 }
          ]
        },
        {
          type: 'mas_menos',
          name: 'Más/Menos 220.5 puntos',
          odds: [
            { option: 'Más de 220.5', odds: 1.90 },
            { option: 'Menos de 220.5', odds: 1.90 }
          ]
        }
      ]
    }
  ],
  
  tenis: [
    {
      id: 'tns-1',
      sport: 'tenis',
      league: 'ATP Tour',
      teamA: 'Novak Djokovic',
      teamB: 'Rafael Nadal',
      date: '2024-01-17T16:00:00',
      time: '16:00',
      markets: [
        {
          type: 'ganador',
          name: 'Ganador del Partido',
          odds: [
            { option: 'Djokovic', odds: 1.65 },
            { option: 'Nadal', odds: 2.20 }
          ]
        }
      ]
    }
  ]
};

// Estado global de apuestas
let activeBets = [];
let betHistory = [];

// Obtener del localStorage
const getStoredBets = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeBets');
    const history = localStorage.getItem('betHistory');
    return {
      activeBets: stored ? JSON.parse(stored) : [],
      betHistory: history ? JSON.parse(history) : []
    };
  }
  return { activeBets: [], betHistory: [] };
};

// Guardar en localStorage
const saveBets = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('activeBets', JSON.stringify(activeBets));
    localStorage.setItem('betHistory', JSON.stringify(betHistory));
  }
};

// Listeners para cambios
const betListeners = [];

export const subscribeToBets = (listener) => {
  betListeners.push(listener);
  return () => {
    const index = betListeners.indexOf(listener);
    if (index > -1) betListeners.splice(index, 1);
  };
};

const notifyBetChange = () => {
  betListeners.forEach(listener => listener({
    activeBets,
    betHistory
  }));
};

// Inicializar desde localStorage
const initializeBets = () => {
  const stored = getStoredBets();
  activeBets = stored.activeBets;
  betHistory = stored.betHistory;
};

// STORE PRINCIPAL
export const bettingStore = {
  // Obtener eventos por deporte
  getEvents: (sport = 'fútbol') => {
    return mockEvents[sport] || [];
  },
  
  // Obtener todos los deportes disponibles
  getSports: () => {
    return Object.keys(mockEvents);
  },
  
  // Obtener apuestas activas
  getActiveBets: () => activeBets,
  
  // Obtener historial
  getBetHistory: () => betHistory,
  
  // Agregar apuesta al BetSlip
  addToBetSlip: (eventId, marketType, option, odds, amount = 0) => {
    const event = findEventById(eventId);
    if (!event) {
      console.error('Evento no encontrado:', eventId);
      return false;
    }
    
    const market = event.markets.find(m => m.type === marketType);
    if (!market) {
      console.error('Mercado no encontrado:', marketType);
      return false;
    }
    
    const odd = market.odds.find(o => o.option === option);
    if (!odd) {
      console.error('Opción no encontrada:', option);
      return false;
    }
    
    const newBet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      sport: event.sport,
      eventName: `${event.teamA} vs ${event.teamB}`,
      marketType,
      marketName: market.name,
      option,
      odds: odd.odds,
      amount,
      potentialWin: amount * odd.odds,
      status: 'pending', // pending, won, lost
      placedAt: new Date().toISOString()
    };
    
    // Verificar si ya existe esta apuesta
    const existingBetIndex = activeBets.findIndex(bet => 
      bet.eventId === eventId && 
      bet.marketType === marketType && 
      bet.option === option
    );
    
    if (existingBetIndex > -1) {
      // Actualizar apuesta existente
      activeBets[existingBetIndex].amount = amount;
      activeBets[existingBetIndex].potentialWin = amount * odd.odds;
    } else {
      // Agregar nueva apuesta
      activeBets.push(newBet);
    }
    
    saveBets();
    notifyBetChange();
    
    return true;
  },
  
  // Remover apuesta del BetSlip
  removeFromBetSlip: (betId) => {
    activeBets = activeBets.filter(bet => bet.id !== betId);
    saveBets();
    notifyBetChange();
  },
  
  // Confirmar todas las apuestas (restar del balance)
  confirmBets: async () => {
    const user = authStore.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    const totalAmount = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    if (totalAmount > user.balance) {
      throw new Error('Saldo insuficiente');
    }
    
    if (activeBets.length === 0) {
      throw new Error('No hay apuestas para confirmar');
    }
    
    try {
      // Aquí integraríamos con Supabase para actualizar el balance
      // Por ahora, simulamos la confirmación
      
      // Mover apuestas activas al historial
      const confirmedBets = activeBets.map(bet => ({
        ...bet,
        status: 'active',
        confirmedAt: new Date().toISOString()
      }));
      
      betHistory = [...betHistory, ...confirmedBets];
      activeBets = [];
      
      saveBets();
      notifyBetChange();
      
      console.log('Apuestas confirmadas:', confirmedBets);
      return { success: true, bets: confirmedBets };
      
    } catch (error) {
      console.error('Error confirmando apuestas:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Simular resultado de apuestas (para testing)
  simulateResults: () => {
    betHistory = betHistory.map(bet => {
      if (bet.status === 'active') {
        // 50% de probabilidad de ganar
        const won = Math.random() > 0.5;
        return {
          ...bet,
          status: won ? 'won' : 'lost',
          resultAt: new Date().toISOString()
        };
      }
      return bet;
    });
    
    saveBets();
    notifyBetChange();
  },
  
  // Calcular estadísticas del usuario
  getUserStats: () => {
    const userBets = betHistory.filter(bet => bet.status !== 'pending');
    const totalBets = userBets.length;
    const wonBets = userBets.filter(bet => bet.status === 'won').length;
    const lostBets = userBets.filter(bet => bet.status === 'lost').length;
    
    return {
      totalBets,
      wonBets,
      lostBets,
      winRate: totalBets > 0 ? (wonBets / totalBets * 100).toFixed(1) : 0,
      currentStreak: calculateCurrentStreak(userBets)
    };
  }
};

// Helper: Encontrar evento por ID
const findEventById = (eventId) => {
  for (const sport of Object.values(mockEvents)) {
    const event = sport.find(e => e.id === eventId);
    if (event) return event;
  }
  return null;
};

// Helper: Calcular racha actual
const calculateCurrentStreak = (bets) => {
  let streak = 0;
  const sortedBets = [...bets].sort((a, b) => new Date(b.resultAt) - new Date(a.resultAt));
  
  for (const bet of sortedBets) {
    if (bet.status === 'won') {
      streak++;
    } else if (bet.status === 'lost') {
      break;
    }
  }
  
  return streak;
};

// Inicializar al cargar el módulo
initializeBets();