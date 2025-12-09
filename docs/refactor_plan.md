# Plan de Refactorización: Mejoras de UI/UX y Funcionalidades

Este documento detalla el plan para refactorizar la interfaz de usuario y experiencia de usuario (UI/UX) del sistema SupplyChainTracker y añadir funcionalidades críticas que actualmente están ausentes o incompletas.

## Objetivo

Mejorar significativamente la experiencia del usuario, aumentar la claridad de los flujos de trabajo y completar el ciclo funcional del sistema mediante la implementación de:

1. Un flujo de solicitud de roles robusto y bien documentado.
2. Un sistema interactivo de progreso del ciclo de vida de la netbook.
3. Un comportamiento de búsqueda más eficiente y útil.
4. Mejoras generales de accesibilidad y feedback visual.
5. Un sistema de navegación más intuitivo.

---

## Tareas de Desarrollo y Priorización

### 1. Implementar Sistema Interactivo de Progreso del Ciclo de Vida

**Prioridad**: Alta
**Componente**: `web/src/components/netbooks/NetbookDetails.tsx` y `web/src/app/admin/netbooks/page.tsx`
**Estado Actual**: El componente `NetbookDetails` tiene una variable `setExpandedStep` que está siendo utilizada pero no definida, lo que causa un error de React.
**Tareas**:

- [ ] Definir y gestionar el estado `expandedStep` localmente en `NetbookDetails`.
- [ ] Implementar la lógica para expandir colapsar cada paso del ciclo de vida al hacer clic en el ícono.
- [ ] Añadir contenido descriptivo detallado para los pasos de `HW Auditado` (especificaciones del reporte, auditor) y `SW Validado` (versión del Sistema Operativo, resultado). Reutilizar la lógica de renderizado condicional ya presente.
- [ ] Añadir CSS para asegurar que el contenido expandido no cree desbordamientos y se posicione correctamente (por encima de otros elementos).
- [ ] Asegurar que solo un paso esté expandido a la vez (comportamiento de acordeón).

### 2. Mejorar el Fluir de Solicitud de Roles

**Prioridad**: Alta
**Componentes**: `web/src/components/roles/RoleRequest.tsx` y `web/src/app/dashboard/page.tsx`
**Estado Actual**: La navegación al hacer clic en "Solicitar Roles" en el dashboard no realiza ninguna acción.
**Tareas**:

- [ ] Añadir un `id="role-request"` al contenedor principal del componente `RoleRequest` (div raíz con `className="space-y-6"`).
- [ ] Probar que el click en el botón del dashboard desplaza a la vista del componente `RoleRequest`.

### 3. Mejorar la Búsqueda de Netbooks

**Prioridad**: Media
**Componentes**: `web/src/components/netbooks/NetbookSearch.tsx` y `web/src/app/admin/netbooks/page.tsx`
**Estado Actual**: No se ha implementado una función para obtener todos los números de serie del contrato.
**Tareas**:

- [ ] Añadir una función `getAllNetbookSerialNumbers` en el `Web3Service` (`web/src/lib/services/Web3Service.ts`) que simule o implemente la recuperación de todos los seriales. Dado que el contrato no expone esta función, se debe investigar una solución alternativa como el uso de eventos de registro (si están emitidos) o crear una solución en memoria temporal para fines de demostración.
- [ ] Añadir un mecanismo de autocompletado (autocomplete) al `Input` de búsqueda, sugiriendo números de serie disponibles a medida que el usuario escribe.
- [ ] Mejorar el feedback visual durante el proceso de búsqueda (spinner, mensaje de "no encontrado").

### 4. Refinamiento General de UI/UX

**Prioridad**: Media
**Estado Actual**: Aunque el diseño es moderno, se pueden hacer mejoras en coherencia y jerarquía visual.
**Tareas**:

- [ ] Revisar la consistencia de los colores, bordes y espaciados en todo el sistema, especialmente en `Card`, `Badge` y `Button` components.
- [ ] Añadir notificaciones `toast` para todas las transacciones (registro de netbooks, auditoría de HW, validación de SW) con el hash de la transacción.
- [ ] Mejorar el feedback visual de carga en todos los componentes, usando skeletons o animaciones apropiadas.
- [ ] Añadir `title` o `aria-label` a todos los íconos botón para mejorar el soporte para lectores de pantalla.

### 5. Mejorar la Navegación y Estado

**Prioridad**: Baja
**Estado Actual**: La navegación es funcional pero podría ser más clara en ciertos puntos.
**Tareas**:

- [ ] Añadir un `Breadcrumb` en las páginas de `/admin/*` (e.g., `Inicio > Administración > Gestión de Roles`).
- [ ] Revisar el comportamiento del indicador de roles en el `Header` y asegurar que los permisos sean verificados de manera consistente.

---

## Implementación Inmediata

Se comenzará con las tareas de **Alta Prioridad**: El sistema de progreso interactivo y la corrección del flujo de solicitud de roles, ya que son críticos para una experiencia de demostración efectiva.

## Dependencias

- La tarea 3 (`Mejorar la Búsqueda de Netbooks`) depende de una solución técnica viable para obtener los números de serie desde la blockchain. Si no es posible, se optará por una solución alternativa mockeada.
- Las modificaciones en el frontend `web` dependen exclusivamente del estado actual del backend `sc`, que se asume como inmutable para esta fase de refactorización.

Este plan será implementado paso a paso, validando cada cambio antes de pasar al siguiente.