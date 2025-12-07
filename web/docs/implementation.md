# Implementación del Panel de Administración Web3

## Arquitectura del Sistema

El panel de administración para el sistema de trazabilidad de netbooks educativas se ha implementado siguiendo una arquitectura basada en componentes con Next.js 15 y TypeScript, integrando completamente la funcionalidad Web3 para la interacción con el contrato inteligente `SupplyChainTracker`.

### Estructura de Directorios

```
web/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── ConnectButton.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   └── NetbookStatusChart.tsx
│   ├── admin/
│   │   ├── UserRoleForm.tsx
│   │   └── UserList.tsx
│   └── netbooks/
│       ├── NetbookSearch.tsx
│       ├── NetbookStatus.tsx
│       └── NetbookDetails.tsx
├── lib/
│   ├── contexts/
│   │   └── Web3Context.tsx
│   ├── hooks/
│   │   └── useWallet.ts
│   ├── services/
│   │   └── Web3Service.ts
│   ├── types/
│   │   └── index.ts
│   └── utils.ts
├── public/
├── src/
│   └── app/
│       ├── page.tsx
│       └── admin/
│           ├── users/
│           │   └── page.tsx
│           └── netbooks/
│               └── page.tsx
├── .env.example
├── docs/
│   └── implementation.md
└── package.json
```

## Componentes Principales

### Contexto Web3

El sistema utiliza un contexto React (`Web3Context`) para gestionar el estado de la conexión con la wallet del usuario. Este contexto proporciona acceso a la dirección del usuario, estado de conexión y funciones para conectar/desconectar, con persistencia mediante `localStorage`.

### Hook useWallet

El hook personalizado `useWallet` encapsula toda la lógica de conexión con MetaMask, incluyendo:
- Detección de la extensión de MetaMask
- Conexión y desconexión de cuentas
- Escucha de cambios en las cuentas
- Gestión de estados de carga

### Servicio Web3Service

El servicio `Web3Service` actúa como una capa de abstracción entre la interfaz y el contrato inteligente. Proporciona métodos para todas las funciones críticas del contrato:

- Gestión de roles: `grantRole`, `revokeRole`, `hasRole`, `getRoleStatus`
- Operaciones de netbooks: `getNetbookReport`, `getNetbookState`
- Registro y actualización: `registerNetbooks`, `auditHardware`, `validateSoftware`, `assignToStudent`

El servicio maneja errores de manera segura y proporciona tipos TypeScript para todos los métodos.

## Funcionalidades Implementadas

### Dashboard Principal

La página principal (`/`) muestra un resumen del sistema con estadísticas clave y un gráfico de estado de las netbooks. Solo los usuarios con el rol de administrador pueden acceder a esta vista completa.

### Gestión de Usuarios

La página `/admin/users` permite a los administradores:
- Asignar roles a direcciones de Ethereum
- Revocar roles existentes
- Ver la lista completa de usuarios con roles asignados

Se incluye validación de formulario y manejo de errores con notificaciones.

### Trazabilidad de Netbooks

La página `/admin/netbooks` permite buscar netbooks por número de serie y ver:
- Estado actual en el ciclo de vida
- Progreso del proceso de trazabilidad
- Detalles completos del dispositivo
- Información de auditoría de hardware y software
- Datos de asignación a estudiantes

## Seguridad y Validación

El sistema implementa múltiples capas de seguridad:

1. **Verificación de roles**: Antes de mostrar contenido administrativo, se verifica que el usuario tenga el rol de administrador.
2. **Validación de direcciones**: Todas las direcciones de Ethereum ingresadas se validan para asegurar el formato correcto.
3. **Protección contra auto-modificación**: Los administradores no pueden modificar sus propios roles.
4. **Manejo de errores**: Todos los errores de contrato se capturan y se presentan al usuario de manera amigable.

## Responsividad

La interfaz se ha diseñado para ser completamente responsiva, utilizando Tailwind CSS para adaptarse a diferentes tamaños de pantalla:
- Móviles: Diseño de columna única
- Tablets: Diseño de dos columnas
- Escritorio: Diseño de múltiples columnas para maximizar el espacio disponible

## Integración con el Contrato

El sistema se integra con el contrato `SupplyChainTracker` utilizando el ABI proporcionado en `web/src/contracts/SupplyChainTrackerABI.json`. Se han definido constantes para los roles del sistema:

- `DEFAULT_ADMIN_ROLE`: 0x0000...0000
- `FABRICANTE_ROLE`: 0x98fc...9a5e
- `AUDITOR_HW_ROLE`: 0x1ae4...325e
- `TECNICO_SW_ROLE`: 0xe1e7...429c
- `ESCUELA_ROLE`: 0x7b27...9e7d

Estas constantes se utilizan en todas las operaciones de gestión de roles para asegurar la consistencia.

## Próximos Pasos

- Implementar pruebas unitarias para los componentes y servicios
- Añadir soporte para múltiples redes blockchain
- Implementar paginación y búsqueda avanzada en la lista de usuarios
- Añadir logs de transacciones completos
- Implementar notificaciones en tiempo real para cambios de estado