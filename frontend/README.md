# Ecommerce Web Frontend

Frontend de una tienda de plantas construido con enfoque frontend-first.

La idea de este proyecto es simple: construir primero una experiencia de usuario sólida (navegación, catálogo, detalle, accesibilidad, performance y calidad), y dejar la integración de backend como un paso natural, no como un refactor traumático.

## Enfoque del proyecto

- Frontend-first: interfaz y UX completas antes de acoplar API real.
- Arquitectura preparada para backend: la UI consume hooks/repositorio, no mocks directos.
- Calidad de ingeniería: TypeScript estricto, lint, unit tests y e2e smoke.
- Optimización de assets en pipeline local.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- ESLint
- Vitest + Testing Library
- Playwright
- Sharp (optimización de imágenes)

## Scripts principales

- `npm run dev`: arranca entorno local.
- `npm run build`: compila TypeScript y genera build de producción.
- `npm run preview`: sirve la build localmente.

### Calidad

- `npm run typecheck`: chequeo de tipos.
- `npm run lint`: reglas estáticas.
- `npm run test`: tests unitarios.
- `npm run test:coverage`: cobertura de unit tests.
- `npm run test:e2e:install`: instala navegador Chromium para Playwright.
- `npm run test:e2e`: smoke e2e.
- `npm run quality`: puerta de calidad (`typecheck + lint + test`).

### Performance / Release

- `npm run perf:report`: reporte de tamaños en `dist/assets`.
- `npm run perf:budget`: valida presupuestos de bundle JS/CSS.
- `npm run release:check`: validación completa previa a release.

### Assets

- `npm run assets:hero`: optimiza imágenes del hero.
- `npm run assets:shop`: optimiza imágenes del catálogo shop.

## Estructura (resumen)

- `src/pages`: vistas principales.
- `src/components`: layout, secciones y UI reutilizable.
- `src/features/products`: hooks de dominio para consumo en UI.
- `src/services/products.repository.ts`: capa de acceso a datos (adaptable a API).
- `src/types/product.ts`: contrato tipado de dominio.
- `src/mocks/products.mock.ts`: fuente mock actual (temporal en frontend-first).
- `scripts/`: automatización de assets y métricas de build.

## Estado actual

- Catálogo y detalle funcionales con galería, swipe móvil y lightbox.
- Accesibilidad reforzada en navegación de imágenes y modal.
- Estados UX de carga/error/vacío/no disponible en puntos críticos.
- Base backend-ready sin romper UI actual.

## Objetivos de calidad (portfolio)

Objetivos recomendados en Lighthouse (entorno de producción):

- Performance: >= 90
- Accessibility: >= 95
- Best Practices: >= 95
- SEO: >= 90

Nota: la puntuación puede variar según equipo, red y contenido final.

## Flujo sugerido de trabajo

1. `npm install`
2. `npm run dev`
3. Durante desarrollo: `npm run quality`
4. Antes de cerrar entrega: `npm run release:check`

## Comentario final

Este frontend está pensado para evolucionar con backend real sin rehacer la experiencia ya construida. Si mañana cambia la fuente de datos, el objetivo es tocar repositorio/adaptadores, no volver a abrir cada componente de la UI.
