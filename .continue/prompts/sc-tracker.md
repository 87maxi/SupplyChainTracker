# Arquitectura y Patrones de Diseño

El sistema se fundamenta en dos patrones de diseño clave que aseguran la integridad y seguridad del flujo de trabajo:

## 1. Control de Acceso Basado en Roles (RBAC)

- **Implementación**: Se utiliza la librería `AccessControl` de OpenZeppelin, una solución estándar y auditada para gestión de permisos en contratos inteligentes.
- **Principio**: Cada acción que modifica el estado de una netbook está restringida a un rol específico. Solo direcciones con el rol correspondiente pueden ejecutar ciertas funciones.
- **Visibilidad**: Toda la información de trazabilidad es de lectura pública, lo que permite auditorías abiertas sin comprometer la privacidad de datos sensibles. debe haber un capo que permita definir una extructura json para poder definir mas valores 

## 2. Máquina de Estados (State Machine)

Cada netbook avanza a través de un flujo de estados predefinido y secuencial. Las transiciones están restringidas y validadas en tiempo de ejecución para evitar inconsistencias o saltos ilógicos. Debe ser un token por cada maquina dode se vallan registrando los cambios de estado

### Estados del Ciclo de Vida

| Estado            | Descripción                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| FABRICADA         | Registro inicial de la netbook en el sistema por parte del fabricante.       |
| HW_APROBADO       | El hardware ha sido inspeccionado y aprobado por un auditor especializado.  |
| SW_VALIDADO       | El software ha sido instalado, verificado y autorizado por un técnico.       |
| DISTRIBUIDA       | La netbook ha sido asignada a un estudiante en una escuela específica.       |

> Restricción clave: No es posible regresar a un estado anterior ni saltar estados. Por ejemplo, no se puede asignar una netbook a un estudiante si su software no ha sido validado.


# Funcionalidad y Seguridad

## Funcionalidad Detallada

El sistema se divide en tres módulos lógicos:

### 1. Módulo de Gobernanza (Admin)

- **`grantRole(role, account)`**: Permite al administrador otorgar un rol a una dirección.
- **`revokeRole(role, account)`**: Permite al administrador revocar un rol.

> Ambas funciones están restringidas al `DEFAULT_ADMIN_ROLE`.

### 2. Módulo de Trazabilidad (Escritura)

Estas funciones avanzan el estado de la netbook y registran datos clave. Cada una tiene una precondición de estado y requiere un rol específico.

| Método                | Rol Requerido       | Precondición de Estado | Acción Principal |
|-----------------------|---------------------|------------------------|------------------|
| `registerNetbooks`    | FABRICANTE_ROLE     | Ninguna (inicio)       | Crea netbooks en estado FABRICADA. |
| `auditHardware`       | AUDITOR_HW_ROLE     | FABRICADA              | Registra auditoría de hardware y avanza a HW_APROBADO. |
| `validateSoftware`    | TECNICO_SW_ROLE     | HW_APROBADO            | Registra validación de software y avanza a SW_VALIDADO. |
| `assignToStudent`     | ESCUELA_ROLE        | SW_VALIDADO            | Registra asignación final y avanza a DISTRIBUIDA. |

### 3. Módulo de Reporte (Lectura)

Funciones de consulta pública, sin restricciones de acceso:

- **`getNetbookReport(serial)`**: Devuelve la estructura completa de la netbook, incluyendo todos los datos registrados en cada etapa. Es la base del reporte final de trazabilidad.
- **`getNetbookState(serial)`**: Devuelve únicamente el estado actual de la netbook, útil para validaciones rápidas o interfaces de usuario.

## Consideraciones de Seguridad y Privacidad

- **Validación estricta de estado**: Cada transición requiere el estado previo correcto.
- **Autenticación por rol**: Solo actores autorizados pueden realizar cambios.
- **Protección de datos personales**: Identificadores sensibles se almacenan como hashes, no en texto claro.
- **Inmutabilidad**: Una vez registrada una netbook, su historial no puede alterarse ni eliminarse.
- **Auditoría pública**: Cualquier parte interesada puede consultar el estado y la historia completa de cualquier netbook.


# Entidades de Datos Clave y Roles

## Estructura `Netbook`

### A. Datos de Origen (registrados por FABRICANTE)
- **serialNumber**: Identificador único de la unidad.
- **batchId**: Lote de producción al que pertenece.
- **initialModelSpecs**: Especificaciones técnicas iniciales del modelo.

### B. Datos de Hardware (registrados por AUDITOR_HW)
- **hwAuditor**: Dirección del auditor que realizó la verificación.
- **hwIntegrityPassed**: Indicador booleano de aprobación física.
- **hwReportHash**: Hash del informe de auditoría (almacenado off-chain).

### C. Datos de Software (registrados por TECNICO_SW)
- **swTechnician**: Dirección del técnico que instaló y verificó el software.
- **osVersion**: Versión del sistema operativo instalado.
- **swValidationPassed**: Indicador booleano de validación de software.

### D. Datos de Destino (registrados por ESCUELA)
- **destinationSchoolHash**: Hash del identificador de la escuela (protege PII).
- **studentIdHash**: Hash del identificador del estudiante (protege PII).
- **distributionTimestamp**: Marca de tiempo de la asignación final.

> Privacidad: Los identificadores personales (alumno, escuela) se almacenan como `bytes32` (hashes criptográficos), evitando la exposición de información sensible en la blockchain pública.

## Roles Definidos

| Rol (`bytes32`)         | Función Principal                                                                 |
|--------------------------|-----------------------------------------------------------------------------------|
| `DEFAULT_ADMIN_ROLE`     | Gobernanza: asigna o revoca roles a direcciones.                                  |
| `FABRICANTE_ROLE`        | Registra nuevas netbooks y lotes en el sistema.                                   |
| `AUDITOR_HW_ROLE`        | Verifica e informa sobre la integridad física del hardware.                       |
| `TECNICO_SW_ROLE`        | Instala, prueba y valida el software en la netbook.                               |
| `ESCUELA_ROLE`           | Asigna la netbook a un estudiante final, completando el ciclo de trazabilidad.    |