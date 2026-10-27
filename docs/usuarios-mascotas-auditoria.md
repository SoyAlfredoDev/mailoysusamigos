# Usuarios y mascotas — auditoría y alcance inicial

Fecha: 27 de octubre de 2026. Estado: implementación y pruebas locales completadas. Publicación y migración de producción pendientes.

## Situación inicial auditada

- `Customer` representa un contacto comercial; no es una identidad autenticada.
- `Pet.customerId` obliga a asociar cada mascota a un único cliente.
- `createBooking` crea una mascota nueva por reserva. No permite seleccionar una ficha existente; no se deben fusionar mascotas por coincidencia de nombre.
- Las reservas y pedidos admiten contactos sin cuenta. Estos flujos no verifican la titularidad del correo y no pueden utilizarse como prueba de acceso a una identidad o mascota.
- El acceso actual es exclusivamente administrativo, con cookie cifrada `milo_admin`. El login del cliente debe tener permisos y sesión independientes.
- El límite actual de intentos administrativos usa una clave global. Una nueva autenticación de clientes no debe reutilizar ese contador: necesita límites persistentes por operación e identidad/origen, además de revocación y caducidad de sesiones.
- Producción tiene base Turso y clave Resend configuradas. La configuración del administrador quedó pendiente por decisión del usuario; deberá completarse para usar la gestión del equipo en producción.

## Datos mínimos propuestos

Persona: nombre, apellido, correo y un celular. Sin RUT, dirección, nacimiento ni segundo teléfono obligatorio.

Mascota: nombre y especie. Conservar tamaño y pelaje ya existentes para peluquería y pedirlos en ese contexto. No añadir historia clínica, documentos ni datos sanitarios en esta fase.

La creación de mascotas y sus asociaciones se gestionará desde el panel en esta etapa: el cliente autenticado solo verá una bienvenida y cerrar sesión, conforme al alcance solicitado. Si se desea creación de mascotas durante el registro público, debe confirmarse antes de incorporar ese paso.

## Modelo y controles necesarios

1. Separar identidad de acceso y contacto comercial, con vínculo explícito y único cuando corresponda. Un correo escrito en un formulario público no otorga acceso.
2. Crear una relación muchos a muchos explícita entre personas y mascotas, con unicidad del par y fecha de asociación. Una misma mascota conserva su identificador aunque tenga varios tutores.
3. Migrar las asociaciones existentes sin borrar mascotas, contactos, reservas ni pedidos. Los datos actuales no permiten deduplicar automáticamente con seguridad.
4. Usar una biblioteca de autenticación mantenida y compatible con Next.js, Prisma y SQLite/libSQL. Evaluar Better Auth sobre la base existente para evitar un proveedor de cuentas adicional.
5. Verificar el correo para activar la identidad; sesiones de clientes independientes del administrador, cookies HttpOnly/Secure en producción, caducidad y cierre efectivo.
6. Controlar autorización en servidor en todas las lecturas y modificaciones. No confiar en identificadores de tutor enviados desde el navegador.
7. Usar respuestas de autenticación que no revelen si un correo está registrado; límites persistentes, protección de origen y expiración de códigos/enlaces.
8. Prohibir que una persona se asocie a una mascota ajena por conocer su nombre, ID o correo de otro tutor. Se requiere invitación y aceptación con el correo verificado.
9. Mantener el rol administrativo fuera del registro público. No incluir historiales, pedidos ni datos de otros tutores en la bienvenida.

## Decisiones confirmadas e implementación

- Registro público y creación desde el panel; ingreso con correo y contraseña, verificación de correo y recuperación.
- Alta administrativa sin contraseña elegida por el equipo: el cliente recibe un enlace de activación para elegirla.
- Bienvenida protegida y cierre de sesión; sin historial ni datos de otras personas.
- Relación explícita `PetGuardian`: varios tutores por mascota y varias mascotas por tutor. Se conserva `customerId` como origen de los registros antiguos para no romper reservas existentes.
- Código visible corto, único y estable `M-7K4P2X`, generado aleatoriamente, con índice único y reintento ante colisiones en el alta administrativa. Las mascotas existentes reciben códigos `M-000001` y siguientes. El ID interno se conserva. Ninguno concede permisos.
- Invitaciones a un correo concreto, con token aleatorio almacenado como hash, 48 horas de vigencia, aceptación única y comprobación del tutor emisor. Conocer el código no permite asociarse.
- Better Auth sobre Prisma/libSQL, hash de contraseñas, cookies independientes de administración, sesiones de ocho horas, revocación al recuperar contraseña o deshabilitar la cuenta, validación de origen y límites persistentes.
- Registro con cuatro datos de contacto y contraseña; alta de mascota con nombre, especie y tutor inicial. Tamaño y pelaje se mantienen en la reserva de peluquería.
- No se fusionan mascotas por nombre ni se selecciona automáticamente una ficha existente desde una reserva anónima.

## Antes de activar en producción

1. Respaldar Turso y aplicar **solo** `prisma/migrations/20261027_users_pets/migration.sql` sobre el esquema inicial ya existente. No ejecutar nuevamente el SQL inicial, `db push --accept-data-loss` ni el seed de demostración. Verificar conteos, códigos y claves foráneas antes de publicar la aplicación nueva. La migración se probó sobre una copia: conservó 2 contactos, 6 mascotas, 6 citas y 1 pedido, y creó las 6 relaciones de tutor existentes.
2. Configurar `BETTER_AUTH_SECRET` independiente y aleatorio (mínimo 32 caracteres), `BETTER_AUTH_URL=https://mailoysusamigos.cl`, `RESEND_API_KEY` y `RESEND_FROM_EMAIL` con remitente verificado. El archivo `.env.example` contiene solo marcadores; los secretos locales están ignorados por Git.
3. Confirmar dominio/remitente en Resend y probar entrega con un destinatario autorizado. Las pruebas automatizadas interceptan los mensajes y no envían correos reales. La entrega en buzón no está confirmada por estas pruebas.
4. Configurar las credenciales administrativas de producción que el usuario dejó pendientes y revisar las condiciones de privacidad definitivas del negocio antes de apertura comercial.
5. Desplegar y comprobar registro, verificación, recuperación y aceptación de invitación en el dominio real. Este cambio todavía no está publicado.

## Plan de validación

- Prueba de migración sobre copia de la base local y conservación de referencias existentes.
- Una persona con varias mascotas y una mascota con varios tutores, sin relaciones duplicadas.
- Creación y asociación únicamente con permisos válidos.
- Verificación de correo y autenticación según el método elegido; rechazo de códigos expirados/reutilizados o credenciales inválidas, según corresponda.
- Usuarios no autenticados y clientes no pueden acceder a acciones administrativas ni datos de otros usuarios.
- Bienvenida protegida, cierre de sesión y rechazo de sesión caducada/revocada.
- Pruebas existentes de reservas, stock, idempotencia y origen siguen pasando.
- Revisión móvil y escritorio sin enviar correos reales ni crear reservas de prueba en producción.

## Referencias revisadas

- [Portal veterinario HVS: registro de cliente y selección/alta de mascota](https://hvs.crmveterinario.com/reserva_online).
- [Gingr: registro y acceso al portal de clientes de servicios para mascotas](https://support.gingrapp.com/hc/en-us/articles/28302069504653-Access-the-Customer-Portal-How-To).
- [OWASP: autenticación](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
- [OWASP: validación y verificación de correo](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html).
- [Prisma: relaciones muchos a muchos](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations/many-to-many-relations).
- Guía de autenticación de la versión de Next.js instalada en `node_modules/next/dist/docs/01-app/02-guides/authentication.md`.

## Evidencia de validación local

- 13 pruebas automatizadas (incluida migración desde el esquema inicial): registro/verificación, contraseña con hash, recuperación de un solo uso, revocación y cierre de sesión, alta administrativa sin contraseña, cuenta deshabilitada, códigos y colisión, relación entre varios tutores y mascotas, rechazo de invitación ajena/expirada/revocada/reutilizada o sin tutor autorizado, límites persistentes; reservas y pedidos previos sin regresiones.
- `npm run build` y `npm run typecheck` correctos.
- API local: acciones administrativas y de invitación sin sesión devuelven 401; origen externo 403; cuerpo inválido y registro sin aceptación 400; acciones de perfil no habilitadas 404.
- Registro, acceso y administración revisados a 390/320 px, sin desbordamiento horizontal. Capturas en `docs/qa/cuentas-2026-10-27/`.
