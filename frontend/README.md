# Ecommerce Web – Frontend (con integración backend y pagos)

Frontend de tienda de plantas totalmente funcional, integrado con backend real y sistema de pagos Stripe en entorno de pruebas.

---

## Descripción general

Este frontend implementa toda la experiencia de usuario de la tienda, desde la navegación y el catálogo hasta el checkout y la gestión de pedidos. Está conectado a un backend propio y soporta pagos reales en modo test, permitiendo un flujo de compra completo y seguro.

---

## Funcionalidades principales

- Catálogo de productos dinámico (con filtros y paginación)
- Vista de producto con galería de imágenes
- Carrito persistente y gestionable
- Registro y login de usuarios
- Creación y consulta de pedidos
- Checkout completo integrado con Stripe (modo test)
- Gestión de estados de pedido tras el pago
- Accesibilidad y diseño responsive

---

## Pagos

Integración con Stripe en modo test utilizando Stripe Checkout y webhooks:

- Creación de sesión de pago desde el backend
- Redirección a checkout seguro de Stripe
- Confirmación automática del estado del pedido tras el pago (webhooks Stripe)
- Gestión de errores y estados de pago

---

## Entornos de ejecución

El frontend puede funcionar en dos modos:

- **Modo mock:** desarrollo frontend-first usando datos simulados (`src/mocks`).
- **Modo real:** conectado a backend y Stripe en modo test.

El modo se configura mediante variables de entorno.

---

## Arquitectura

- **Frontend:** React 19 + Vite (este repositorio)
- **Backend:** API REST Node.js + MongoDB + Cloudinary (repositorio hermano)
- **Pagos:** Stripe Checkout (modo test)

El frontend consume el backend mediante servicios desacoplados (`src/services`). Toda la lógica de negocio y persistencia reside en el backend, manteniendo el frontend limpio y enfocado en la experiencia de usuario.

---

## Stack tecnológico

- React 19 + TypeScript
- Vite
- React Router
- ESLint
- Vitest + Testing Library
- Playwright (e2e)
- Sharp (optimización de imágenes)

---

## Scripts principales

- `npm run dev` – Entorno local de desarrollo
- `npm run build` – Build de producción
- `npm run preview` – Servir build localmente
- `npm run typecheck` – Chequeo de tipos
- `npm run lint` – Linting estático
- `npm run test` – Tests unitarios
- `npm run test:coverage` – Cobertura de tests
- `npm run test:e2e:install` – Instala navegador para e2e
- `npm run test:e2e` – Smoke e2e
- `npm run quality` – Chequeo de calidad global
- `npm run perf:report` – Reporte de tamaños de assets
- `npm run perf:budget` – Validación de presupuestos de bundle
- `npm run release:check` – Validación previa a release
- `npm run assets:hero` / `npm run assets:shop` – Optimización de imágenes

---

## Estructura del proyecto

- `src/pages` – Vistas principales (Home, Shop, Product, Cart, Checkout, Blog, Admin, etc.)
- `src/components` – Layout, secciones y UI reutilizable (`layout`, `sections`, `ui`)
- `src/features` – Hooks y lógica de dominio
- `src/services` – Repositorios y adaptadores de datos por dominio (productos, carrito, auth, pedidos, etc.)
- `src/types` – Contratos tipados de dominio
- `src/mocks` – Datos mock para desarrollo frontend-first
- `src/hooks` – Hooks y contextos globales (Auth, Cart)
- `src/store` – Estado global/contextos
- `src/utils` – Utilidades y helpers
- `scripts/` – Automatización de assets y métricas

---

## Flujo de trabajo recomendado

1. Instalar dependencias: `npm install`
2. Iniciar entorno local: `npm run dev`
3. Durante desarrollo: `npm run quality`
4. Antes de release: `npm run release:check`

---

## Objetivos de calidad

- Performance (Lighthouse): ≥ 90
- Accesibilidad: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 90

_Nota: Las métricas pueden variar según entorno y contenido._

---

## Estado actual

- Catálogo y detalle funcionales, con galería y lightbox
- Carrito y pedidos conectados a backend real
- Autenticación y gestión de usuarios
- Checkout y pagos Stripe 100% funcionales (modo test)
- Accesibilidad y responsive validados
- Estados UX completos (carga, error, vacío, no disponible)

---

## Comentarios

Este frontend está pensado para evolucionar y escalar fácilmente, manteniendo la experiencia de usuario como prioridad y permitiendo cambios en backend o pasarela de pagos sin rehacer la UI.
