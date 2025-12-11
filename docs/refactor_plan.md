# Plan de Refactorización - SupplyChainTracker

## 📌 Objetivo
Mejorar la seguridad, funcionalidad y escalabilidad del sistema de trazabilidad de netbooks mediante refactorización priorizada.

---

## 🔍 Análisis de Criticidad

| Componente               | Riesgo          | Impacto                          |
|--------------------------|-----------------|----------------------------------|
| Gestión de Roles (RBAC)  | **Alto**        | Ataques de suplantación          |
| Máquina de Estados       | **Alto**        | Bloqueos en trazabilidad         |
| Auditoría de Hardware    | **Medio**       | Reportes no auditables           |
| Distribución a Estudiantes | **Medio-Alto** | Problemas legales                |
| Interfaz con Frontend    | **Alto**        | Falta de integración             |

---

## 📋 Plan de Refactorización

### **🔴 Fase 1: Crítico (Seguridad y Funcionalidad)**
1. **Refactorizar RBAC**
   - **Archivo**: [`sc/src/SupplyChainTracker.sol`](sc/src/SupplyChainTracker.sol:230-352)
   - **Acciones**:
     - Implementar `nonReentrant` en funciones de roles.
     - Validar `msg.sender` en operaciones sensibles.
   - **Impacto**: Reduce riesgo de reentrancia y suplantación.

2. **Validar Transiciones de Estados**
   - **Archivo**: [`sc/src/SupplyChainTracker.sol`](sc/src/SupplyChainTracker.sol:405-477)
   - **Acciones**:
     - Añadir validaciones estrictas en `auditHardware`, `validateSoftware`.
     - Usar `onlyApprovedRole` para todas las funciones modificativas.
   - **Impacto**: Evita estados inválidos.

3. **Asegurar Integridad de Reportes**
   - **Archivo**: [`sc/src/SupplyChainTracker.sol`](sc/src/SupplyChainTracker.sol:405-477)
   - **Acciones**:
     - Exigir firmas digitales para reportes.
     - Almacenar hashes de certificados.
   - **Impacto**: Aumenta confianza en auditorías.

---

### **🟡 Fase 2: Medio-Alto (Consistencia y Escalabilidad)**
4. **Optimizar Registro de Netbooks**
   - **Archivo**: [`sc/src/SupplyChainTracker.sol`](sc/src/SupplyChainTracker.sol:242-273)
   - **Acciones**:
     - Validar formato de `batchId` y `serialNumber`.
     - Implementar registro en lotes con costo de gas reducido.
   - **Impacto**: Elimina duplicados y mejora eficiencia.

5. **Añadir Funcionalidad de Revokación**
   - **Archivo**: Nuevo método en [`sc/src/SupplyChainTracker.sol`](sc/src/SupplyChainTracker.sol)
   - **Acciones**:
     - Implementar `revokeAndReassign` con aprobación administrativa.
     - Registrar eventos de revokación.
   - **Impacto**: Resuelve problemas legales en casos de pérdida/robos.

6. **Proteger Historial de Verificación**
   - **Archivo**: [`sc/src/SupplyChainTracker.sol`](sc/src/SupplyChainTracker.sol:54-60)
   - **Acciones**:
     - Usar `immutable` para datos críticos.
     - Implementar hash del historial.
   - **Impacto**: Garantiza inmutabilidad de auditorías.

---

### **🟢 Fase 3: Mejoras (Experiencia de Usuario y Escalabilidad)**
7. **Definir Interfaz para Frontend**
   - **Archivo**: [`sc/interfaces/IFrontendSupplyChain.sol`](sc/interfaces/IFrontendSupplyChain.sol)
   - **Acciones**:
     - Crear ABI y eventos estandarizados.
     - Documentar endpoints para consultas.
   - **Impacto**: Facilita integración con la interfaz web.

8. **Optimizar Costos de Gas**
   - **Archivo**: [`sc/src/SupplyChainTracker.sol`](sc/src/SupplyChainTracker.sol:482-537)
   - **Acciones**:
     - Reemplazar bucles con mapeos estáticos.
     - Usar `struct` para almacenamiento eficiente.
   - **Impacto**: Reduce costos en operaciones masivas.

9. **Añadir Pruebas para Casos Edge**
   - **Archivo**: [`sc/test/SupplyChainTracker.t.sol`](sc/test/SupplyChainTracker.t.sol)
   - **Acciones**:
     - Tests para revokación de roles y reentrancia.
     - Pruebas de estrés con `forge`.
   - **Impacto**: Mejora cobertura y detección de bugs.

---

## 📅 Roadmap
| Fase      | Duración Estimada | Responsable       |
|-----------|-------------------|-------------------|
| Fase 1    | 2 semanas         | Kilo Code         |
| Fase 2    | 1.5 semanas       | Kilo Code         |
| Fase 3    | 1 semana          | Kilo Code         |

---

## 📝 Notas
- **Prioridad**: Enfocarse primero en seguridad (Fase 1) antes de escalabilidad (Fase 3).
- **Dependencias**: La Fase 3 depende de la implementación de la interfaz en Fase 2.
- **Pruebas**: Todas las modificaciones deben ser testeadas con `forge` antes de deploy.

---