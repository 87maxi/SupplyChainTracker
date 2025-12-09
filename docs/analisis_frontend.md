# Análisis del Frontend: Web

Este documento presenta un análisis detallado del proyecto frontend `web`, que consume el contrato inteligente `SupplyChainTracker` y proporciona una interfaz web para su gestión.

## 1. Información General

- **Nombre**: `web`
- **Ubicación**: `web/`
- **Framework**: Next.js 16.0.7 (App Router)
- **Bibliotecas Clave**:
  - `ethers` v6.16.0: Para la interacción con Ethereum.
  - `viem`: Framework de código abierto para Ethereum (aunque en este código se usa más `ethers`).
  - `react` 19.2.0, `next` 16.0.7
  - `lucide-react`, `sonner`, `@hookform/resolvers`, `zod`.
  - UI Componentes: Utiliza un sistema basado en `@radix-ui`, `shadcn/ui` y Tailwind CSS con componentes personalizados en `web/components/ui/`.
  - Testing: `jest`. Linting: `eslint`.
- **Configuración**: Usa TypeScript (`tsconfig.json`), ESLint (`eslint.config.mjs`), y PostCSS (`postcss.config.mjs`). Vite no está presente, lo cual es inusual para Next.js 13+.

## 2. Arquitectura y Estructura de Componentes

```
src/
├── app/
│   ├── page.tsx           # Página de inicio/Landing
│   ├── layout.tsx         # Layout raíz
│   ├── dashboard/
│   ├── admin/
│   └── profile/
├── components/
│   ├── admin/             # Componentes específicos de administración
│   ├── dashboard/
│   ├── layout/            # Componentes de UI compartidos (Header, Breadcrumbs)
│   ├── netbooks/          # Componentes para netbooks
│   └── ui/                # Componentes UI base (Button, Card, Badge, etc.)
├── contracts/
│   └── SupplyChainTrackerABI.json  # ABI del contrato
├── lib/
│   ├── contexts/          # Contextos de React (Web3Context)
│   ├── hooks/             # Hooks personalizados (useWallet)
│   ├── services/          # Lógica de negocio y servicios Web3 (Web3Service)
│   ├── types/             # Tipos globales (Netbook, UserRoleStatus, etc.)
│   └── utils.ts           # Funciones de utilidad
```

## 3. Contexto y Gestión del Estado

### 3.1. `Web3Context`

Ubicado en `src/lib/contexts/Web3Context.tsx`. Es el corazón de la aplicación, provee el estado de conexión, dirección, Firmante (`signer`) y el `Web3Service` a todo el árbol de componentes.

- **Valores Proveídos (`Web3ContextType`)**:
  - `address`: Dirección de la wallet conectada.
  - `isConnected`: Booleano que indica si hay una conexión activa.
  - `hasAnyRole`, `isManufacturer`, `isAuditor`, etc.: Estados booleanos que indican los roles del usuario.
  - `web3Service`: Instancia del `Web3Service` (crucial para la lógica).
  - `refreshRoles`: Función para refrescar manualmente los roles (importante después de una aprobación).

- **Lógica Interna**:
  - Usa `useWallet` para conectar/desconectar y obtener el `signer`.
  - Crea una instancia de `Web3Service` con el `signer`.
  - `useCallback` y `useEffect` para `checkRoles`, que interroga el contrato para determinar todos los roles del usuario (`hasRole`) y actualiza los estados correspondientes (`isAdmin`, `isManufacturer`, etc.).
  - Implementa un "debounce" sencillo para evitar refrescos masivos.

### 3.2. `useWallet`

Un hook personalizado que encapsula la lógica de conexión con MetaMask. Utiliza `window.ethereum` para solicitar cuentas y crear un `BrowserProvider` y un `signer`. Es un wrapper limpio alrededor de `ethers`.

## 4. Servicio de Interacción con el Contrato (Web3Service)

El `Web3Service` (`src/lib/services/Web3Service.ts`) es la capa de abstracción principal que interactúa con el contrato.

### 4.1. Constructor y Proveedores

```typescript
class Web3Service {
  public readOnlyContract: ethers.Contract;
  private signer: Signer | null;

  constructor(signer: Signer | null) {
    // Proveedor de lectura (JsonRpcProvider) para "view" functions
    const readOnlyProvider = new ethers.JsonRpcProvider(RPC_URL);
    this.readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, SupplyChainTrackerABI, readOnlyProvider);
    
    // `signer` para funciones de escritura (transactions)
    this.signer = signer;
  }
  
  // Obtiene el contrato con firmante, lanzando error si no hay signer.
  private async getContractWithSigner(): Promise<ethers.Contract> {
    if (!this.signer) throw new Error('Wallet not connected...');
    return new ethers.Contract(CONTRACT_ADDRESS, SupplyChainTrackerABI, this.signer);
  }
}
```

La separación en un **contrato de solo lectura** y otro de **solo escritura** es una buena práctica que mejora la eficiencia y confiabilidad.

### 4.2. Métodos

El `Web3Service` expone todos los métodos necesarios del contrato, divididos en **lectura (view)** y **escritura (transactions)** y maneja sus tipos.

#### Métodos de Lectura

Estos usan `this.readOnlyContract` y devuelven promesas con tipos adaptables.

- **`hasRole(role, account)`**: Interioriza perfectamente el `boolean` devuelto por el contrato.
- **`getRoleStatus(role, account)`**: Mapea el array de retorno a `UserRoleStatus`. **Nota**: Automáticamente convierte `BigInt` a `string` en timestamps y `number` en el estado.
- **`getAllPendingRoleRequests()`**: Una función clave que mapea todas las solicitudes pendientes. Es fundamental para la funcionalidad del Dashboard.
- **`getNetbookReport(serialNumber)`**: Mapea exactamente los 13 campos de la estructura `Netbook` del contrato a la interfaz `NetbookReport`. Convierte los `uint` y `bytes32` del contrato a `string` o `number` para el frontend y maneja `BigInt`.
- **`getNetbookState(serialNumber)`**: Convierte `uint` (BigNumber) a `number`.

#### Métodos de Escritura

Recuperan el contrato con firmante usando `getContractWithSigner()`, ejecutan la transacción, esperan su confirmación (`tx.wait(1, 2000)`), y devuelven el hash de la transacción para notificaciones.

- `approveRole`, `rejectRole`, `registerNetbooks`, `auditHardware`, etc.: Son directamente equivalentes a las funciones del contrato.
- Todos tienen un manejo de errores robusto con un método privado `handleError` que transforma los errores de `ethers` en un objeto `ContractError` consistente.

### 4.3. Funciones Auxiliares

- **`getRoleConstants()`**: Exporta los valores "hardcodeados" de los hashes de roles (0x...796d, 0x...88ee, etc.). Son los mismos que se generan con `keccak256` en el contrato.
- **`fetchRoleConstants(Web3Service)`**: Intenta obtener los roles desde el contrato (mejor práctica), y si falla, usa los hardcoded. Muy importante para mantener la coherencia.

## 5. Componentes Principales

### 5.1. Dashboard (`EnhancedDashboard.tsx`)

Componente principal para usuarios conectados. Muestra un dashboard adaptativo basado en los roles del usuario.

- **Lógica de Acciones**: Define un objeto `roleActions` que muestra diferentes `Button`s de acceso a funciones según el rol del usuario (`isDefaultAdmin`, `isAdmin`).
- **Indicadores para Admin de Anvil**: Si la dirección es "0xf39...266", detecta si el usuario *debería* ser admin pero el sistema no lo reconoce, mostrando un