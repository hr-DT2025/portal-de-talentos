import { User, Role, Project, Request, RequestStatus, RequestType, Company, ChatMessage, EmployeeFile } from '../types';
import { authService, profileService, empresaService, solicitudService, chatService } from './supabaseService';
import { supabase } from '../lib/supabase'; // Importante para operaciones directas

// Helper para mapear estatus
const mapStatusFromSupabase = (status: string): RequestStatus => {
  const map: Record<string, RequestStatus> = {
    'Pendiente': RequestStatus.PENDING,
    'Aprobado': RequestStatus.APPROVED,
    'Rechazado': RequestStatus.REJECTED,
    'En Proceso': RequestStatus.IN_PROGRESS
  };
  return map[status] || RequestStatus.PENDING;
};

// ==================== DATA SERVICE (REAL SUPABASE) ====================

export const dataService = {
  // --- Autenticación ---
  
  login: async (email: string, password: string, _userType: 'collaborator' | 'hr'): Promise<User> => {
    try {
      // 1. Autenticar
      const { user: authUser } = await authService.login(email, password);
      if (!authUser) throw new Error('Usuario no encontrado');

      // 2. Obtener perfil
      const profile = await profileService.getById(authUser.id);
      if (!profile) throw new Error('Perfil no encontrado en base de datos');

      // 3. Mapear roles de Base de Datos a la App
      let appRole = Role.COLLABORATOR;
      if (['HR', 'SuperAdmin', 'Director'].includes(profile.role)) {
        appRole = Role.HR; 
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || 'Usuario',
        role: appRole,
        department: profile.job_title || profile.area || 'Sin cargo', 
        leader: 'Por asignar',
        startDate: profile.fecha_ingreso || new Date().toISOString(),
        ptoTotal: 15,
        ptoTaken: 0,
        skills: [],
        area: profile.area || '',
        avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}`
      } as User;

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    role: string;      // Rol del sistema (SuperAdmin, Director, etc.)
    jobTitle: string;  // Cargo real (CEO, Diseñador...)
    companyName: string;
  }): Promise<User> => {
    try {
      // 1. Registro en Auth enviando los metadatos nuevos
      const { user: authUser } = await authService.register(
        userData.email, 
        userData.password, 
        userData.fullName, 
        userData.role,     // Enviamos rol calculado
        userData.jobTitle, // Enviamos cargo real
        userData.companyName
      );

      if (!authUser) throw new Error('Error creando usuario');

      // 2. Retornar usuario temporal para la UI
      return {
        id: authUser.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role === 'Colaborador' ? Role.COLLABORATOR : Role.HR,
        department: userData.jobTitle, // Mostramos el cargo inmediatamente
        leader: '',
        startDate: new Date().toISOString(),
        ptoTotal: 0,
        ptoTaken: 0,
        skills: [],
        area: '',
        avatarUrl: `https://ui-avatars.com/api/?name=${userData.fullName}`
      } as User;

    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // --- Usuarios ---
  getUser: async (id: string): Promise<User> => {
    try {
      const profile = await profileService.getById(id);
      if (!profile) throw new Error('Usuario no encontrado');

      let appRole = Role.COLLABORATOR;
      if (['HR', 'Director', 'SuperAdmin'].includes(profile.role)) {
        appRole = Role.HR;
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || '',
        role: appRole,
        department: profile.job_title || profile.area || '',
        leader: '',
        startDate: profile.fecha_ingreso || new Date().toISOString(),
        ptoTotal: 15,
        ptoTaken: 0,
        skills: [],
        area: profile.area || '',
        avatarUrl: profile.avatar_url || ''
      } as User;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // --- Empresas ---
  getCompanies: async (): Promise<Company[]> => {
    try {
      const empresas = await empresaService.getAll();
      return empresas.map(e => ({
        id: e.id,
        name: e.nombre,
        businessId: e.nit_identificacion || '',
        industry: '',
        address: '',
        phone: '',
        contactEmail: '',
        hrManagerId: '',
        createdAt: e.created_at,
        collaborators: []
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  createCompany: async (_companyData: any): Promise<Company> => {
    // Implementar si es necesario
    throw new Error("Not implemented yet");
  },

  getCollaboratorsByCompany: async (_companyId: string): Promise<User[]> => {
    // Implementar lógica de obtener usuarios por empresa
    return [];
  },

  // --- Proyectos ---
  getProjects: async (): Promise<Project[]> => {
    return [];
  },

  // --- Solicitudes ---
  getRequests: async (userId?: string): Promise<Request[]> => {
    try {
      let requests;
      if (userId) {
        requests = await solicitudService.getByUser(userId);
      } else {
        requests = await solicitudService.getAll();
      }

      return requests.map(r => ({
        id: r.id,
        userId: r.colaborador_id,
        type: r.tipo as RequestType,
        details: r.detalles || '',
        date: r.created_at,
        status: mapStatusFromSupabase(r.estatus || 'Pendiente'),
        companyName: r.profiles?.company_temp || '', // Intentamos mapear algo si viene
        archivo_url: r.archivo_url
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  getAllRequests: async (): Promise<Request[]> => {
    const requests = await solicitudService.getAll();
    return requests.map(r => ({
      id: r.id,
      userId: r.colaborador_id,
      type: r.tipo as RequestType,
      details: r.detalles || '',
      date: r.created_at,
      status: mapStatusFromSupabase(r.estatus || 'Pendiente'),
      companyName: '', 
      archivo_url: r.archivo_url
    }));
  },

  createRequest: async (type: string | RequestType, details: string, userId: string, companyName?: string): Promise<Request> => {
    
    // 1. Obtener el perfil COMPLETO del usuario para ver su empresa real
    const profile = await profileService.getById(userId);
    let companyId = profile?.empresa_id;

    // 2. Si el usuario YA tiene empresa asignada en su perfil, usamos esa (Prioridad 1)
    if (companyId) {
       console.log('Usando empresa vinculada al perfil:', companyId);
    } 
    // 3. Si NO tiene (es usuario nuevo/temporal), usamos la lógica de buscar/crear por nombre (Fallback)
    else {
        if (!companyName || companyName.trim() === '') {
            throw new Error('El usuario no tiene empresa vinculada y no se proporcionó un nombre.');
        }

        console.log('Usuario sin empresa vinculada. Buscando por nombre:', companyName);

        // A. Buscar si existe
        const { data: existingCompany } = await supabase
            .from('empresas')
            .select('id')
            .ilike('nombre', companyName.trim()) 
            .maybeSingle();

        if (existingCompany) {
            companyId = existingCompany.id;
        } else {
            // B. Crear si no existe
            const { data: newCompany, error: createError } = await supabase
                .from('empresas')
                .insert([{ nombre: companyName.trim() }])
                .select('id')
                .single();

            if (createError) throw new Error(`Error registrando empresa: ${createError.message}`);
            companyId = newCompany.id;
        }
    }

    // 4. Insertar la solicitud con el ID seguro
    const { data: newReq, error } = await supabase
        .from('solicitudes')
        .insert({
            colaborador_id: userId,
            tipo: type,
            detalles: details,
            empresa_id: companyId, // ¡Ahora siempre tendrá un ID válido!
            estatus: 'Pendiente'
        })
        .select(`
            *,
            empresas:empresa_id (nombre)
        `)
        .single();

    if (error) {
        console.error('Error insertando solicitud:', error);
        throw error;
    }

    // Retornamos el objeto Request completo
    return {
      id: newReq.id,
      userId: newReq.colaborador_id,
      type: newReq.tipo as RequestType,
      details: newReq.detalles,
      date: newReq.created_at,
      status: RequestStatus.PENDING,
      // Usamos el nombre real de la BD o el que pasó el usuario como fallback
      companyName: newReq.empresas?.nombre || companyName,
      archivo_url: newReq.archivo_url
    };
  },

  updateRequestStatus: async (requestId: string, status: RequestStatus): Promise<Request> => {
    const { data, error } = await supabase
      .from('solicitudes')
      .update({ estatus: status })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.colaborador_id,
      type: data.tipo as RequestType,
      details: data.detalles,
      date: data.created_at,
      status: mapStatusFromSupabase(data.estatus),
      companyName: '',
      archivo_url: data.archivo_url
    };
  },

  // --- Chat ---
  getChatMessages: async (userId: string, hrId: string): Promise<ChatMessage[]> => {
    try {
      const msgs = await chatService.getHistory(userId, hrId);
      return msgs.map(m => ({
        id: m.id,
        senderId: m.emisor_id,
        receiverId: m.receptor_id,
        message: m.mensaje,
        timestamp: m.created_at,
        isFromHR: m.emisor_id === hrId 
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  sendMessage: async (senderId: string, receiverId: string, message: string, isFromHR: boolean): Promise<ChatMessage> => {
    try {
      const savedMsg = await chatService.sendMessage(senderId, receiverId, message);
      
      // Notificación Google Chat (solo si escribe el colaborador)
      const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK_URL;
      if (!isFromHR && webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `📩 Nuevo mensaje de ${senderId}: ${message}` })
        }).catch(e => console.error("Webhook error:", e));
      }

      return {
        id: savedMsg.id,
        senderId: savedMsg.emisor_id,
        receiverId: savedMsg.receptor_id,
        message: savedMsg.mensaje,
        timestamp: savedMsg.created_at,
        isFromHR
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // --- Expedientes ---
  getEmployeeFiles: async (_userId: string, _companyId: string): Promise<EmployeeFile[]> => {
    return [];
  },

  uploadEmployeeFile: async (_fileData: any): Promise<EmployeeFile> => {
    throw new Error("Not implemented");
  }
};
