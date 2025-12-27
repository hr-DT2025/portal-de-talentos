import { User, Role, Project, Request, RequestStatus, RequestType, Company, ChatMessage, EmployeeFile } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { authService, profileService, empresaService, solicitudService, chatService } from './supabaseService';

// ==================== MOCK DATA STORE (FALLBACK) ====================
// Estos datos se usarán si no has conectado Supabase aún o si falla la conexión

const MOCK_COLLABORATOR: User = {
  id: 'user-123',
  email: 'colaborador@empresa.com',
  fullName: 'Ana García',
  role: Role.COLLABORATOR,
  department: 'Desarrollo de Producto',
  leader: 'Carlos Rodríguez',
  startDate: '2022-03-15T00:00:00Z',
  ptoTotal: 15,
  ptoTaken: 4,
  skills: ['React', 'TypeScript', 'UI/UX', 'Comunicación Asertiva'],
  area: 'Tecnología',
  idType: 'Cédula de Identidad',
  idNumber: '12345678-9',
  personalEmail: 'ana.garcia@gmail.com',
  mobilePhone: '+569 1234 5678',
  avatarUrl: 'https://picsum.photos/200/200'
};

const MOCK_HR: User = {
  id: 'hr-456',
  email: 'rrhh@empresa.com',
  fullName: 'María González',
  role: Role.HR,
  department: 'Recursos Humanos',
  leader: 'Director General',
  startDate: '2021-01-10T00:00:00Z',
  ptoTotal: 20,
  ptoTaken: 6,
  skills: ['Gestión de Talento', 'Legislación Laboral', 'Psicología Organizacional'],
  managedCompanies: ['company-1', 'company-2'],
  avatarUrl: 'https://picsum.photos/200/201'
};

const MOCK_COMPANIES: Company[] = [
  {
    id: 'company-1',
    name: 'TechCorp Solutions',
    businessId: '76.123.456-7',
    industry: 'Tecnología',
    address: 'Av. Providencia 1234, Santiago',
    phone: '+56 2 2345 6789',
    contactEmail: 'contact@techcorp.cl',
    hrManagerId: 'hr-456',
    createdAt: '2020-06-15T00:00:00Z',
    collaborators: [MOCK_COLLABORATOR]
  },
  {
    id: 'company-2',
    name: 'Innovation Labs',
    businessId: '77.987.654-3',
    industry: 'Consultoría',
    address: 'Calle Las Condes 567, Santiago',
    phone: '+56 2 3456 7890',
    contactEmail: 'info@innovationlabs.cl',
    hrManagerId: 'hr-456',
    createdAt: '2021-03-20T00:00:00Z',
    collaborators: []
  }
];

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Redesign Portal Cliente', role: 'Frontend Lead', status: 'Active' },
  { id: '2', name: 'Migración a Nube', role: 'Support', status: 'Completed' },
  { id: '3', name: 'Hackathon Interno', role: 'Participante', status: 'Active' },
];

const MOCK_REQUESTS: Request[] = [
  { id: '101', userId: 'user-123', type: RequestType.TIME_OFF, details: 'Vacaciones de verano', date: '2023-11-10', status: RequestStatus.APPROVED, companyName: 'TechCorp Solutions' },
  { id: '102', userId: 'user-123', type: RequestType.CERTIFICATE, details: 'Para trámite bancario', date: '2024-01-15', status: RequestStatus.PENDING, companyName: 'TechCorp Solutions' },
  { id: '103', userId: 'user-123', type: RequestType.REFERENCE, details: 'Referencia para nuevo empleo', date: '2024-02-01', status: RequestStatus.IN_PROGRESS, companyName: 'TechCorp Solutions' },
];

const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-1',
    senderId: 'user-123',
    receiverId: 'hr-456',
    message: 'Hola, necesito información sobre mis vacaciones pendientes.',
    timestamp: '2024-01-15T10:30:00Z',
    isFromHR: false
  },
  {
    id: 'chat-2',
    senderId: 'hr-456',
    receiverId: 'user-123',
    message: '¡Hola Ana! Tienes 11 días de vacaciones disponibles. ¿En qué fechas te gustaría tomarlas?',
    timestamp: '2024-01-15T10:35:00Z',
    isFromHR: true
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== DATA SERVICE (HYBRID IMPL) ====================

export const dataService = {
  // --- Autenticación ---
  login: async (email: string, password: string, userType: 'collaborator' | 'hr'): Promise<User> => {
    // 1. Intentar con Supabase
    if (isSupabaseConfigured()) {
      try {
        const { user: authUser } = await authService.login(email, password);
        if (authUser) {
          const profile = await profileService.getById(authUser.id);
          // Mapeamos el perfil de la BD al tipo User de la app
          if (profile) {
             return {
               id: profile.id,
               email: profile.email,
               fullName: profile.full_name || '',
               role: profile.role === 'HR' ? Role.HR : Role.COLLABORATOR,
               department: profile.area || 'Por asignar',
               leader: 'Por asignar',
               startDate: profile.fecha_ingreso || new Date().toISOString(),
               ptoTotal: 15, // Valor por defecto
               ptoTaken: 0,
               skills: [],
               area: profile.area || '',
               avatarUrl: profile.avatar_url || 'https://via.placeholder.com/150'
             } as User;
          }
        }
      } catch (error) {
        console.error('Supabase login error (falling back to mock):', error);
      }
    }

    // 2. Fallback a Mock Data
    await delay(800);
    if (userType === 'hr' && email.includes('rrhh')) {
      return { ...MOCK_HR, email };
    } else if (userType === 'collaborator') {
      return { ...MOCK_COLLABORATOR, email };
    }
    throw new Error('Credenciales inválidas');
  },

  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    companyName: string;
  }): Promise<User> => {
    // 1. Intentar con Supabase
    if (isSupabaseConfigured()) {
      try {
        // IMPORTANTE: Solo registramos en Auth. 
        // El Trigger de la base de datos (handle_new_user) creará el perfil automáticamente.
        // No llamamos a profileService.create() para evitar error de duplicidad.
        const { user: authUser } = await authService.register(
          userData.email, 
          userData.password, 
          userData.fullName, 
          userData.role
        );

        if (authUser) {
          return { 
            ...MOCK_COLLABORATOR, 
            id: authUser.id, 
            email: userData.email, 
            fullName: userData.fullName,
            role: userData.role === 'HR' ? Role.HR : Role.COLLABORATOR 
          };
        }
      } catch (error) {
        console.error('Supabase register error:', error);
        throw error;
      }
    }

    // 2. Fallback a Mock
    await delay(1000);
    const newUser: User = {
      ...MOCK_COLLABORATOR,
      id: `user-${Date.now()}`,
      email: userData.email,
      fullName: userData.fullName,
      role: Role.COLLABORATOR,
      department: 'Por asignar',
      leader: 'Por asignar',
      startDate: new Date().toISOString(),
      skills: []
    };
    return newUser;
  },

  // --- Usuarios ---
  getUser: async (id: string): Promise<User> => {
    if (isSupabaseConfigured()) {
      try {
        const profile = await profileService.getById(id);
        if (profile) return profile as unknown as User;
      } catch (e) { console.error(e); }
    }

    await delay(500);
    if (id === 'hr-456') return MOCK_HR;
    return MOCK_COLLABORATOR;
  },

  // --- Empresas ---
  getCompanies: async (): Promise<Company[]> => {
    if (isSupabaseConfigured()) {
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
      } catch (e) { console.error(e); }
    }

    await delay(600);
    return MOCK_COMPANIES;
  },

  createCompany: async (companyData: Omit<Company, 'id' | 'createdAt' | 'collaborators'>): Promise<Company> => {
    await delay(800);
    const newCompany: Company = {
      ...companyData,
      id: `company-${Date.now()}`,
      createdAt: new Date().toISOString(),
      collaborators: []
    };
    MOCK_COMPANIES.push(newCompany);
    return newCompany;
  },

  getCollaboratorsByCompany: async (companyId: string): Promise<User[]> => {
    await delay(600);
    const company = MOCK_COMPANIES.find(c => c.id === companyId);
    return company?.collaborators || [];
  },

  // --- Proyectos ---
  getProjects: async (): Promise<Project[]> => {
    await delay(600);
    return MOCK_PROJECTS;
  },

  // --- Solicitudes ---
  getRequests: async (userId?: string): Promise<Request[]> => {
    if (isSupabaseConfigured() && userId) {
      try {
        const requests = await solicitudService.getByUser(userId);
        return requests.map(r => ({
          id: r.id,
          userId: r.user_id,
          type: r.tipo as RequestType,
          details: r.detalles || '',
          date: r.created_at,
          status: r.estado as RequestStatus,
          companyName: '' 
        }));
      } catch (e) { console.error(e); }
    }

    await delay(600);
    if (userId) {
      return MOCK_REQUESTS.filter(req => req.userId === userId);
    }
    return MOCK_REQUESTS;
  },

  getAllRequests: async (): Promise<Request[]> => {
    await delay(600);
    return MOCK_REQUESTS;
  },

  createRequest: async (type: RequestType, details: string, userId: string, companyName?: string): Promise<Request> => {
    // Aquí podrías implementar create de solicitudService
    await delay(800);
    const newRequest: Request = {
      id: `req-${Date.now()}`,
      userId,
      type,
      details,
      date: new Date().toISOString(),
      status: RequestStatus.PENDING,
      companyName
    };
    MOCK_REQUESTS.unshift(newRequest);
    return newRequest;
  },

  updateRequestStatus: async (requestId: string, status: RequestStatus): Promise<Request> => {
    await delay(500);
    const request = MOCK_REQUESTS.find(req => req.id === requestId);
    if (request) {
      request.status = status;
    }
    return request!;
  },

  // --- Chat ---
  getChatMessages: async (userId: string, hrId: string): Promise<ChatMessage[]> => {
    if (isSupabaseConfigured()) {
      try {
        // TODO: Implementar lectura de historial real desde supabaseService
      } catch (error) {
        console.error('Supabase getChatMessages error:', error);
      }
    }
    
    await delay(600);
    return MOCK_CHAT_MESSAGES.filter(
      msg => (msg.senderId === userId && msg.receiverId === hrId) ||
             (msg.senderId === hrId && msg.receiverId === userId)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: async (senderId: string, receiverId: string, message: string, isFromHR: boolean): Promise<ChatMessage> => {
    // 1. Intentar guardar en Supabase (si está conectado)
    if (isSupabaseConfigured()) {
      try {
        await chatService.sendMessage(senderId, receiverId, message);
      } catch (e) {
        console.error("Error guardando chat en BD:", e);
      }
    }

    // 2. Crear mensaje local para la UI (Feedback inmediato)
    await delay(400);
    const newMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderId,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
      isFromHR
    };
    MOCK_CHAT_MESSAGES.push(newMessage);
    
    // 3. Enviar a Google Chat (Solo si es mensaje del empleado -> RH)
    const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK_URL;
    
    if (!isFromHR && webhookUrl) {
      console.log(`Enviando mensaje a Google Chat...`);
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `📩 Mensaje de ${senderId}: ${message}` })
        });
        console.log("Mensaje enviado a Google Chat correctamente");
      } catch (error) {
        console.error("Error enviando a Google Chat Webhook:", error);
      }
    }
    
    return newMessage;
