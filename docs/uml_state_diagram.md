# Diagrama UML - Máquina de Estados

```mermaid
stateDiagram-v2
    [*] --> FABRICADA
    FABRICADA --> HW_APROBADO: Auditoría Hardware
    HW_APROBADO --> SW_VALIDADO: Validación Software  
    SW_VALIDADO --> DISTRIBUIDA: Asignación Estudiante
    DISTRIBUIDA --> [*]
```

## Descripción de Estados

- **FABRICADA**: Netbook registrada por el fabricante
- **HW_APROBADO**: Hardware auditado y aprobado  
- **SW_VALIDADO**: Software instalado y validado
- **DISTRIBUIDA**: Asignada a estudiante final

**Restricción**: Flujo estrictamente secuencial sin retroceso.
```