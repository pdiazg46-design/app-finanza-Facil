# La Biblia de Finanza Fácil

## 1. Visión y Propósito
Finanza Fácil es un sistema de gestión financiera y proyección de métricas de libertad orientado a la simplicidad extrema para el usuario final. Su objetivo principal es traducir la complejidad contable en métricas psicológicamente accionables, principalmente el concepto de "Días de Respiro" (Freedom Days).

*El sistema debe ser operado con el mínimo esfuerzo cognitivo.* Las reglas de negocio pesadas deben ser manejadas por el backend (Ej: cálculos automáticos de cuotas, categorización inferida por voz).

## 2. Ecosistema e Integraciones

### 2.1 Emprende Bridge (Arquitectura Pull)
Finanza Fácil **NO** depende de que otros sistemas le empujen datos (Push). Implementa un patrón de **Pull (Extracción)** para mantener la autonomía de su base de datos.
- **Origen:** Base de datos de "Emprende SaaS & POS" (PostgreSQL/Supabase).
- **Proceso:** Finanza Fácil escanea activamente el historial de transacciones de Emprende buscando retiros de dinero (`transactions` con tipo específico).
- **Consolidación:** Todo retiro detectado en Emprende se transforma e ingresa automáticamente como un `CONTRIBUTION` (Ingreso) en el fondo del usuario en Finanza Fácil, alimentando directamente los Días de Respiro.
- *Referencia Ténica:* Revisar scripts de sincronización (`sync-emprende.ts` o similares) y la configuración `prisma-emprende.ts` para la conexión dual a bases de datos.

## 3. Modelo de Datos Simplificado (En proceso de re-arquitectura)
*Nota: Este modelo está sujeto a la refactorización iniciada el 2026-03-05 para reducir la fricción del usuario.*

*(El modelo de datos detallado se documentará aquí una vez se defina la nueva estructura simplificada durante la fase de PLANNING).*

### 3.1 Principios del Nuevo Modelo (Objetivos)
1. **Reducción de Carga Sensorial:** El usuario no debe categorizar si no es estrictamente necesario.
2. **Abstracción de Deuda Técnica:** Las cuotas y vencimientos deben autogestionarse en base a una fecha de inicio.
3. **Resiliencia PWA:** El modelo debe soportar estado offline y sincronización diferida para la aplicación móvil.

## 4. Motor NLP y Voz (Pan-American Localization)
El sistema utiliza un motor de Procesamiento de Lenguaje Natural (NLP) ajustado a las variaciones lingüísticas del español panamericano (Chile, Argentina, Colombia, México, etc.).
- **Extracción de Intención:** Categoriza automáticamente entre Ingresos (`CONTRIBUTION`), Retiros (`CASH_WITHDRAWAL`), Gastos Variables (`VARIABLE_SERVICE`) y Pagos Fijos (`FIXED_PAGO`).
- **Normalización Numérica:** Maneja slang financiero ("lucas", "palos", "k") de forma agnóstica a la configuración regional del dispositivo.

## 5. Reglas de Negocio Centrales

### 5.1 Freedom Days (Días de Respiro)
Es la métrica reina. Se calcula dividiendo el capital líquido disponible entre la "Tasa de Quema Mensual" (Gastos Fijos + Promedio de Gastos Variables).
- **Efecto Psicológico:** Cada validación por voz de un gasto debe mostrar inmediatamente el impacto negativo en los Días de Respiro (Impact Alert).

### 5.2 Automated Installment Tracking
El sistema avanza automáticamente el contador de cuotas de una deuda según el mes calendario.
- Cuando la `Cuota Actual` excede el `Total de Cuotas`, la deuda se excluye automáticamente de la "Tasa de Quema Mensual", provocando un aumento instantáneo en los Días de Respiro (Gamificación financiera).

## 6. Playbook de Operaciones y Mantenimiento
*(Sección a expandir según requerimientos de despliegue y debugging)*

*   **Despliegue Multiplataforma:** Considerar la estrategia PWA vs CapacitorJS para asegurar la distribución en iOS/Android manteniendo una base de código unificada (Vercel/Next.js).
*   **Guardián de Versiones:** Es imperativo establecer Puntos de Restauración (Commits) antes de cualquier migración de base de datos (`prisma db push` o `prisma migrate`).
