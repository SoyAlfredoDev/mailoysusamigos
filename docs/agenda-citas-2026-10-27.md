# Agenda y notificaciones de citas

Implementación local, 27 de octubre de 2026. Publicación pendiente.

## Reglas confirmadas por el negocio

- **Solo veterinaria:** turnos de 30 minutos, lunes a viernes desde las 09:00 hasta el inicio de la última cita a las 17:30 (termina a las 18:00). No se ofrecen turnos a las 14:00 ni a las 14:30. La web no indica el motivo.
- Sábado de veterinaria: por orden de llegada; se informa al elegir el día, sin permitir reservar hora. Domingo cerrado.
- Peluquería conserva las reglas previas: duración por servicio y tamaño, inicio a las 10:00, cierre de lunes a viernes a las 18:00 y sábado a las 17:00; disponibilidad previa conservada.
- Se interpretó «una sola cita por hora» como **un cupo por turno, sin citas simultáneas en la misma área**, acorde con la duración de 30 minutos solicitada. Veterinaria y peluquería tienen cupos completamente independientes. Hay turnos veterinarios a las 09:00 y 09:30, por ejemplo.
- Se conserva la anticipación previa de una hora y el horizonte de 30 días. Zona horaria America/Santiago, con cambio de horario automático.
- Reserva confirmada automáticamente. No se realiza un pago en línea.

## Experiencia y seguridad

Se mantiene el flujo servicio → horario → datos → comprobante. Sin cuenta se piden nombre de mascota, especie, nombre de tutor, celular y correo; observaciones opcionales. Se crea o reutiliza un **contacto comercial**, no una cuenta con contraseña. No se modifican los datos guardados de un contacto existente a partir de una reserva anónima: el contacto para esta cita se conserva en campos independientes.

Con sesión verificada se utilizan los datos de la cuenta en el servidor y se permite seleccionar sus mascotas. La relación de tutor se comprueba en el servidor; un visitante o un usuario ajeno no puede reutilizar una mascota por conocer su ID. El acceso opcional desde la reserva puede regresar a la misma área; el acceso normal sigue llevando a la bienvenida.

Los turnos se validan nuevamente al guardar. Un recurso activo canónico por área y el índice único de `Slot` protegen frente a peticiones concurrentes; también se comprueban ocupaciones de los recursos históricos del área. Los recursos antiguos se conservan para mostrar las citas previas. Una clave idempotente por solicitud impide crear otra cita, mascota o aviso al reintentar tras un problema de red; el servidor rechaza reutilizarla con datos distintos. El precio procede del servidor. Hay validación de origen, consentimiento, tamaño de solicitud y límites persistentes por correo y origen.

Las citas existentes no se reprograman ni se alteran automáticamente. Las nuevas citas veterinarias siempre duran 30 minutos; la reprogramación de una cita veterinaria usa esa duración. Cancelar o marcar inasistencia libera el cupo. Reprogramar comprueba disponibilidad antes de sustituir los bloqueos; una operación fallida conserva el turno original.

## Correos y panel

La transacción de reserva guarda dos avisos durables en `AppointmentNotice`: cliente y equipo (`BOOKING_TEAM_EMAIL`, por defecto `contacto@mailoysusamigos.cl`). Incluyen servicio, mascota/código, fecha, hora de Santiago, estado y referencia. Las observaciones quedan en el panel, sin incorporarlas al correo.

Después de responder, `after()` intenta enviarlos con Resend. Cada aviso tiene una clave de idempotencia fija y el mismo contenido en todos los reintentos. El transporte reintenta errores temporales hasta tres veces con espera creciente; errores de configuración o rechazo permanente quedan señalados. El registro persiste si la función se interrumpe o el proveedor falla. El panel muestra pendiente, enviando, aceptado por el proveedor o requiere revisión, permite actualizar el estado visible y reintentar avisos pendientes. La cita se conserva aunque el correo falle.

**No hay un cron ni trabajador periódico configurado:** tras agotar los intentos iniciales, los pendientes se reintentan desde el panel (o al reintentar esa misma solicitud). No se promete recuperación automática durante una caída prolongada. Para operación desatendida a mayor volumen, conectar el procesador `deliverBookingNotices` a un trabajador programado antes de ofrecer ese nivel de servicio.

Las modificaciones, reprogramaciones y cancelaciones generan avisos actualizados para ambas partes y anulan avisos previos que aún no se han enviado. Los avisos que ya estaban en envío pueden llegar; el correo de actualización informa el nuevo estado. Nunca se vuelve a enviar un aviso aceptado por Resend. Las reclamaciones de trabajo tienen una concesión de 60 segundos para evitar procesadores simultáneos. Los reintentos se detienen a las 23 horas para respetar la ventana de idempotencia de Resend (24 horas); fuera de ese plazo se requiere revisión manual del proveedor antes de reenviar.

`SENT` significa **aceptado por Resend**, no leído ni confirmado en bandeja de entrada. No se ha añadido un webhook de entrega y no se afirma que exista verificación de entrega final.

## Migración y activación

Se añadió `prisma/migrations/20261027_booking_flow/migration.sql`: columnas opcionales en Appointment y tabla de avisos; no elimina datos. Aplicada solo a la base local, previa copia en `outputs/backups/dev-20261027-before-booking.db` (ignorada en Git). Sobre otra copia se verificó conservar 2 contactos, 6 mascotas, 6 citas, 1 pedido y 6 asociaciones de tutor, sin errores de claves foráneas.

Para producción: respaldar Turso, aplicar las migraciones pendientes **de usuarios/mascotas y después de citas**, verificar datos, y publicar el código compatible. No volver a aplicar el esquema inicial ni ejecutar el seed de demostración. Confirmar `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y el dominio remitente verificado; el destinatario interno tiene valor por defecto y se puede configurar con `BOOKING_TEAM_EMAIL`. Mantener la configuración de autenticación de clientes y administración descrita en `usuarios-mascotas-auditoria.md`.

Antes de publicar, revisar reservas futuras anteriores que puedan contradecir las nuevas reglas y coordinarlas con el negocio; la migración no modifica compromisos existentes. La entrega real por correo y la publicación en Vercel no se han probado en esta tarea. Las pruebas capturan los avisos en memoria y no envían mensajes reales.

## Validación

- 21 pruebas automatizadas: horarios, duración, cupo por área, independencia, reservas concurrentes, idempotencia, cliente invitado, reutilización autorizada de mascota, reprogramación, cancelación, cola y reintentos; más registro/login/recuperación y pedidos existentes.
- `npm run typecheck`, `npm test` y compilación de producción.
- Navegador: turnos 09:00–17:30, ausencia de horarios no disponibles, sábado sin reserva, formulario sin login, agenda y detalle de citas previas. Revisión de móvil a 390/320 px sin desbordamiento horizontal.
- Evidencia visual: `docs/qa/agenda-2026-10-27/`. No se crearon citas adicionales en la base local de trabajo durante la revisión visual.

## Investigación aplicada

- [CRM Veterinario — portal HVS](https://hvs.crmveterinario.com/reserva_online): servicio, disponibilidad, paciente y comprobante. Se simplificó el formulario según el alcance del negocio y se mantiene reserva sin cuenta.
- [AgendaPro — notificaciones de citas](https://ayuda.agendapro.com/es/articles/5929550-como-funciona-el-envio-de-notificacion-y-recordatorios-de-cita-por-email): separar registro de la reserva y seguimiento del aviso. No se incorporan recordatorios automáticos ni WhatsApp sin alcance adicional.
- [Resend — claves de idempotencia](https://resend.com/blog/engineering-idempotency-keys): clave estable, contenido idéntico y ventana de 24 horas.
- [Vercel — cabeceras de petición](https://vercel.com/docs/headers/request-headers): límite por IP a partir del proxy de confianza en Vercel; no se confían cabeceras arbitrarias fuera de ese entorno.
- Guía instalada de Next.js: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`.
