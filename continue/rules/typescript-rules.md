---
name: typescript-rules
description: descripcion de la metodologia de desarrollo y debug
invokable: false
---





## TypeScript y Estándares de Codificación


**1. utiliza el workspace ./web:** 
   - dentro de el workspace ya hay una extructura definida, manten la consistencia basandote en la extrutura de directorios
   - manten siempre la consistencia de una plataforma web3
   - las dependencias estan instaladas, si necesitas ver las dependecias disponibles usa el package.json


**2. Tipado Riguroso (TypeScript):**
   - Siempre utiliza **tipos explícitos** para argumentos de funciones, retornos y variables de estado (`useState`).
   - nunca uses **any**. Prefiere los tipos de utilidad (Partial, Omit, Record) sobre la redefinición.
   - **TypeScript** - usa typescript de manera tigurosa el tipado de varible, por ningun motivo uses **any**

**3. Desarrollo de Componentes (React/Next.js):**
   - Usa **Componentes de Función** y Hooks.
   - Usa **(Tailwind)** en caso que sea necesario y no se pueda resolver con shadcn segmenta los stilos con el criterio de la definicion de la interfaz
   - Implementa siempre **componentes de shadcn** priorisando sobre ta

**4. Diseño de Interfaz (Responsividad):**
   - **Responsivo por Defecto:** Todo el código de UI debe ser diseñado utilizando ese enfoque 
   - **Responsividad** Utiliza las utilidades de diseño clases de Tailwind se muy riguroso con la definiciones de css, para asegurar que la interfaz se adapte correctamente a dispositivos móviles, tabletas y escritorios.

---

## Pruebas y Consistencia de Código

**4. Testing Funcional (Unitario y de Integración):**
   - **Cobertura Mínima:** Las funciones críticas, especialmente las de **interacción con Web3 (contratos)** y los **Hooks personalizados**, deben tener pruebas unitarias.
   - **Librerías:** Utiliza **Jest** para pruebas unitarias y **Testing Library (React)** para pruebas de componentes.
   - **jest:** configura jest de manera consistente para el requerimiento para hacer test de los componentes y funcionalides
   - **anvil:** el objetivo de esta interfaz es interactuar con anvil, usa las cuentas de anvil para pruebas 

**5. Consistencia de Código:**
   - **Formato:** El código debe seguir las reglas definidas por **ESLint** y **Prettier**.
   - **Nomenclatura:** Utiliza **CamelCase** para variables y funciones, y **PascalCase** para componentes y tipos.
   - **Comentarios:** Documenta funciones y tipos complejos usando **TSDoc** (o JSDoc),  generar documentación de forma consistente.
   - **Reporte** generar un u directorio si no existe docs, si es que no existe  donde se describa todas las funcionalidades realizadas y una descripcion funcional del codigo
   - genera un **archivo .env** con todas las variables necesarias para iniciar la aplicacion
   - se consistente con la implementacion de package.json, define claramente todos los comandos necesarios para poder ejecutar la aplicacion **se muy extricto en esta definicion y en el uso** chequea que los comandos funcionen correctamente
   - dentro del directorio docs crea  un diagrama fucional de la aplicacion, y diagrama uml con las definiciones funcionales


## Herramientas que se utilizan 
 - para la interacion con solidity se utiliza anvil
 - utiliza siemprecuentas de anvil
 - utiliza las herramientas que se utilizan con foundry
 - analiza los abi que estan **./src/contracts/SupplyChainTrackerABI.json** y utiliza como gia
 - las coneccion a la wallet es siempre a travez de metamask
 - utiliza ethers como libreria para el manejo de la wallet
 - utiliza la conexion a la wallet de manera agnostica, que se pueda implementar con la wallet que este en la extencion  del browser
