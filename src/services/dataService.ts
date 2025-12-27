import { User, Role, Project, Request, RequestStatus, RequestType, Company, ChatMessage, EmployeeFile } from '../types';
import { authService, profileService, empresaService, solicitudService, chatService } from './supabaseService';

// Helper para mapear estados de Supabase a RequestStatus
const mapStatusFromSupabase = (status: string): RequestStatus => {
  const statusMap: Record<string, RequestStatus> = {
    'Pendiente': RequestStatus.PENDING,
    'Aprobado': RequestStatus.APPROVED,
    'Rechazado': RequestStatus.REJECTED,
    'En Proceso': RequestStatus.IN_PROGRESS
  };
  return statusMap[status] || RequestStatus.PENDING;
};

export const dataService = {
  // Autenticación
  login: async (email: string, password: string, _userType: 'collaborator' | 'hr'): Promise<User> => {
    try {
      const { user } = await authService.login(email, password);
      if (user) {
        const profile = await profileService.getProfileWithEmpresa(user.id);
        if (profile) {
          return {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name || '',
            role: profile.role === 'HR' ? Role.HR : Role.COLLABORATOR,
            department: profile.area || 'Por asignar',
            leader: 'Por asignar',
            startDate: profile.fecha_ingreso || new Date().toISOString(),
            ptoTotal: 15,
            ptoTaken: 0,
            skills: [],
            area: profile.area || undefined,
            idType: profile.tipo_identificacion || undefined,
            idNumber: profile.numero_identificacion || undefined,
            personalEmail: profile.correo_personal || undefined,
            mobilePhone: profile.telefono_whatsapp || undefined,
            avatarUrl: profile.avatar_url || 'https://picsum.photos/200/200',
            empresaId: profile.empresa_id || undefined
          };
        }
      }
      throw new Error('No se pudo obtener el perfil del usuario');
    } catch (error) {
      console.error('Login error:', error);
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
      // Registrar usuario en Supabase Auth
      // El trigger en Supabase creará automáticamente el perfil
      const { user } = await authService.register(
        userData.email,
        userData.password,
        userData.fullName,
        userData.role
      );
      
      if (user) {
        // Esperar un momento para que el trigger cree el perfil
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Intentar actualizar el perfil con datos adicionales
        try {
          await profileService.updateProfile(user.id, {
            rol_puesto: userData.role,
          });
        } catch (updateError) {
          console.warn('No se pudo actualizar el perfil adicional:', updateError);
        }
        
        return {
          id: user.id,
          email: userData.email,
          fullName: userData.fullName,
          role: Role.COLLABORATOR,
          department: 'Por asignar',
          leader: 'Por asignar',
          startDate: new Date().toISOString(),
          ptoTotal: 15,
          ptoTaken: 0,
          skills: [],
          avatarUrl: 'https://picsum.photos/200/200'
        };
      }
      throw new Error('No se pudo crear el usuario');
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // Usuarios
  getUser: async (id: string): Promise<User> => {
    try {
      const profile = await profileService.getProfileWithEmpresa(id);
      if (profile) {
        return {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name || '',
          role: profile.role === 'HR' ? Role.HR : Role.COLLABORATOR,
          department: profile.area || 'Por asignar',
          leader: 'Por asignar',
          startDate: profile.fecha_ingreso || new Date().toISOString(),
          ptoTotal: 15,
          ptoTaken: 0,
          skills: [],
          avatarUrl: profile.avatar_url || 'https://picsum.photos/200/200',
          empresaId: profile.empresa_id || undefined
        };
      }
      throw new Error('Usuario no encontrado');
    } catch (error) {
      console.error('getUser error:', error);
      throw error;
    }
  },

  // Empresas
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
      console.error('getCompanies error:', error);
      return [];
    }
  },

  createCompany: async (companyData: Omit<Company, 'id' | 'createdAt' | 'collaborators'>): Promise<Company> => {
    try {
      const empresa = await empresaService.create({
        nombre: companyData.name,
        nit_identificacion: companyData.businessId
      });
      return {
        id: empresa.id,
        name: empresa.nombre,
        businessId: empresa.nit_identificacion || '',
        industry: companyData.industry,
        address: companyData.address,
        phone: companyData.phone,
        contactEmail: companyData.contactEmail,
        hrManagerId: companyData.hrManagerId,
        createdAt: empresa.created_at,
        collaborators: []
      };
    } catch (error) {
      console.error('createCompany error:', error);
      throw error;
    }
  },

  getCollaboratorsByCompany: async (companyId: string): Promise<User[]> => {
    try {
      const collaborators = await empresaService.getCollaborators(companyId);
      return collaborators.map((c: any) => ({
        id: c.id,
        email: c.email,
        fullName: c.full_name || '',
        role: c.role === 'HR' ? Role.HR : Role.COLLABORATOR,
        department: c.area || 'Por asignar',
        leader: 'Por asignar',
        startDate: c.fecha_ingreso || new Date().toISOString(),
        ptoTotal: 15,
        ptoTaken: 0,
        skills: [],
        avatarUrl: c.avatar_url || 'https://picsum.photos/200/200'
      }));
    } catch (error) {
      console.error('getCollaboratorsByCompany error:', error);
      return [];
    }
  },

  // Proyectos
  getProjects: async (): Promise<Project[]> => {
    // TODO: Implementar tabla de proyectos en Supabase
    return [];
  },

  // Solicitudes
  getRequests: async (userId?: string): Promise<Request[]> => {
    try {
      if (userId) {
        const solicitudes = await solicitudService.getByColaborador(userId);
        return solicitudes.map(s => ({
          id: s.id,
          userId: s.colaborador_id,
          type: s.tipo as RequestType,
          details: s.detalles || '',
          date: s.created_at,
          status: mapStatusFromSupabase(s.estatus),
          companyName: (s as any).empresas?.nombre
        }));
      }
      return [];
    } catch (error) {
      console.error('getRequests error:', error);
      return [];
    }
  },

  getAllRequests: async (): Promise<Request[]> => {
    try {
      const solicitudes = await solicitudService.getAll();
      return solicitudes.map(s => ({
        id: s.id,
        userId: s.colaborador_id,
        type: s.tipo as RequestType,
        details: s.detalles || '',
        date: s.created_at,
        status: mapStatusFromSupabase(s.estatus),
        companyName: (s as any).empresas?.nombre
      }));
    } catch (error) {
      console.error('getAllRequests error:', error);
      return [];
    }
  },

  createRequest: async (type: RequestType, details: string, userId: string, companyName?: string, empresaId?: string): Promise<Request> => {
    try {
      if (!empresaId) {
        throw new Error('Se requiere el ID de la empresa');
      }
      const solicitud = await solicitudService.create({
        colaborador_id: userId,
        empresa_id: empresaId,
        tipo: type,
        detalles: details
      });
      return {
        id: solicitud.id,
        userId: solicitud.colaborador_id,
        type: solicitud.tipo as RequestType,
        details: solicitud.detalles || '',
        date: solicitud.created_at,
        status: RequestStatus.PENDING,
        companyName
      };
    } catch (error) {
      console.error('createRequest error:', error);
      throw error;
    }
  },

  updateRequestStatus: async (requestId: string, status: RequestStatus): Promise<Request> => {
    try {
      const statusMap: Record<RequestStatus, string> = {
        [RequestStatus.PENDING]: 'Pendiente',
        [RequestStatus.APPROVED]: 'Aprobado',
        [RequestStatus.REJECTED]: 'Rechazado',
        [RequestStatus.IN_PROGRESS]: 'En Proceso'
      };
      const solicitud = await solicitudService.updateStatus(requestId, statusMap[status]);
      return {
        id: solicitud.id,
        userId: solicitud.colaborador_id,
        type: solicitud.tipo as RequestType,
        details: solicitud.detalles || '',
        date: solicitud.created_at,
        status: status,
        companyName: ''
      };
    } catch (error) {
      console.error('updateRequestStatus error:', error);
      throw error;
    }
  },

  // Chat
  getChatMessages: async (userId: string, hrId: string): Promise<ChatMessage[]> => {
    try {
      const messages = await chatService.getMessages(userId, hrId);
      return messages.map(m => ({
        id: m.id,
        senderId: m.emisor_id || '',
        receiverId: m.receptor_id || '',
        message: m.mensaje,
        timestamp: m.created_at,
        isFromHR: m.emisor_id === hrId
      }));
    } catch (error) {
      console.error('getChatMessages error:', error);
      return [];
    }
  },

  sendMessage: async (senderId: string, receiverId: string, message: string, isFromHR: boolean): Promise<ChatMessage> => {
    try {
      const chatMessage = await chatService.sendMessage(senderId, receiverId, message);
      return {
        id: chatMessage.id,
        senderId: chatMessage.emisor_id || '',
        receiverId: chatMessage.receptor_id || '',
        message: chatMessage.mensaje,
        timestamp: chatMessage.created_at,
        isFromHR
      };
    } catch (error) {
      console.error('sendMessage error:', error);
      throw error;
    }
  },

  // Expedientes
  getEmployeeFiles: async (_userId: string, _companyId: string): Promise<EmployeeFile[]> => {
    // TODO: Implementar tabla de expedientes en Supabase
    return [];
  },

  uploadEmployeeFile: async (fileData: Omit<EmployeeFile, 'id' | 'uploadedAt'>): Promise<EmployeeFile> => {
    // TODO: Implementar subida de archivos a Supabase Storage
    const newFile: EmployeeFile = {
      ...fileData,
      id: `file-${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };
    return newFile;
  }
};