# Ubicación y fotografías

La sección `#ubicacion` de la portada utiliza el código de inserción oficial de Google Maps obtenido desde Compartir → Incorporar un mapa de la ficha facilitada por el cliente: https://maps.app.goo.gl/LFqX5JzjS843idPN9.

Actualización del 21 de octubre de 2026: las tres imágenes de la galería son fotografías reales de recepción, peluquería y petshop entregadas por el cliente. Las copias optimizadas están en `public/images/real`, y sus rutas, títulos y textos alternativos se gestionan en `src/lib/location.ts`. La selección completa y su correspondencia con los originales se documentan en `docs/real-photos-plan.md` y `docs/real-photos-manifest.json`.

Los antiguos recursos ilustrativos se conservan como archivos históricos, pero la galería ya no los utiliza. Las imágenes ampliadas muestran las fotografías completas.

Validación: typecheck y build de producción correctos. Se comprobó la sección en escritorio de 1366×768 y 1024×600 (altura de sección 620 y 580 px respectivamente), y móvil de 390×844 sin desbordamiento horizontal. Galería ampliable, navegación entre imágenes y cierre con Escape comprobados en navegador.
