import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ==================== UTILIDADES ====================

// Función auxiliar para limpiar nombres de carpetas
const sanitizeFileName = (text: string) => {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-") // Reemplazar espacios y caracteres raros por guiones
    .replace(/-+/g, "-"); // Evitar guiones dobles
};

// ==================== AUTENTICACIÓN ====================

export const authService = {
  async login(email: string, password: string) {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register(email: string, password: string, fullName: string, role: string, jobTitle: string, companyName: string) {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          job_title: jobTitle,
          company_temp: companyName
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
  getById: async (id: string) => {
    // CORRECCIÓN CRÍTICA: Usamos 'empresas!empresa_id' para evitar ambigüedad en las relaciones
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        empresas!empresa_id (
          id,
          nombre
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  },

  async getProfileWithEmpresa(id: string) {
    // Mantenemos la misma lógica de desambiguación aquí
    const { data, error } = await supabase
      .from('profiles')
      .select(`*, empresas!empresa_id (nombre, logo_url)`)
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  // --- ACTUALIZACIÓN DE PERFIL (Update) ---
  async updateProfile(id: string, updates: {
    full_name?: string;
    telefono_whatsapp?: string;
    correo_personal?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
    avatar_url?: string;
    area?: string;            
    fecha_ingreso?: string;   
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- SUBIR AVATAR (Storage) ---
  async uploadAvatar(userId: string, file: File) {
    // 1. Crear nombre único: usuario/timestamp.ext
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    // 2. Subir al bucket 'avatars'
    const { error: uploadError } = await supabase.storage
      .from('avatars') 
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 3. Obtener URL pública
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

// ==================== EXPEDIENTE (NUEVO) ====================

export const expedienteService = {
  // Obtener expediente
  async getById(id: string) {
    const { data, error } = await supabase
      .from('expedientes')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // maybeSingle no lanza error si está vacío

    if (error) throw error;
    return data;
  },

  // Guardar o Actualizar (Upsert)
  async save(userId: string, data: any, metadataComment: string) {
    // 1. Obtener metadata actual
    const currentData = await this.getById(userId);
    let history = currentData?.metadata_actualizacion || [];

    // 2. Agregar nuevo registro al historial
    const newEntry = {
      fecha: new Date().toISOString(),
      comentario: metadataComment
    };
    history.push(newEntry);

    // 3. Guardar
    const { error } = await supabase
      .from('expedientes')
      .upsert({
        id: userId,
        ...data,
        metadata_actualizacion: history,
        updated_at: new Date()
      });

    if (error) throw error;
  },

  // Subir documento al bucket privado con estructura personalizada
  async uploadDocument(userId: string, file: File, docType: string, folderStructure: { company: string, userName: string }) {
    const fileExt = file.name.split('.').pop();
    
    // 1. Limpiar nombres
    const safeCompany = sanitizeFileName(folderStructure.company || 'sin-empresa');
    const safeUser = sanitizeFileName(folderStructure.userName || 'usuario');
    
    // 2. Crear ruta: empresa / usuario-id / archivo.ext
    const filePath = `${safeCompany}/${safeUser}-${userId}/${docType}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('expediente_files')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Retornamos el Path relativo (que guardaremos en la BD)
    return filePath; 
  },
   
  // Verificar contraseña (Re-autenticación)
  async verifyPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return true;
  }
};

// ==================== EMPRESAS ====================

export const empresaService = {
  async getAll() {
    const { data, error } = await supabase.from('empresas').select('*').order('nombre');
    if (error) throw error;
    return data || [];
  },
  
  async getById(id: string) {
    const { data, error } = await supabase.from('empresas').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  // --- NUEVA FUNCIÓN PARA HRBP (Agregada) ---
  async getCompaniesByHrbp(hrbpId: string) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('hrbp_id', hrbpId); // Busca empresas donde este usuario sea el jefe
      
    if (error) throw error;
    return data || [];
  },

  async create(empresaData: any) {
    const { data, error } = await supabase.from('empresas').insert(empresaData).select().single();
    if (error) throw error;
    return data;
  }
};

// ==================== SOLICITUDES ====================

export const solicitudService = {
  async getByUser(userId: string) {
    const { data, error } = await supabase.from('solicitudes').select('*').eq('colaborador_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getAll() {
    const { data, error } = await supabase.from('solicitudes').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getByCompany(companyId: string) {
    const { data, error } = await supabase.from('solicitudes').select('*, profiles(full_name)').eq('empresa_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async create(solicitud: any) {
    const { data, error } = await supabase.from('solicitudes').insert(solicitud).select().single();
    if (error) throw error;
    return data;
  }
};

// ==================== CHAT ====================

export const chatService = {
  async sendMessage(emisorId: string, receptorId: string, mensaje: string) {
    const { data, error } = await supabase.from('chat_history').insert({ emisor_id: emisorId, receptor_id: receptorId, mensaje }).select().single();
    if (error) throw error;
    return data;
  },
  async getHistory(user1: string, user2: string) {
    const { data, error } = await supabase.from('chat_history').select('*').or(`and(emisor_id.eq.${user1},receptor_id.eq.${user2}),and(emisor_id.eq.${user2},receptor_id.eq.${user1})`).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }
};

// ==================== GESTIÓN MASIVA (HR) ====================

export const adminService = {
  async uploadBatchCollaborators(collaborators: any[]) {
    if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
    
    // CORRECCIÓN: Ahora usamos los nombres de columna en minúsculas (snake_case)
    // que definimos en el script SQL.
    const records = collaborators.map(c => ({
      nombre: c.nombre,               // Antes: 'Nombres y Apellidos'
      email: c.email,                 // Antes: 'Correo corporativo'
      cargo: c.cargo || 'Colaborador',// Antes: 'Rol'
      departamento: c.departamento || 'Sin asignar',
      status: 'Pendiente Registro',   // Antes: 'Status'
      fecha_ingreso: new Date().toISOString().split('T')[0], // Antes: 'Fecha de Ingreso'
      
      // Mapeamos los campos adicionales si vienen en el CSV
      id_legajo: c.id || null,
      proyecto: c.proyecto || null,
      lider: c.lider || null,
      tipo_identificacion: c.tipo_identificacion || null,
      numero_identificacion: c.numero_identificacion || null,
      telefono: c.telefono || null,
      salario: c.salario || null,
      expediente: c.expediente || null
    }));

    const { data, error } = await supabase.from('registro_colaboradores').insert(records).select();
    
    if (error) {
        console.error("Error subiendo colaboradores:", error);
        throw error;
    }
    return data;
  },

  generateInviteLink(companyCode: string) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/registro?company=${encodeURIComponent(companyCode)}`;
  }
};

