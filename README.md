# Milo y sus amigos

Primera versión funcional basada en los mockups aprobados: Next.js 16 (App Router), React 19, Motion, Tailwind CSS 4, Prisma 7 y TypeScript.

El inicio incluye una cinta de inauguración, las tres publicaciones reales más recientes verificadas de Instagram y una selección atribuida de reseñas reales de Google Maps. Los movimientos de páginas, catálogo, carrito y reservas respetan la preferencia de movimiento reducido. La procedencia del contenido social y la configuración opcional de actualización automática se detallan en [docs/social-and-motion.md](docs/social-and-motion.md).

## Arranque local

```sh
npm install
npm run setup
npm run dev -- --port 3007
```

Abrir http://127.0.0.1:3007. El puerto 3000 estaba ocupado por otro proyecto durante el desarrollo.

`setup` crea un archivo `.env` privado con una contraseña administrativa aleatoria, inicializa SQLite e inserta el catálogo y las citas de demostración. No sobrescribe los registros existentes. El correo y la contraseña del equipo están en `ADMIN_EMAIL` y `ADMIN_PASSWORD` dentro de `.env`. No se guardan en el código ni en la documentación.

Panel: http://127.0.0.1:3007/admin. La ruta redirige al acceso si no existe sesión. Las páginas privadas y todas las acciones administrativas verifican la sesión en el servidor.

## Implementado

- Inicio responsive fiel a la dirección visual aprobada, con los tres accesos principales.
- Tienda con búsqueda, filtros por mascota y categoría, orden de precios y fichas de producto.
- Carrito persistente en el navegador; cantidades, eliminación y solicitud de pedido.
- Pedidos guardados mediante Prisma, precios recalculados por el servidor, stock transaccional e idempotencia de reintentos.
- Reservas para peluquería y veterinaria en tres pasos, con validación del servidor.
- Disponibilidad por recurso y duración; intervalos únicos de 30 minutos impiden cruces.
- Zona horaria America/Santiago, pausa y cierres provisionales, hasta 30 días y una hora mínima de anticipación.
- Agenda administrativa por día y semana, filtros, lista móvil y detalle de cada cita.
- Cambio de estados, cancelación que libera cupos y reprogramación transaccional.
- Gestión de pedidos y pago manual verificado; cancelación devuelve stock una sola vez.
- Edición de productos existentes, precio, descripción, stock y visibilidad.
- Clientes y mascotas vinculados a solicitudes.
- Edición de valores, duración y visibilidad de servicios existentes.
- Sesión administrativa cifrada con iron-session, cookie HttpOnly, validación de origen y límite persistente de intentos de acceso.
- Motion con respeto a movimiento reducido, tipografía local y fotografías WebP.

## Datos de demostración

El catálogo, precios, imágenes, recursos y horarios son provisionales. Las solicitudes quedan pendientes de confirmación. El sitio no cobra, no envía correos ni mensajes y no anuncia despachos reales. El pedido es una solicitud para retiro; el pago online se integrará cuando se defina el proveedor.

La página de condiciones corresponde a esta demostración. No constituye la versión comercial definitiva. Las fotografías generadas no representan al local o su equipo. El logo es el JPG original aportado; requiere una fuente de mayor resolución para producción.

El seed usa direcciones `.test`; las pruebas manuales también usan exclusivamente datos ficticios. Hay un único rol administrador en esta etapa, sin registro público. La gestión de múltiples cuentas, roles de recepción/profesionales, feriados, horarios por profesional y carga de imágenes quedan para una siguiente iteración.

## Datos y despliegue

Prisma usa SQLite/libSQL: archivo local para desarrollo y conexión libSQL remota persistente para un futuro despliegue en Vercel. No usar SQLite en el sistema de archivos efímero de Vercel.

Variables: consultar `.env.example`. Para una base remota, configurar `DATABASE_URL=libsql://...`, `DATABASE_AUTH_TOKEN`, un `SESSION_SECRET` aleatorio de al menos 32 caracteres, correo y contraseña del administrador. El cliente Prisma utiliza el adaptador libSQL. La aplicación no ha sido desplegada.

Para inicializar una base remota vacía, exportar el esquema con Prisma y aplicar el SQL con el cliente oficial libSQL de esa base. Revisar el SQL y ejecutar una sola vez mediante una migración controlada. `prisma db push` del setup está destinado al SQLite local; no asumir que ejecuta migraciones en un endpoint libSQL remoto. No ejecutar el seed de demostración en producción.

Antes de habilitar la operación comercial, confirmar catálogo, precios, equipo, agenda y condiciones; conectar pagos y avisos; configurar la base remota y credenciales; añadir protección antiabuso para formularios públicos y verificar el entorno desplegado. La web conserva noindex durante esta etapa.

## Comprobaciones

```sh
npm run typecheck
npm test
npm run build
```

La compilación utiliza Webpack porque Turbopack requiere abrir puertos internos que el entorno de ejecución restringe. El servidor de desarrollo utiliza Turbopack.

Los tests usan una copia temporal de la base local y nunca alteran los datos de desarrollo. Verifican solapamientos, persistencia sin huérfanos, horarios y zona de Chile, stock, precios calculados en servidor, idempotencia, validación y origen de los formularios.

Comprobado en navegador: reserva de peluquería → registro en agenda → cambio a confirmada; pedido desde tienda → registro en panel; reserva veterinaria desde viewport móvil. Inicio y panel revisados en escritorio y a 390 px.

## Organización

- `src/app`: páginas públicas, panel, acciones del servidor y endpoints.
- `src/components`: interfaz pública, carrito, reserva y administración.
- `src/lib`: Prisma, sesión, operaciones transaccionales, horarios y validación.
- `prisma/schema.prisma`: modelo de datos.
- `prisma/seed.ts`: datos iniciales de demostración, idempotente.
- `tests`: pruebas de comportamiento con base aislada.
- `mockups`: propuesta aprobada.
- `docs/image-prompts.json`: prompts y procedencia de las fotografías generadas.

Horarios centralizados en `src/lib/schedule.ts`; ajustar al confirmar horarios reales. Los precios y duraciones se pueden editar en configuración, y los multiplicadores provisionales por tamaño están en `serviceQuote`.
