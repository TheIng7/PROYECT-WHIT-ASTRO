// src/stores/authStore.js
import { supabase } from '../lib/supabaseClient';

// Estado global
let currentUser = null;
let isAuthenticated = false;
const authListeners = [];

// Suscribirse a cambios
export const subscribeToAuth = (listener) => {
  authListeners.push(listener);
  return () => {
    const index = authListeners.indexOf(listener);
    if (index > -1) authListeners.splice(index, 1);
  };
};

// Notificar cambios
const notifyAuthChange = () => {
  authListeners.forEach(listener => listener({
    user: currentUser,
    isAuthenticated
  }));
};

// Inicializar auth al cargar
export const initializeAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && userData) {
        currentUser = userData;
        isAuthenticated = true;
        notifyAuthChange();
        console.log('Usuario autenticado:', userData);
      }
    } else {
      console.log('No hay sesión activa');
    }
  } catch (error) {
    console.error('Error inicializando auth:', error);
  }
};

// Store para componentes
export const authStore = {
  getCurrentUser: () => currentUser,
  
  shouldShowAuthButtons: () => !currentUser,
  
  getUserDisplayInfo: () => {
    if (!currentUser) return null;
    
    return {
      username: currentUser.name || currentUser.email?.split('@')[0] || 'Usuario',
      balance: currentUser.balance || 0,
      level: currentUser.level || 'Novato',
      avatar: '/images/default-avatar.png'
    };
  },

  // Métodos de autenticación
  register: async (email, password, name) => {
    try {
      console.log('Registrando usuario:', { email, name });
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);

      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: email,
            name: name,
            balance: 1000000,
            level: 'Novato'
          }])
          .select()
          .single();

        if (userError) throw new Error(userError.message);

        currentUser = userData;
        isAuthenticated = true;
        notifyAuthChange();
        
        return { success: true, user: userData };
      }

    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message);

      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) throw new Error(userError.message);

        // Actualizar last_login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        currentUser = userData;
        isAuthenticated = true;
        notifyAuthChange();

        return { success: true, user: userData };
      }

    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);

      currentUser = null;
      isAuthenticated = false;
      notifyAuthChange();

      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: error.message };
    }
  }
};

// Inicializar al cargar el módulo
if (typeof window !== 'undefined') {
  initializeAuth();
}