export enum Role {
  COLLABORATOR = 'Collaborator',
  HR = 'HR',
  ADMIN = 'Admin',
  MANAGER = 'Manager'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  department: string;
  leader: string;
  startDate: string; // ISO Date
  avatarUrl?: string;
  ptoTotal: number;
  ptoTaken: number;
  skills: string[];
  // Campos adicionales para colaboradores
  area?: string;
  idType?: string; // Tipo de Identificación
  idNumber?: string; // Número de Identificación
  personalEmail?: string;
  mobilePhone?: string;
  // Para RH
  managedCompanies?: string[];
  empresaId?: string;
}

export interface Company {
  id: string;
  name: string;
  businessId: string;
  industry: string;
  address: string;
  phone: string;
  contactEmail: string;
  hrManagerId: string;
  createdAt: string;
  collaborators: User[];
}

export interface Project {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Completed' | 'On Hold';
}

export enum RequestType {
  TIME_OFF = 'Día Libre (TPP)',
  CERTIFICATE = 'Constancia Laboral',
  RECOMMENDATION = 'Recomendación Laboral',
  REFERENCE = 'Referencia Laboral',
  CONSULTATION = 'Consulta'
}

export enum RequestStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
  IN_PROGRESS = 'En Progreso'
}

export interface Request {
  id: string;
  userId: string;
  type: RequestType;
  details: string;
  date: string;
  status: RequestStatus;
  companyName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isFromHR: boolean;
}

export interface EmployeeFile {
  id: string;
  userId: string;
  companyId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export enum Mood {
  HAPPY = 'Happy',
  NEUTRAL = 'Neutral',
  STRESSED = 'Stressed',
  TIRED = 'Tired',
  EXCITED = 'Excited'
}

export interface EmotionalLog {
  date: string;
  mood: Mood;
  aiFeedback?: string;
}
