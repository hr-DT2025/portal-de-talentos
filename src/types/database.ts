// Tipos generados basados en el esquema de Supabase

export type UserRole = 'Colaborador' | 'HR' | 'Admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          empresa_id: string | null;
          area: string | null;
          rol_puesto: string | null;
          fecha_ingreso: string | null;
          tipo_identificacion: string | null;
          numero_identificacion: string | null;
          correo_personal: string | null;
          telefono_whatsapp: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          empresa_id?: string | null;
          area?: string | null;
          rol_puesto?: string | null;
          fecha_ingreso?: string | null;
          tipo_identificacion?: string | null;
          numero_identificacion?: string | null;
          correo_personal?: string | null;
          telefono_whatsapp?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          empresa_id?: string | null;
          area?: string | null;
          rol_puesto?: string | null;
          fecha_ingreso?: string | null;
          tipo_identificacion?: string | null;
          numero_identificacion?: string | null;
          correo_personal?: string | null;
          telefono_whatsapp?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      empresas: {
        Row: {
          id: string;
          nombre: string;
          nit_identificacion: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          nit_identificacion?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          nit_identificacion?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      solicitudes: {
        Row: {
          id: string;
          colaborador_id: string;
          empresa_id: string;
          tipo: string;
          estatus: string;
          detalles: string | null;
          archivo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          colaborador_id: string;
          empresa_id: string;
          tipo: string;
          estatus?: string;
          detalles?: string | null;
          archivo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          colaborador_id?: string;
          empresa_id?: string;
          tipo?: string;
          estatus?: string;
          detalles?: string | null;
          archivo_url?: string | null;
          created_at?: string;
        };
      };
      chat_history: {
        Row: {
          id: string;
          emisor_id: string | null;
          receptor_id: string | null;
          mensaje: string;
          google_thread_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          emisor_id?: string | null;
          receptor_id?: string | null;
          mensaje: string;
          google_thread_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          emisor_id?: string | null;
          receptor_id?: string | null;
          mensaje?: string;
          google_thread_id?: string | null;
          created_at?: string;
        };
      };
      registro_colaboradores: {
        Row: {
          ID: string | null;
          'Nombres y Apellidos': string | null;
          Rol: string | null;
          Proyecto: string | null;
          'Líder': string | null;
          Status: string | null;
          'Fecha de Ingreso': string | null;
          'Antigüedad (meses)': string | null;
          'Correo corporativo': string | null;
          'Tipo de Identificación': string | null;
          'Número de Identificación': string | null;
          'Correo personal': string | null;
          'Teléfono móvil / Whatsapp': string | null;
          Salario: string | null;
          Expediente: string | null;
          'Motivo de contratación': string | null;
          'Fuente de reclutamiento': string | null;
          'Categoria de Evaluación de desempeño': string | null;
          'Fortalezas principales': string | null;
          'Áreas de mejora': string | null;
          'Comentarios del colaborador ( en caso de acercamiento con RH)': string | null;
          'Compromiso percibido (Alto/Medio/Bajo)': string | null;
          'Potencial de crecimiento (Alto/Medio/Bajo)': string | null;
          'Plan de desarrollo o próximos pasos': string | null;
          'Participación en proyectos clave': string | null;
          'Observaciones Adicionales': string | null;
          id_user: string;
        };
        Insert: {
          ID?: string | null;
          'Nombres y Apellidos'?: string | null;
          Rol?: string | null;
          Proyecto?: string | null;
          'Líder'?: string | null;
          Status?: string | null;
          'Fecha de Ingreso'?: string | null;
          'Antigüedad (meses)'?: string | null;
          'Correo corporativo'?: string | null;
          'Tipo de Identificación'?: string | null;
          'Número de Identificación'?: string | null;
          'Correo personal'?: string | null;
          'Teléfono móvil / Whatsapp'?: string | null;
          Salario?: string | null;
          Expediente?: string | null;
          'Motivo de contratación'?: string | null;
          'Fuente de reclutamiento'?: string | null;
          'Categoria de Evaluación de desempeño'?: string | null;
          'Fortalezas principales'?: string | null;
          'Áreas de mejora'?: string | null;
          'Comentarios del colaborador ( en caso de acercamiento con RH)'?: string | null;
          'Compromiso percibido (Alto/Medio/Bajo)'?: string | null;
          'Potencial de crecimiento (Alto/Medio/Bajo)'?: string | null;
          'Plan de desarrollo o próximos pasos'?: string | null;
          'Participación en proyectos clave'?: string | null;
          'Observaciones Adicionales'?: string | null;
          id_user?: string;
        };
        Update: {
          ID?: string | null;
          'Nombres y Apellidos'?: string | null;
          Rol?: string | null;
          Proyecto?: string | null;
          'Líder'?: string | null;
          Status?: string | null;
          'Fecha de Ingreso'?: string | null;
          'Antigüedad (meses)'?: string | null;
          'Correo corporativo'?: string | null;
          'Tipo de Identificación'?: string | null;
          'Número de Identificación'?: string | null;
          'Correo personal'?: string | null;
          'Teléfono móvil / Whatsapp'?: string | null;
          Salario?: string | null;
          Expediente?: string | null;
          'Motivo de contratación'?: string | null;
          'Fuente de reclutamiento'?: string | null;
          'Categoria de Evaluación de desempeño'?: string | null;
          'Fortalezas principales'?: string | null;
          'Áreas de mejora'?: string | null;
          'Comentarios del colaborador ( en caso de acercamiento con RH)'?: string | null;
          'Compromiso percibido (Alto/Medio/Bajo)'?: string | null;
          'Potencial de crecimiento (Alto/Medio/Bajo)'?: string | null;
          'Plan de desarrollo o próximos pasos'?: string | null;
          'Participación en proyectos clave'?: string | null;
          'Observaciones Adicionales'?: string | null;
          id_user?: string;
        };
      };
      sesion_usuario: {
        Row: {
          id: number;
          created_at: string;
          'correo corporativo': string | null;
          'contraseña': string | null;
          id_user: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          'correo corporativo'?: string | null;
          'contraseña'?: string | null;
          id_user?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          'correo corporativo'?: string | null;
          'contraseña'?: string | null;
          id_user?: string | null;
        };
      };
    };
  };
}

// Tipos simplificados para uso en la aplicación
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Empresa = Database['public']['Tables']['empresas']['Row'];
export type Solicitud = Database['public']['Tables']['solicitudes']['Row'];
export type ChatHistory = Database['public']['Tables']['chat_history']['Row'];
export type RegistroColaborador = Database['public']['Tables']['registro_colaboradores']['Row'];
