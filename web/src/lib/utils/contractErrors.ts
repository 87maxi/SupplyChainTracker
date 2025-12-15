export const CONTRACT_ERROR_MAP = {
  'user rejected transaction': 'El usuario rechazó la transacción',
  'Fondos insuficientes para pagar el gas': 'Fondos insuficientes para pagar el gas',
  'Red incorrecta': 'Por favor, cambie a la red correcta',
  'network error': 'Error de red. Verifique su conexión e intente nuevamente',
  'execution reverted: Rol ya aprobado': 'Ya tienes este rol aprobado',
  'execution reverted: Ya tienes una solicitud activa': 'Ya tienes una solicitud pendiente para este rol',
  'execution reverted: Ya tienes una solicitud pendiente o aprobada para este rol': 'Ya tienes una solicitud pendiente o aprobada para este rol'
};

export const handleError = (error: any): string => {
  const message = error.message || error.toString();
  
  // Buscar coincidencias en el mapeo
  for (const [key, value] of Object.entries(CONTRACT_ERROR_MAP)) {
    if (message.includes(key)) {
      return value as string;
    }
  }
  
  // Mensaje genérico
  return 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.';
};