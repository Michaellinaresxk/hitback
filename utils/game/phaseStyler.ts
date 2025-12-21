export const getPhaseStyle = (phase: string) => {
  switch (phase) {
    case 'loading':
      return { backgroundColor: '#3B82F6', borderColor: '#2563EB' };
    case 'audio':
      return { backgroundColor: '#10B981', borderColor: '#059669' };
    case 'betting':
      return { backgroundColor: '#EF4444', borderColor: '#DC2626' };
    case 'question':
      return { backgroundColor: '#F59E0B', borderColor: '#D97706' };
    case 'answer':
      return { backgroundColor: '#8B5CF6', borderColor: '#7C3AED' };
    default:
      return { backgroundColor: '#64748B', borderColor: '#475569' };
  }
};

export const getPhaseLabel = (phase: string): string => {
  switch (phase) {
    case 'loading':
      return 'CARGANDO';
    case 'audio':
      return 'AUDIO';
    case 'betting':
      return 'APUESTAS';
    case 'question':
      return 'PREGUNTA';
    case 'answer':
      return 'RESPUESTA';
    default:
      return 'LISTO';
  }
};
