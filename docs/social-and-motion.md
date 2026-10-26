# Movimiento y contenido social

Implementado el 19 de octubre de 2026.

## Movimiento

- Entradas de páginas públicas y vistas administrativas con Motion.
- Aparición de secciones del inicio al entrar en pantalla.
- Menú móvil con transición de altura y opacidad.
- Reordenación y salida de productos al filtrar el catálogo.
- Botón de agregar con confirmación visual; contador del carrito con respuesta elástica.
- Salida y recolocación de filas del carrito.
- Transiciones entre los pasos de peluquería y veterinaria sin perder los datos.
- Estados de éxito/error, detalles y controles con respuestas breves.
- Cinta amarilla con texto rojo, debajo del hero y antes de los servicios.
- Bucle sin salto de derecha a izquierda; se puede pausar o reanudar.
- MotionConfig y CSS respetan la preferencia de movimiento reducido. La cinta se vuelve estática y legible en ese modo.

Archivos: `src/app/motion.css`, `src/components/motion-system.tsx`, `src/components/reveal.tsx` y componentes de cada flujo.

La promoción es comunicación visual: “Hasta un 10% de descuento en peluquería” por la inauguración de la web. No aplica descuentos automáticos a precios o pedidos, y no inventa fechas, códigos ni condiciones comerciales.

## Instagram

Perfil real comprobado: https://www.instagram.com/miloysusamigoscl/

Tres publicaciones más recientes observadas en la grilla pública:

- https://www.instagram.com/reel/DepmDPbPvii/ — 18 de octubre de 2026.
- https://www.instagram.com/reel/Deepc3rvD4K/ — 14 de octubre de 2026.
- https://www.instagram.com/p/Deaajnfmjum/ — 12 de octubre de 2026.

Se utiliza el iframe oficial de cada publicación, con carga diferida, título accesible y enlace alternativo a la publicación original. No se descargaron ni sustituyeron sus imágenes o videos. En móvil, las tarjetas permiten desplazamiento horizontal con ajuste de posición.

La selección es una captura verificada y fechada, no una extracción automática de nuevas publicaciones.

La aplicación incluye una integración opcional del servidor para solicitar las tres publicaciones más recientes a la API oficial de Instagram cuando se configuran `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN` y `INSTAGRAM_API_VERSION`. Requiere acceso autorizado a la cuenta y permisos de Meta; esa conexión no está configurada ni verificada con credenciales reales. Ante un fallo, se mantiene la selección fechada.

## Google Maps

Ficha proporcionada por el usuario y revisada directamente:
https://maps.app.goo.gl/LFqX5JzjS843idPN9

Nombre mostrado: Veterinaria y Peluquería Canina Milo y Sus Amigos SPA.
Ubicación: Mario Alvo Hassan 1489, Santiago.
El sitio web y el teléfono de la ficha coinciden con el Instagram del negocio.

Se verificó una valoración de 4,9 sobre 5 y 373 opiniones. Estos valores se muestran con la fecha de verificación.

La sección contiene fragmentos literales de dos reseñas de cinco estrellas, de Britnie Viloria y Jean Diaz Uzcategui. Se presentan como una selección destacada y atribuida; el enlace permite consultar todas las opiniones en Google. No se inventaron autores, textos ni puntuaciones. No es un widget de reseñas en vivo.

La integración opcional con Places API (New) está preparada en el servidor. Para activarla se necesitan `GOOGLE_PLACE_ID` y `GOOGLE_PLACES_API_KEY`, con acceso autorizado y facturación configurada en Google Cloud. No se creó una cuenta ni se habilitó facturación. Sin credenciales, se conserva la selección verificada.

Las respuestas de Places no se almacenan en la base ni en una caché persistente. Cuando hay conexión, se conserva el orden por relevancia de Google, los autores y los enlaces de atribución.

## Fuentes técnicas

- https://motion.dev/docs/react-animate-presence
- https://motion.dev/docs/react-accessibility
- https://developers.google.com/maps/documentation/places/web-service/place-details
- https://developers.google.com/maps/documentation/places/web-service/policies

Las condiciones de la demostración ahora informan sobre las conexiones a Meta y la procedencia de las reseñas.
