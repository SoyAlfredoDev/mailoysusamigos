# Plan de fotografía real · Milo y sus amigos

## Criterio

Se revisaron visualmente las 15 fotografías JPEG entregadas en `public`. No hay archivos idénticos por SHA-256, pero sí versiones de distinta resolución de una misma toma y varias vistas muy similares del salón. Se conservan todos los originales. Solo las seleccionadas se publican como copias WebP, con orientación EXIF correcta, sin aumentar resolución, alterar colores ni reconstruir detalles.

## Selección y ubicación

| Original (21 de octubre de 2026) | Copia en `public/images/real` | Aplicación |
| --- | --- | --- |
| 10.22.09 (2).jpeg | milo.webp | Portada y peluquería. Elegida frente a 10.22.08 (3), la misma toma de 360×480 frente a 1200×1600. |
| 10.22.06 (1).jpeg | equipo.webp | Nosotros. Mantener la proporción 4:3 para mostrar a todo el equipo. |
| 10.22.07 (3).jpeg | milo-esmoquin.webp | Historia de Milo. Imagen pequeña, sin ampliarla más allá de sus 360×480 px. |
| 10.22.13.jpeg | recepcion.webp | Foto principal de la galería de ubicación. Buena vista de recepción y letrero. |
| 10.22.12 (1).jpeg | peluqueria.webp | Galería de ubicación y tarjeta de peluquería. Vista general clara. |
| 10.22.14.jpeg | petshop.webp | Galería de ubicación y tarjeta del petshop. |
| 10.22.13 (1).jpeg | consultorio.webp | Tarjeta, selector de agenda y página de veterinaria. Consultorio real. |

Las fotos 10.22.09 (1), 10.22.09 (3), 10.22.10 y 10.22.10 (1) se reservan por ser vistas muy similares del salón. La toma 10.22.08 (2) de Milo es pequeña y de perfil. 10.22.12 es una segunda vista de recepción; 10.22.11 muestra una estación de peluquería vacía. Se conserva el archivo original de cada una sin borrarlo ni duplicarlo en la interfaz.

## Implementación y revisión

1. Exportar WebP a calidad 84 y registrar relación con el original.
2. Sustituir las imágenes ilustrativas del negocio y retirar sus leyendas provisionales únicamente donde ya hay fotografía real.
3. Incorporar un bloque breve de Milo sin inventar datos biográficos ni nombres o especialidades del equipo.
4. Conservar las imágenes referenciales de productos de demostración hasta disponer de las fotos de cada SKU.
5. Revisar portada, Nosotros, galería ampliada, peluquería, veterinaria y selector de agenda en móvil y computador. Mantener la sección de ubicación dentro de una pantalla en escritorio.

## Resultado

Aplicado y revisado en navegador: portada, equipo completo en 4:3, bloque de Milo, galería con ampliación, peluquería, consultorio veterinario y selector de agenda. En móvil de 390 px no se detectó desbordamiento horizontal. La sección de ubicación mide 620 px en escritorio. Compilación de producción y TypeScript correctos. Los SHA-256 de los 15 originales coinciden con los registrados antes de preparar las copias.
