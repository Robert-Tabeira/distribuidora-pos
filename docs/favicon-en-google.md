# Favicon en el HTML inicial y en Google

El favicon configurado en **Edición web → Header y menú → Logo y nombre → Favicon del sitio** se declara en el HTML inicial mediante `link rel="icon" href="/favicon"`. No depende de JavaScript y su dirección en el dominio se mantiene estable aunque se reemplace la imagen desde el editor.

La página ya no espera una consulta a Supabase para generar sus metadatos. La ruta `/favicon` lee solo el campo público `favicon_url` con la clave pública y caché de 60 segundos, descarga la imagen y la devuelve desde el propio dominio. Si no hay favicon o falla su lectura, solo falla esa imagen y la página sigue disponible.

## Diagnóstico del 31 de octubre de 2026

Se comprobó el sitio publicado mediante solicitudes HTTP de solo lectura: la portada devolvió 200, declaró el enlace de icono en su HTML y `robots.txt` permitió el rastreo. El archivo configurado descargó con estado 200 y resultó ser un PNG real de 192×192 px y 7892 bytes. Se inspeccionó visualmente y contiene el símbolo blanco sobre fondo oscuro.

La respuesta de Storage incluyó **`X-Robots-Tag: none`**, equivalente a `noindex, nofollow`. Es una restricción real sobre la imagen y una posible causa de que no aparezca en búsquedas; no se afirma que sea la única causa ni que retirarla garantice el favicon en Google.

La nueva ruta devuelve los bytes con su tipo de imagen, caché propia y `index, follow` en producción. No reenvía las cabeceras restrictivas del almacenamiento. No redirige al archivo externo, porque entonces Google volvería a recibir esas cabeceras.

Solo se admite el archivo configurado dentro de `product-images/favicons/` del mismo proyecto público de Supabase, sin parámetros de URL arbitrarios, redirecciones ni credenciales privadas. La descarga tiene un límite de 2 MiB y tiempo acotado. Los SVG llevan política de seguridad que impide scripts y recursos externos. Desarrollo y vista previa conservan `noindex`.

## Imagen recomendada

- Subir un **PNG cuadrado**, preferentemente de 96×96 o 192×192 px, con el símbolo legible en pequeño.
- Las nuevas subidas a `favicons` conservan PNG en lugar de convertirse a WebP; se limitan a 512 px de lado máximo conservando sus proporciones. SVG e ICO existentes no se rasterizan.
- La interfaz mantiene SVG e ICO para el navegador; para facilitar compatibilidad con los formatos documentados por Google se recomienda PNG.
- Si un favicon anterior quedó guardado como WebP por el optimizador, **volver a subir el PNG original** después de publicar este cambio. No se transformaron archivos remotos ya existentes.
- Cambiar el favicon no requiere editar código ni SQL. El enlace `/favicon` queda estable; los cambios pueden tardar unos minutos por la caché y más tiempo en el navegador o en Google.

Después de publicar el cambio y subir el PNG si corresponde, se puede solicitar una nueva indexación de la página principal desde Search Console. La raíz del dominio muestra ahora la landing; tanto la portada como el catálogo incluyen el favicon. Google procesa esa imagen por separado: puede tardar días o semanas, y no garantiza que aparezca aunque cumpla las directrices.

No se ejecutaron pruebas, build ni cambios remotos. Se revisó el diff y se hicieron las lecturas HTTP descritas del despliegue anterior. La nueva ruta queda pendiente de publicar y verificar: debe responder 200, devolver `image/png` para la imagen actual y no enviar `none` ni `noindex` en producción. Después, solicitar el rastreo de `https://losprimos.uy/` en Search Console. No hace falta volver a subir el PNG actual.

Referencias: [documentación oficial de Google sobre favicons](https://developers.google.com/search/docs/appearance/favicon-in-search?hl=es), [directivas X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
