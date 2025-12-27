import { supabase } from '../lib/supabase';
import type { Profile, Empresa, Solicitud, ChatHistory } from '../types/database';

// ==================== AUTENTICACIÓN ====================

export const authService = {
  // Login con email y contraseña
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Registro de nuevo usuario
  async register(email: string, password: string, fullName: string, role: string = 'Colaborador') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // Cerrar sesión
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obtener sesión actual
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  // Escuchar cambios de autenticación
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ==================== PERFILES ====================

export const profileService = {
  // Obtener perfil por ID
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  // Obtener perfil con empresa
  async getProfileWithEmpresa(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        empresas (
          id,
          nombre,
          logo_url
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile with empresa:', error);
      return null;
    }
    return data;
  },

  // Actualizar perfil
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener todos los colaboradores (para HR)
  async getAllCollaborators(empresaId?: string) {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        empresas (
          id,
          nombre
        )
      `)
      .eq('role', 'Colaborador');

    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Crear perfil de usuario
  async createProfile(profileData: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    rol_puesto?: string;
    empresa_id?: string;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role as any,
        rol_puesto: profileData.rol_puesto,
        empresa_id: profileData.empresa_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== EMPRESAS ====================

export const empresaService = {
  // Obtener todas las empresas
  async getAll(): Promise<Empresa[]> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre');

    if (error) throw error;
    return data || [];
  },

  // Obtener empresa por ID
  async getById(id: string): Promise<Empresa | null> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching empresa:', error);
      return null;
    }
    return data;
  },

  // Crear empresa
  async create(empresa: { nombre: string; nit_identificacion?: string; logo_url?: string }) {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresa)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar empresa
  async update(id: string, updates: Partial<Empresa>) {
    const { data, error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener colaboradores de una empresa
  async getCollaborators(empresaId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('role', 'Colaborador');

    if (error) throw error;
    return data || [];
  },
};

// ==================== SOLICITUDES ====================

export const solicitudService = {
  // Obtener solicitudes del colaborador
  async getByColaborador(colaboradorId: string): Promise<Solicitud[]> {
    const { data, error } = await supabase
      .from('solicitudes')
      .select(`
        *,
        empresas (
          nombre
        )
      `)
      .eq('colaborador_id', colaboradorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener todas las solicitudes (para HR)
  async getAll(empresaId?: string): Promise<Solicitud[]> {
    let query = supabase
      .from('solicitudes')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        empresas (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Crear solicitud
  async create(solicitud: {
    colaborador_id: string;
    empresa_id: string;
    tipo: string;
    detalles?: string;
  }) {
    const { data, error } = await supabase
      .from('solicitudes')
      .insert({
        ...solicitud,
        estatus: 'Pendiente',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar estado de solicitud
  async updateStatus(id: string, estatus: string) {
    const { data, error } = await supabase
      .from('solicitudes')
      .update({ estatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== CHAT ====================

export const chatService = {
  // Obtener mensajes entre dos usuarios
  async getMessages(userId1: string, userId2: string): Promise<ChatHistory[]> {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .or(`and(emisor_id.eq.${userId1},receptor_id.eq.${userId2}),and(emisor_id.eq.${userId2},receptor_id.eq.${userId1})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Enviar mensaje
  async sendMessage(emisorId: string, receptorId: string, mensaje: string) {
    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        emisor_id: emisorId,
        receptor_id: receptorId,
        mensaje,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Suscribirse a nuevos mensajes en tiempo real
  subscribeToMessages(userId: string, callback: (message: ChatHistory) => void) {
    return supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_history',
          filter: `receptor_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as ChatHistory);
        }
      )
      .subscribe();
  },
};

// ==================== REGISTRO COLABORADORES ====================

export const registroColaboradorService = {
  // Obtener todos los registros
  async getAll() {
    const { data, error } = await supabase
      .from('registro_colaboradores')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  // Obtener registro por ID de usuario
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('registro_colaboradores')
      .select('*')
      .eq('id_user', userId)
      .single();

    if (error) {
      console.error('Error fetching registro:', error);
      return null;
    }
    return data;
  },
};
