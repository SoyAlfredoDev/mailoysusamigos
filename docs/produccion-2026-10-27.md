# Verificación de producción · 27 de octubre de 2026

Proyecto: `mailoysusamigos`, equipo `milo-9e70`. Dominio: https://mailoysusamigos.cl.

## Publicación y datos

El commit `14a7599` se publicó por Git y su despliegue `dpl_Fo2uN6T56gaY6egWi3QvkYA8WUFj` terminó en Ready, con el dominio del negocio asociado. Incluye el diseño público, cuentas, mascotas y agendas independientes.

Se respaldó la base Turso antes de aplicar, en una sola transacción libSQL, `20261027_users_pets` y `20261027_booking_flow`. Las verificaciones de conservación de registros, claves foráneas y unicidad de códigos de mascotas pasaron. La base estaba vacía; se cargaron únicamente los cuatro servicios existentes y un recurso por área, con autorización del negocio. No se importaron productos, clientes, reservas ni pedidos de demostración.

Se verificó que estén configurados el destino Turso, la clave de Resend, el remitente, la URL pública y el secreto de cuentas de clientes. Los valores secretos y respaldos permanecen fuera de Git.

## Pruebas reales del dominio

- Registro público con datos identificados como prueba; recepción de la verificación en la bandeja de entrada del destinatario autorizado.
- Activación por el enlace recibido, ingreso por correo y contraseña y bienvenida protegida revisada en navegador.
- Recuperación por correo: cambio de contraseña, rechazo del enlace reutilizado, rechazo de la contraseña anterior, revocación de la sesión previa y nuevo ingreso correcto.
- Cookie de sesión con HttpOnly, Secure y SameSite=Lax; cierre de sesión efectivo.
- Disponibilidad veterinaria en turnos de 30 minutos; las horas no disponibles no se ofrecen. Sábado con atención por orden de llegada y sin reservas por hora.
- Reserva de prueba confirmada automáticamente, persistida con su cliente y mascota, bloqueo del turno y reintento idempotente sin duplicación.
- Correos de confirmación y cancelación recibidos en la bandeja de entrada del cliente. El usuario confirmó la recepción de ambos en el buzón del negocio.
- La cita técnica se canceló al terminar y su bloqueo se eliminó. Se conserva su registro identificado como prueba para trazabilidad.

Las pruebas automatizadas existentes (21), TypeScript y la compilación de producción pasaron.

## Administración pendiente

El usuario había dejado pendiente la configuración de `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `SESSION_SECRET`. No se habilita ni se crea una credencial administrativa sin esa configuración.

La verificación de producción detectó que una API administrativa respondía 500 cuando faltaba esa configuración. El ajuste de esta publicación mantiene el acceso cerrado, devuelve 401 en la API y muestra en el acceso del equipo que está pendiente de configuración. La prueba completa de gestión mediante login administrativo queda pendiente de configurar dichas credenciales.

## Evidencia privada de operación

El informe de ejecución, las capturas Ready y de bienvenida y los identificadores de mensajes se guardaron localmente en `outputs/release-20261027/`, ignorado por Git. La aceptación de Resend se distingue de la recepción en buzón: la recepción del cliente se comprobó en Gmail y la del negocio fue confirmada por el usuario.
