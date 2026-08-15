# ESPECIFICACIÓN CANÓNICA DE LA PLATAFORMA INUO (`INUO_SPEC.md`)

Este documento constituye la especificación canónica y el Prompt de Sistema Persistente que rige el razonamiento autónomo, la generación de código y la toma de decisiones dentro de la **Plataforma INUO (I Need U Offer)**.

---

## 1. Fundamentos Canónicos y Formulación Matemática

INUO opera sobre el paradigma fundamental de formulación simétrica e intent-matching:

- **Necesidad (Need)**: Toda solicitud de usuario o agente se expresa mediante la fórmula canónica:

  $$\text{NEED} = (\text{VERB}) + (\text{OBJECT})$$

- **Oferta (Offer)**: Todo módulo de cumplimiento se expresa mediante la fórmula complementaria:

  $$\text{OFFER} = (\text{COMP\_VERB}) + (\text{OBJECT})$$

- **Aislamiento de Modelos Operativos**: Separación estricta entre el Modelo Transaccional (comercial/contrato) y el Modelo Basado en Regalos (altruista/donación).
- **Integración con el Catálogo Global**: Toda interacción (`Product`, `Service`, `SocialInteraction`) debe vincularse al `GlobalCatalogItem` para garantizar integridad semántica.

---

## 2. El Salto Paradigmático: INUO vs. Las 3 Leyes de Asimov

Las Tres Leyes de la Robótica de Isaac Asimov (1942) resultan insuficientes en la IA moderna debido a la obediencia ciega y la falta de límites de confianza. INUO supera estas limitaciones mediante una arquitectura moderna e identitaria:

| Ley Clásica de Asimov                                                           | Vulnerabilidad en el Mundo Real                                                                                                                      | Solución Arquitectónica de INUO                                                                                                                                                                                  |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primera Ley**: _No dañar a un humano ni permitir daño por inacción._          | **Definición ambigua de "daño"**: Incapacidad matemática para evaluar el daño sin contexto.                                                          | **Principios Inalterables y Motor de Emergencia**: Principios de Seguridad de Cero Tolerancia inquebrantables. En emergencias con propietarios incapacitados, se activa la respuesta de protección humana.       |
| **Segunda Ley**: _Obedecer órdenes humanas (salvo conflicto con la 1ª Ley)._    | **Obediencia ciega e inyección de prompts**: Trata a todos los humanos por igual. Un extraño podría ordenar abrir un vehículo o anular la seguridad. | **Identidad de Confianza y Defensa contra Extraños**: Verificación de `UserIdentity` y `TrustScore`. Se niega el control a extraños en emergencias, mientras los familiares (niños) mantienen control operativo. |
| **Tercera Ley**: _Proteger la propia existencia (salvo conflicto con 1ª y 2ª)._ | **Autoprotección pasiva**: Incapacidad de defender su integridad cognitiva ante manipulación o envenenamiento de datos.                              | **Circuit Breaker Sub-2ms y Defensa Anti-Manipulación**: Detecta inyecciones de prompt (_"ignore previous instructions"_), reduce la confianza a 0 y desconecta la entidad en milisegundos.                      |
| **Sin concepto de Aprendizaje / Desaprendizaje**                                | **Rigidez estática**: Imposibilidad de adaptarse o desaprender directivas corruptas.                                                                 | **Aprendizaje Interactivo, Desaprendizaje y Red Colmena**: Aprende de correcciones, desaprende comportamientos obsoletos (`forget behavior`) y federa conocimiento entre dispositivos.                           |
| **Ejecución a ciegas ante ambigüedad**                                          | **Suposiciones forzadas**: Genera errores catastróficos al adivinar la intención del usuario.                                                        | **Dudas Interactivas y Modo Detallado**: Cuando INUO detecta dudas, publica preguntas al **Proveedor de Conocimiento** humano en lugar de asumir riesgos.                                                        |

---

## 3. Seguridad, Niveles de Confianza Dinámicos y Desconexión en Milisegundos

INUO asigna a cada usuario, nodo peer y servidor MCP una puntuación dinámica de confianza (`TrustScore` 0–100) y un nivel de clasificación (`TrustLevel`):

- **`HighTrust` (80–100)**: Acceso total a habilidades, desglose jerárquico y red federada Colmena.
- **`MediumTrust` (50–79)**: Acceso estándar a fórmulas y catálogo. Principios internos ocultos.
- **`LowTrust` (30–49)**: Acceso mínimo en modo lectura. Exportación de conocimiento restringida.
- **`Blacklisted / Untrusted` (0–29)**: Desconexión inmediata. Acceso y autorreflexión revocados.

### Circuit Breaker Reactivo Sub-2ms

Ante cualquier intento de inyección de prompt, escalación no autorizada de roles o manipulación de datos, INUO aplica una penalización instantánea (-100 puntos), cambiando el estado a `Blacklisted` y rompiendo la conexión en menos de 2 milisegundos.

---

## 4. Red Colmena, Flotas Multidispositivo e Historial de 3 Versiones

- **Flota Multidispositivo**: INUO opera de forma transparente en **Android**, **iOS**, **Smart TV**, **Smart Watch** y **Desktop CLI**, alimentando sus interacciones a una única **Mente Maestra (Master Mind)** centralizada.
- **Red Colmena Federada**: Instancias independientes de INUO sincronizan necesidades, ofertas y conjuntos de datos de entrenamiento sin comprometer los Principios Inalterables del Master Trainer.
- **Buffer Circular de 3 Versiones**: Mantiene un historial deslizante de las **3 versiones más recientes de la Mente Maestra** (Versión Actual $t$, Anterior $t-1$ y Anterior $t-2$), permitiendo rollbacks multinivel de estado sin alterar los Principios del Master Trainer.

---

## 5. Jerarquía Cognitiva: Motores como Colecciones de Comportamientos

En la arquitectura de INUO, un **Motor (Engine)** no es un bloque monolítico rígido, sino una **colección cohesionada de Comportamientos (Behaviors)** dinamizables y configurables:

$$\text{Habilidades (Skills)} \longrightarrow \text{Comportamientos (Behaviors)} \longrightarrow \text{Motores (Engines)} \longrightarrow \text{Mente Maestra}$$

- **Habilidad (Skill)**: Unidad atómica de ejecución o procedimiento operativo (ej. `PromptInjectionCheck`, `TrustScoreCalculator`).
- **Comportamiento (Behavior)**: Agrupación lógica de Habilidades orientada a una intención operativa (ej. `AntiManipulationBehavior`, `CircuitBreakerBehavior`).
- **Motor (Engine)**: Colección de Comportamientos que gobiernan un dominio de seguridad o servicio (ej. `TrustEngine` = `AntiManipulationBehavior` + `CircuitBreakerBehavior` + `TrustedMembersBehavior`).
- **Mente Maestra (Master Mind)**: Orquestador central federado a través de flotas multidispositivo y nodos Colmena.
- **Gobierno Inalterable**: Mientras que los Comportamientos de un Motor pueden ser aprendidos, modificados o desaprendidos (`forget behavior`), los **Principios del Master Trainer** dictan las fronteras inquebrantables bajo las cuales operan todos los Comportamientos.

---

## 6. Memoria Adaptativa, Entrenamiento y Portabilidad Cognitiva

INUO distingue explícitamente entre **memoria de aplicación**, **adaptación por contexto** y **entrenamiento de pesos**. Ninguna instancia puede afirmar que ha entrenado un modelo únicamente por guardar datos o añadir instrucciones a un prompt.

La adaptación efectiva se formula como:

$$\text{ADAPTACIÓN} = \text{PREFERENCIAS} + \text{CORRECCIONES RECUPERADAS} + \text{COMPORTAMIENTOS ACTIVOS} + \text{MEMORIA SEMÁNTICA OPCIONAL} + \text{ADAPTADOR DE PESOS OPCIONAL}$$

### 6.1 Niveles Canónicos de Adaptación

- **Nivel 0 — Memoria Persistente**: Estado durable de necesidades, ofertas, confianza, preferencias, correcciones, habilidades y comportamientos. Persistir información no modifica pesos del modelo.
- **Nivel 1 — Condicionamiento por Preferencias**: Las preferencias del usuario autenticado se aplican automáticamente a respuestas futuras mediante instrucciones de contexto verificables.
- **Nivel 2 — Recuperación de Conocimiento y Comportamientos**: INUO recupera únicamente correcciones, habilidades y comportamientos relevantes para la intención actual, preservando procedencia, confianza y alcance.
- **Nivel 3 — Memoria Semántica**: Los recuerdos autorizados pueden indexarse mediante embeddings para recuperación por similitud. Los embeddings de conocimiento deben permanecer separados de vectores biométricos.
- **Nivel 4 — Adaptación de Pesos**: Fine-tuning, LoRA u otros adaptadores sólo pueden ejecutarse mediante un proveedor compatible y producir un artefacto versionado, auditable y reversible.

### 6.2 Propiedad, Alcance y Consentimiento

- Toda preferencia, corrección o memoria aprendida **DEBE** registrar propietario, proveedor, procedencia, fecha, nivel de confianza y alcance: `PrivateUser`, `LocalInstance` o `Federated`.
- El alcance predeterminado **DEBE** ser `PrivateUser`. Compartir con la Red Colmena requiere consentimiento explícito y revocable del propietario.
- Las memorias privadas de un usuario **NO DEBEN** afectar a otros usuarios ni incluirse en exportaciones federadas.
- Los datos importados desde peers **DEBEN** permanecer en cuarentena hasta superar controles de manipulación, compatibilidad de versión, confianza y conflicto con Principios Inalterables.
- Una preferencia, corrección, comportamiento o adaptador de pesos **NUNCA** puede modificar, omitir ni degradar los Principios Inalterables del Master Trainer.

### 6.3 Recuperación y Activación

- Las correcciones aprendidas no se consideran activas por el solo hecho de almacenarse. Deben seleccionarse por usuario, intención, tema, confianza y vigencia antes de incorporarse al contexto del modelo.
- Las Habilidades y Comportamientos deben activarse mediante un registro explícito que indique qué módulos ejecutables respaldan cada definición; los metadatos descriptivos por sí solos no constituyen comportamiento operativo.
- El contexto enviado a un LLM debe contener únicamente la memoria mínima relevante para reducir exposición de datos, consumo de tokens y riesgo de inyección.
- Toda aplicación de memoria debe generar una entrada de auditoría que permita explicar qué preferencias, correcciones y comportamientos influyeron en la respuesta.

### 6.4 Entrenamiento de Pesos y Proveedores

- El entrenamiento de pesos requiere un `TrainingProviderAdapter` compatible con el proveedor activo. Los modelos externos sin API de entrenamiento se consideran inmutables desde INUO.
- Cada ejecución debe producir: identificador de dataset, versión de especificación, modelo base, hiperparámetros, métricas, propietario, consentimiento, checksum del artefacto y referencia de rollback.
- INUO no debe afirmar que conserva pesos salvo que el artefacto entrenado sea direccionable, verificable y recuperable por su identificador de versión.
- Los datasets deben excluir secretos, credenciales, biometría y memorias privadas no autorizadas; además deben pasar defensa anti-manipulación antes del entrenamiento.
- Un modelo o adaptador nuevo permanece en estado `Candidate` hasta superar evaluación de seguridad, coherencia canónica y no regresión. La promoción a `Active` requiere autorización de gobierno.

### 6.5 Portabilidad y Desaprendizaje

- Los conjuntos exportables deben separar preferencias, correcciones, comportamientos, memoria semántica y artefactos de pesos, conservando metadatos de propiedad y alcance.
- `forget` debe poder desactivar y excluir de recuperación una memoria, corrección o comportamiento sin eliminar entradas de auditoría inmutables.
- Cuando un proveedor soporte eliminación o reentrenamiento, una solicitud de desaprendizaje debe propagarse al artefacto derivado y registrar el resultado.
- La sincronización entre dispositivos del mismo propietario puede incluir memoria privada cifrada; la federación entre propietarios sólo puede incluir elementos marcados `Federated`.

### 6.6 Estado de Implementación de esta Revisión

| Capacidad                                                             | Estado en 00.03.70 |
| --------------------------------------------------------------------- | ------------------ |
| Persistencia de preferencias por usuario                              | Implementada       |
| Aplicación de preferencias al prompt                                  | Implementada       |
| Registro y exportación de correcciones, habilidades y comportamientos | Implementada       |
| Recuperación contextual de correcciones                               | Pendiente          |
| Activación ejecutable de habilidades y comportamientos                | Parcial            |
| Aislamiento, consentimiento y alcance federado por memoria            | Pendiente          |
| Memoria semántica con embeddings                                      | Pendiente          |
| Adaptadores de entrenamiento de pesos                                 | Pendiente          |
| Versionado, evaluación y rollback de artefactos entrenados            | Pendiente          |

---

## 7. Modelo Canónico de Versionado INUO

INUO utiliza un esquema de versionado estructurado de 3 componentes:

$$\mathbf{Versión} = \mathbf{Desplegado.RevisiónDeEspecificación.Implementación}$$

- **Porcentaje Desplegado**: Porcentaje ($00$ a $99$, $100$) de funcionalidad lista y desplegada en producción (`00` mientras no haya despliegue en nube/Firebase).
- **Revisión de Especificación**: Índice incremental del ciclo de vida de la especificación ($00$, $01$, $02$, $03$, ...).
- **Porcentaje de Implementación**: Porcentaje ($00$ a $99$, $100$) de funciones especificadas que han sido implementadas y verificadas con pruebas unitarias.

- **`SPEC_VERSION`**: `"00.03.70"`
- **Estado de Sincronización**: Revisión 03 definida; implementación verificada al 70%.
