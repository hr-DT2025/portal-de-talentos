import { User, Role, Project, Request, RequestStatus, RequestType, Company, ChatMessage, EmployeeFile } from '../types';
import { authService, profileService, empresaService, solicitudService, chatService } from './supabaseService';

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
      // Supabase Role: 'SuperAdmin' | 'Director' | 'HR' | 'Colaborador'
      // App Role (Frontend): Role.HR | Role.COLLABORATOR (Podrías necesitar expandir tu enum Role en types.ts)
      
      let appRole = Role.COLLABORATOR;
      if (profile.role === 'HR' || profile.role === 'SuperAdmin' || profile.role === 'Director') {
        appRole = Role.HR; // Por ahora mapeamos roles altos a HR para que vean dashboard administrativo
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || 'Usuario',
        role: appRole,
        // Usamos el job_title que guardamos en el registro
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
      // IMPORTANTE: Aquí deberíamos diferenciar quién pide los datos.
      // Por ahora, si pasas userId, trae las de ese usuario.
      // Si eres Admin/HR, deberías usar otro método o dejar que RLS filtre.
      
      let requests;
      if (userId) {
        requests = await solicitudService.getByUser(userId);
      } else {
        // Si no hay ID, asumimos que es un Admin pidiendo todo
        // La política RLS en Supabase decidirá si puede ver todo o solo su empresa
        requests = await solicitudService.getAll();
      }

      return requests.map(r => ({
        id: r.id,
        userId: r.colaborador_id,
        type: r.tipo as RequestType,
        details: r.detalles || '',
        date: r.created_at,
        status: mapStatusFromSupabase(r.estatus || 'Pendiente'),
        companyName: '' 
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
      companyName: '' 
    }));
  },

  createRequest: async (type: RequestType, details: string, userId: string, companyName?: string): Promise<Request> => {
    // Necesitas implementar getProfile para saber la empresa_id del usuario
    const profile = await profileService.getById(userId);
    
    if (!profile || !profile.empresa_id) {
      // Si no tiene empresa asignada, no puede crear solicitud (o se crea sin empresa)
      console.warn("Usuario sin empresa intentando crear solicitud");
    }

    const newReq = await solicitudService.create({
      colaborador_id: userId,
      tipo: type,
      detalles: details,
      empresa_id: profile?.empresa_id, // Puede ser null
      estatus: 'Pendiente'
    });

    return {
      id: newReq.id,
      userId: newReq.colaborador_id,
      type: newReq.tipo as RequestType,
      details: newReq.detalles,
      date: newReq.created_at,
      status: RequestStatus.PENDING,
      companyName: companyName
    };
  },

  updateRequestStatus: async (_requestId: string, _status: RequestStatus): Promise<Request> => {
    throw new Error("Update request not implemented");
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

// Helper
const mapStatusFromSupabase = (status: string): RequestStatus => {
  const map: Record<string, RequestStatus> = {
    'Pendiente': RequestStatus.PENDING,
    'Aprobado': RequestStatus.APPROVED,
    'Rechazado': RequestStatus.REJECTED,
    'En Proceso': RequestStatus.IN_PROGRESS
  };
  return map[status] || RequestStatus.PENDING;
};
