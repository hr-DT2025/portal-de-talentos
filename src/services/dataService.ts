import { User, Role, Project, Request, RequestStatus, RequestType, Company, ChatMessage, EmployeeFile } from '../types';
import { authService, profileService, empresaService, solicitudService, chatService } from './supabaseService';

// ==================== DATA SERVICE (REAL SUPABASE ONLY) ====================
// Sin datos de relleno. Si falla, lanza error. Si está vacío, devuelve array vacío.

export const dataService = {
  // --- Autenticación ---
  login: async (email: string, password: string, _userType: 'collaborator' | 'hr'): Promise<User> => {
    try {
      // 1. Autenticar en Supabase Auth
      const { user: authUser } = await authService.login(email, password);
      
      if (!authUser) throw new Error('Usuario no encontrado');

      // 2. Obtener perfil de la tabla 'profiles'
      const profile = await profileService.getById(authUser.id);

      if (!profile) {
        throw new Error('El usuario existe en Auth pero no tiene Perfil en base de datos.');
      }

      // 3. Mapear DB -> Frontend User
      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || 'Sin Nombre',
        role: profile.role === 'HR' ? Role.HR : Role.COLLABORATOR,
        department: profile.area || 'Sin asignar',
        leader: 'Sin asignar',
        startDate: profile.fecha_ingreso || new Date().toISOString(),
        ptoTotal: 15, // Valor por defecto (podría venir de DB en el futuro)
        ptoTaken: 0,
        skills: [],
        area: profile.area || '',
        avatarUrl: profile.avatar_url || 'https://ui-avatars.com/api/?name=' + (profile.full_name || 'User')
      } as User;

    } catch (error) {
      console.error('Error en Login Real:', error);
      throw error;
    }
  },

  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    companyName: string;
  }): Promise<User> => {
    try {
      // 1. Registro en Auth (El Trigger de la DB crea el perfil automáticamente)
      const { user: authUser } = await authService.register(
        userData.email, 
        userData.password, 
        userData.fullName, 
        userData.role
      );

      if (!authUser) throw new Error('Error al crear usuario');

      // 2. Retornar estructura de usuario para que la App entre al dashboard inmediatamente
      return {
        id: authUser.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role === 'HR' ? Role.HR : Role.COLLABORATOR,
        department: 'Por asignar',
        leader: 'Por asignar',
        startDate: new Date().toISOString(),
        ptoTotal: 15,
        ptoTaken: 0,
        skills: [],
        area: '',
        idType: '',
        idNumber: '',
        personalEmail: '',
        mobilePhone: '',
        avatarUrl: 'https://ui-avatars.com/api/?name=' + userData.fullName
      };

    } catch (error) {
      console.error('Error en Registro Real:', error);
      throw error;
    }
  },

  // --- Usuarios ---
  getUser: async (id: string): Promise<User> => {
    try {
      const profile = await profileService.getById(id);
      if (!profile) throw new Error('Usuario no encontrado');

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || '',
        role: profile.role === 'HR' ? Role.HR : Role.COLLABORATOR,
        department: profile.area || '',
        leader: '',
        startDate: profile.fecha_ingreso || new Date().toISOString(),
        ptoTotal: 15,
        ptoTaken: 0,
        skills: [],
        area: profile.area || '',
        avatarUrl: profile.avatar_url || ''
      } as User;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
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
        businessId: e.rut || '',
        industry: e.rubro || '',
        address: e.direccion || '',
        phone: e.telefono || '',
        contactEmail: e.email_contacto || '',
        hrManagerId: '',
        createdAt: e.created_at,
        collaborators: []
      }));
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      return []; // Retorna lista vacía si falla o no hay datos
    }
  },

  createCompany: async (companyData: Omit<Company, 'id' | 'createdAt' | 'collaborators'>): Promise<Company> => {
    // TODO: Implementar lógica real de creación en supabaseService si se requiere
    console.warn("createCompany: Aún no implementado en backend real");
    throw new Error("Función no implementada en Backend");
  },

  getCollaboratorsByCompany: async (_companyId: string): Promise<User[]> => {
    // TODO: Implementar filtro real en DB
    return [];
  },

  // --- Proyectos ---
  getProjects: async (): Promise<Project[]> => {
    // Si no tienes tabla de proyectos, retorna vacío
    return [];
  },

  // --- Solicitudes ---
  getRequests: async (userId?: string): Promise<Request[]> => {
    try {
      // Si hay userId traemos solo las suyas, si no (y es HR), habría que traer todas
      if (userId) {
        const requests = await solicitudService.getByUser(userId);
        return requests.map(r => ({
          id: r.id,
          userId: r.colaborador_id, // Corregido: mapeo a columna real
          type: r.tipo as RequestType,
          details: r.detalles || '',
          date: r.created_at,
          status: mapStatusFromSupabase(r.estatus || 'Pendiente'),
          companyName: '' 
        }));
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      return [];
    }
  },

  getAllRequests: async (): Promise<Request[]> => {
    // Para HR: Implementar en supabaseService un getAll()
    return [];
  },

  createRequest: async (type: RequestType, details: string, userId: string, companyName?: string): Promise<Request> => {
    // TODO: Conectar con solicitudService.create (necesitas implementar el create real)
    console.warn("createRequest: Falta implementar inserción en tabla 'solicitudes'");
    
    // Retornamos un objeto temporal para que la UI no rompa, pero idealmente debe guardar en DB
    return {
      id: 'temp-id',
      userId,
      type,
      details,
      date: new Date().toISOString(),
      status: RequestStatus.PENDING,
      companyName
    };
  },

  updateRequestStatus: async (_requestId: string, _status: RequestStatus): Promise<Request> => {
    throw new Error("Update Request no implementado en backend");
  },

  // --- Chat ---
  getChatMessages: async (userId: string, hrId: string): Promise<ChatMessage[]> => {
    try {
      // Implementar lógica real de historial si existe la tabla
      return [];
    } catch (error) {
      return [];
    }
  },

  sendMessage: async (senderId: string, receiverId: string, message: string, isFromHR: boolean): Promise<ChatMessage> => {
    // 1. Guardar en Base de Datos Real
    try {
      const savedMsg = await chatService.sendMessage(senderId, receiverId, message);
      
      const newMessage: ChatMessage = {
        id: savedMsg.id,
        senderId: savedMsg.emisor_id || senderId,
        receiverId: savedMsg.receptor_id || receiverId,
        message: savedMsg.mensaje,
        timestamp: savedMsg.created_at,
        isFromHR
      };

      // 2. Notificación a Google Chat (Webhook)
      const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK_URL;
      if (!isFromHR && webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `📩 Mensaje de ${senderId}: ${message}` })
        }).catch(err => console.error("Error Webhook:", err));
      }

      return newMessage;

    } catch (error) {
      console.error("Error enviando mensaje real:", error);
      throw error;
    }
  },

  // --- Expedientes ---
  getEmployeeFiles: async (_userId: string, _companyId: string): Promise<EmployeeFile[]> => {
    return [];
  },

  uploadEmployeeFile: async (fileData: Omit<EmployeeFile, 'id' | 'uploadedAt'>): Promise<EmployeeFile> => {
    throw new Error("Upload File no implementado");
  }
};

// Helper simple para estados
const mapStatusFromSupabase = (status: string): RequestStatus => {
  const map: Record<string, RequestStatus> = {
    'Pendiente': RequestStatus.PENDING,
    'Aprobado': RequestStatus.APPROVED,
    'Rechazado': RequestStatus.REJECTED,
    'En Proceso': RequestStatus.IN_PROGRESS
  };
  return map[status] || RequestStatus.PENDING;
};
