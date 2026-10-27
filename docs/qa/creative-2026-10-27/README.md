# Milo · Bienestar en movimiento

Revisión local del 27 de octubre de 2026: http://127.0.0.1:3007/.

## Alcance

Diseño público inspirado en el mockup aportado: marfil, turquesa del letrero, fotografías originales, contornos orgánicos, luz ambiental y superficies suaves. Incluye inicio, servicios, tienda, ficha, carrito, agenda y condiciones. No modifica API, datos, precios, stock, reglas de reserva, autenticación ni componentes administrativos.

Todos los estilos nuevos se limitan a `.public-experience`. La pantalla `/acceso` y el panel no reciben ese contenedor. `Reveal` solo se usa en las secciones públicas y ahora mantiene el contenido visible durante la entrada.

## Movimiento y rendimiento

- Shader WebGL propio, sin dependencias nuevas ni texturas; solo luz detrás de las fotos.
- Importación diferida en escritorio de al menos 900 px, puntero fino y movimiento permitido.
- Superficie de dibujo al 65% de resolución CSS y límite de 30 dibujos por segundo.
- Bucle suspendido fuera del hero y al ocultar la pestaña. Observadores, eventos y recursos GPU liberados al desmontar o pausar.
- Control para pausar y reanudar. Fallback CSS cuando WebGL no está disponible, en móvil y con movimiento reducido.
- Entrada de video vinculada al scroll mediante CSS, con mejora progresiva y sin secuestrar el desplazamiento.
- Referencia técnica: [buenas prácticas WebGL de MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

## Verificación realizada

- TypeScript, compilación de producción y ocho pruebas existentes: correctos.
- Inicio a 320 y 390 px: sin desbordamiento horizontal; canvas oculto.
- Tienda, agenda, veterinaria, carrito y condiciones a 320 px: sin desbordamiento.
- Ficha de producto a 390 px: correcta y sin desbordamiento.
- Inicio, servicios, peluquería y ubicación revisados a 1440 px.
- Cambio al paso Horario de peluquería: correcto. No se enviaron reservas ni pedidos.
- Pausar/reanudar ambiente y preferencia de movimiento reducido: comprobados. Con movimiento reducido, canvas oculto y cinta estática.
- Galería: abre el diálogo y permite cerrarlo con Escape.
- Ubicación: 629 px de altura en viewport de 1000 px, mapa y fotos dentro de una pantalla.
- Pantalla de acceso: contenedor público ausente.
- Consola del navegador al finalizar: sin errores registrados.

Capturas en esta carpeta. Implementación local, sin publicación de estos cambios en Vercel.
