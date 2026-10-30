# Favicon en el HTML inicial y en Google

El favicon configurado en **Edición web → Header y menú → Logo y nombre → Favicon del sitio** se declara ahora mediante los metadatos del servidor. La etiqueta `link rel="icon"` forma parte del HTML inicial y no depende de que el navegador ejecute JavaScript y consulte Supabase.

Se retiró el cargador de favicon del navegador para evitar enlaces duplicados y otra consulta del cliente. El servidor consulta solo el campo público `favicon_url`, usando la clave pública, caché de 60 segundos y un tiempo de espera acotado. Si no hay favicon o falla su lectura, se omite el enlace y la página sigue disponible. El resto de los metadatos y las reglas de indexación se conservan.

## Imagen recomendada

- Subir un **PNG cuadrado**, preferentemente de 96×96 o 192×192 px, con el símbolo legible en pequeño.
- Las nuevas subidas a `favicons` conservan PNG en lugar de convertirse a WebP; se limitan a 512 px de lado máximo conservando sus proporciones. SVG e ICO existentes no se rasterizan.
- La interfaz mantiene SVG e ICO para el navegador; para facilitar compatibilidad con los formatos documentados por Google se recomienda PNG.
- Si un favicon anterior quedó guardado como WebP por el optimizador, **volver a subir el PNG original** después de publicar este cambio. No se transformaron archivos remotos ya existentes.
- Cambiar el favicon no requiere editar código ni SQL. Su enlace queda estable mientras no se reemplace o elimine la imagen.

Después de publicar el cambio y subir el PNG si corresponde, se puede solicitar una nueva indexación de la página principal desde Search Console. La raíz del dominio muestra ahora la landing; tanto la portada como el catálogo incluyen el favicon. Google procesa esa imagen por separado: puede tardar días o semanas, y no garantiza que aparezca aunque cumpla las directrices.

No se ejecutaron pruebas, build ni cambios remotos. Revisión estática del diff. No se pudo comprobar el archivo configurado en el sitio publicado desde esta entrega, por lo que el formato y las dimensiones actuales no se afirman como verificados.

Referencia: [documentación oficial de Google sobre favicons](https://developers.google.com/search/docs/appearance/favicon-in-search?hl=es).
