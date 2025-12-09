# Análisis Detallado de la Aplicación Web

Este documento proporciona un análisis exhaustivo de la aplicación frontend (proyecto `@web`), que interactúa con el contrato `SupplyChainTracker`. Se revisa la arquitectura, framework, componentes clave, servicios web3 y coherencia con el contrato inteligente.

## 1. Información General

- **Nombre del Proyecto**: `@web`
- **Ubicación**: `web/`
- **Lenguaje**: TypeScript
- **Framework**: Next.js 16.0.7
- **Estilos**: Tailwind CSS
- **Bibliotecas Clave**: `ethers` (v6.16.0), `viem`, `react` (v19.2.0), `@hookform/resolvers`, `sonner`, `zod`
- **Función Principal**: Proporcionar una interfaz de usuario segura y funcional para usuarios y administradores para interactuar con el contrato de trazabilidad.

## 2. Framework y Configuración

El proyecto web utiliza **Next.js**, un framework React con capacidades de renderizado híbrido (SSR/SSG/CSR), ideal para aplicaciones blockchain claras, ya que utiliza:
- **`next.config.ts`**: Configura el proyecto Next.js.
- **`package.json`**: Define dependencias, incluyendo `next`, `react`, `ethers` para RPCs, y UI frameworks como `@radix-ui`.
- **`.env.local` y `.env.example`**: Almacenan variables de configuración como `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_RPC_URL` y `NEXT_PUBLIC_CHAIN_ID`.
- **Routing**: Se basa en el sistema de archivos (App Router), con rutas como `/admin/netbooks`, `/dashboard`, `/profile`.

### 2.1. Estado Global (**Web3Context**)
El contexto `useWeb3` es fundamental. Administrado en `src/lib/contexts/Web3Context.tsx`:
- **Rol**: Proporciona acceso global a la dirección del usuario, estado de conexión, roles (con `isDefaultAdmin`, `isManufacturer`, etc.) y `web3Service`.
- **Función `checkRoles`**: Utiliza `Promise.all()` para consultar paralelamente si el usuario (`address`) tiene asignados los roles (`hasRole`) mediante `Web3Service`. 
- **`refreshRoles`**: Permite actualización manual de roles tras una acción, crucial para la coherencia del frontend después de una aprobación.

## 3. Análisis de la Interacción Web3

### 3.1. Hook `useWallet` (`src/lib/hooks/useWallet.ts`)
- **Inicialización**: Conecta con proveedores EIP-1193 (MetaMask) mediante `window.ethereum`.
- **Eventos**: Escucha `accountsChanged` y `chainChanged` para actualizar el estado reactivamente.
- **Estado**: Mantiene `address`, `signer`, `provider` y flags como `isConnected` y `isLoading`.
- **Funciones**: `connectWallet` (solicita acceso) y `disconnectWallet` (borra estado y localStorage).

### 3.2. Servicio Web3 (`src/lib/services/Web3Service.ts`)
Esta clase centraliza toda la interacción con el contrato.

#### Clave: Separación de Lectura/Escritura
- **`readonlyContract`**: Utiliza `JsonRpcProvider(RPC_URL)` para **lecturas eficientes** sin necesidad de un signer.
- **`getContractWithSigner()`**: Crea un contrato con el `signer` conectado para **transacciones**.

#### 3.2.1. Métodos de Lectura (View)
Los métodos son `async` y llaman a funciones `view` del contrato.

| Método | Contrato (`SupplyChainTracker`) | Descripción |
|---|---|---|
| `hasRole(role, account)` | `hasRole(role, account)` | Verifica si una cuenta tiene un rol (OpenZeppelin). |
| `getRoleStatus(role, account)` | `getRoleStatus(role, account)` | Obtiene el historial de aprobación de un rol (función personalizada). |
| `getAllPendingRoleRequests()` | `getAllPendingRoleRequests()` | Obtiene todas las solicitudes pendientes para listarlas.
| `getNetbookReport(serial)` | `getNetbookReport(serial)` | Obtiene el reporte completo de una netbook.
| `getNetbookState(serial)` | `getNetbookState(serial)` 	| Obtiene el estado actual de la netbook (0, 1, 2, 3).
| `getRoleAdmin(role)` | `getRoleAdmin(role)` | Obtiene el rol administrador de un rol específico (OpenZeppelin).
| `getRoleApproval(...)`, `getPendingRequest(...)` | Mappings/arrays públicos |	Funciones de conveniencia para lectura directa.

**Manejo de Tipos**: Convierte explícitamente `BigInt` (Solidity) a `number` o `string` para compatibilidad con el frontend.

#### 3.2.2. Métodos de Escritura (Transacciones)
Todos los métodos de escritura reciben comandos, crean una transacción y esperan una confirmación.

| Método (Web3Service) | Función del Contrato | Descripción |
|---|---|---|
| `requestRoleApproval(role)` | `requestRoleApproval(role)` | Solicita que se apruebe un rol al usuario.
| `approveRole(role, account)` | `approveRole(role, account)` | (Solo Admin) Aprueba la solicitud de otra cuenta. |
| `rejectRole(role, account)` | `rejectRole(role, account)` | (Solo Admin) Rechaza la solicitud de otra cuenta. |
| `cancelRoleRequest(role)` | `cancelRoleRequest(role)` | El usuario cancela su propia solicitud pendiente. |
| `revokeRoleApproval(role, account)` | `revokeRoleApproval(role, account)` | (Solo Admin) Revoca un rol ya concedido. |
| `grantRole(role, account)` | `grantRole(role, account)` | (Solo Admin) Otorga directamente un rol sin flujo de aprobación. |
| `revokeRole(role, account)` | `revokeRole(role, address)` | (Solo Admin) Revoca un rol otorgado. |
| `registerNetbooks(...)` | `registerNetbooks(...)` | (Solo Fabricante) Registra múltiples netbooks. |
| `auditHardware(...)` | `auditHardware(...)` | (Solo AuditorHW) Audita el hardware de una netbook. |
| `validateSoftware(...)` | `validateSoftware(...)` | (Solo TecnicoSW) Validar el software de una netbook. |
| `assignToStudent(...)` | `assignToStudent(...)` | (Solo Escuela) Asigna una netbook a un estudiante. |

**Manejo de Errores**: El método privado `handleError` normaliza errores de `ethers` para un retorno consistente. Añade tonalidad a los errores del contrato (solo `reason`) para una mejor UX.

#### 3.2.3. Funciones de Apoyo
- `getRoleConstants()`				Externalizacion de los hashes de rol del contrato, permitiendo al frontend hacer referencias claras (e.g., `getRoleConstants().FABRICANTE_ROLE`).
- `fetchRoleConstants(web3Service)`			Intenta obtener dinámicamente los roles del contrato para mayor seguridad (fallback a los valores hardcoded).

### 3.3. Coherencia ABI-Contrato
El archivo `src/contracts/SupplyChainTrackerABI.json` contiene la interfaz completa del contrato. **Se verificó la coherencia, y todos los métodos del Web3Service (lectura y escritura) hacen llamadas a funciones cuyos nombres y firmas coinciden exactamente con las definidas en el ABI.**

## 4. Análisis de Componentes Clave

### 4.1. Componente de Solicitud de Rol (`RoleRequest.tsx`)
- **Ubicación**: `src/components/roles/RoleRequest.tsx`
- **Función**: Permite a un usuario (Regular User) solicitar un rol para acceder a las funciones principales del sistema.
- **Flujo de Interacción**:
  1. Con `useWeb3`, obtiene el `address` del usuario conectado.
  2. Utiliza `web3Service.getRoleStatus(role, address)` para determinar el estado actual del rol del usuario (No Solicitado, Pendiente, Aprobado, Rechazado, Cancelado).
  3. Renderiza una interfaz clara por cada rol con un bot