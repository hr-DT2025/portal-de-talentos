import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ==================== AUTENTICACIÓN ====================

export const authService = {
  // Login con email y contraseña
  async login(email: string, password: string) {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Registro actualizado para RBAC (Role Based Access Control)
   */
  async register(
    email: string, 
    password: string, 
    fullName: string, 
    role: string, 
    jobTitle: string, 
    companyName: string
  ) {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,            // Vital para tus políticas de seguridad
          job_title: jobTitle,   // Se guarda en profiles mediante el Trigger
          company_temp: companyName // Se guarda para que un Admin valide después
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
};

// ==================== PERFILES ====================

export const profileService = {
  // Obtener perfil por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null; 
    return data;
  },

  // Obtener perfil con datos de empresa (Join)
  async getProfileWithEmpresa(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        empresas (
          nombre,
          logo_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }
};

// ==================== EMPRESAS ====================

export const empresaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre');

    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(empresaData: any) {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresaData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==================== SOLICITUDES ====================

export const solicitudService = {
  // Obtener solicitudes de un usuario específico
  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('colaborador_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener TODAS las solicitudes (Para SuperAdmin)
  async getAll() {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*, profiles(full_name, email)') 
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener solicitudes de una empresa (Para Director/HR)
  async getByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*, profiles(full_name)')
      .eq('empresa_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(solicitud: any) {
    const { data, error } = await supabase
      .from('solicitudes')
      .insert(solicitud)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==================== CHAT ====================

export const chatService = {
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

  // Obtener historial entre dos personas
  async getHistory(user1: string, user2: string) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .or(`and(emisor_id.eq.${user1},receptor_id.eq.${user2}),and(emisor_id.eq.${user2},receptor_id.eq.${user1})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// ==================== GESTIÓN MASIVA (HR) ====================

export const adminService = {
  // Carga masiva de colaboradores a la tabla de registro (Pre-registro)
  async uploadBatchCollaborators(collaborators: any[]) {
    if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');

    // Mapeamos las columnas del CSV a las columnas exactas de tu BD
    const records = collaborators.map(c => ({
      'Nombres y Apellidos': c.nombre,
      'Correo corporativo': c.email,
      'Rol': c.cargo || 'Colaborador',
      'Departamento': c.departamento || 'Sin asignar',
      'Status': 'Pendiente Registro',
      'Fecha de Ingreso': new Date().toISOString().split('T')[0]
    }));

    const { data, error } = await supabase
      .from('registro_colaboradores')
      .insert(records)
      .select();

    if (error) throw error;
    return data;
  },

  // Generar link de invitación
  generateInviteLink(companyCode: string) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/registro?company=${encodeURIComponent(companyCode)}`;
  }
};
