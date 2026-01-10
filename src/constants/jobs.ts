export const JOB_TITLES = [
  "CEO", "Director General", "HRBP", "HR Manager", "Analista de RRHH",
  "Gerente de Proyecto", "Desarrollador", "Diseñador", "Analista de Marketing",
  "Ventas", "Operaciones", "Administrativo"
];

export type SystemRole = 'SuperAdmin' | 'Director' | 'HR' | 'Colaborador';

export const calculateSystemRole = (jobTitle: string, companyName: string): SystemRole => {
  const normalizedJob = jobTitle.trim();
  const normalizedCompany = companyName.trim().toLowerCase();
  const isTalentOrDisruptive = normalizedCompany.includes('talent') || normalizedCompany.includes('disruptive');

  if (isTalentOrDisruptive && ['CEO', 'HRBP'].includes(normalizedJob)) return 'SuperAdmin';
  if (normalizedCompany === 'talent' && (normalizedJob === 'HR Manager' || normalizedJob === 'HR')) return 'HR';
  if (['Director General', 'CEO'].includes(normalizedJob)) return 'Director';
  return 'Colaborador';
};
