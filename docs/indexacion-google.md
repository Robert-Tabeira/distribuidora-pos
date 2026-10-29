# Indexación pública: landing y catálogo

## Preparado en el sitio

- `/sitemap.xml` contiene solamente `https://losprimos.uy/landing` y `https://losprimos.uy/catalogo`, sin productos, filtros, cuentas, páginas legales ni rutas internas.
- `/robots.txt` declara la ubicación del sitemap. En producción permite rastrear para que Google pueda leer las directivas `noindex` del resto de páginas. No publica nombres ni identificadores de la ruta privada del personal.
- Landing y catálogo tienen títulos y descripciones propios, URL canónica sin parámetros, Open Graph y metadatos de Twitter.
- El layout raíz usa `noindex` por defecto. Solo landing y catálogo lo habilitan en producción; privacidad, términos, cuentas y áreas del personal conservan `noindex`.
- Las versiones de landing/catálogo con parámetros (filtros, productos y búsquedas) conservan su funcionamiento y comparten la URL canónica de su página, pero reciben `X-Robots-Tag: noindex, follow`. No son entradas separadas del sitemap.
- Las API reciben `X-Robots-Tag: noindex, nofollow`.
- La raíz `/` mantiene su destino `/catalogo` con redirección permanente, para consolidar esa dirección.
- Desarrollo y despliegues de vista previa de Vercel tienen `noindex`, sitemap vacío y `robots.txt` con rastreo deshabilitado. El despliegue de producción debe ser el que sirva el dominio definitivo.
- Las solicitudes a landing/catálogo desde un dominio alternativo reciben `noindex`; sus URL canónicas apuntan al dominio definitivo.

No se inventan fechas de modificación del sitemap, precios, horarios, disponibilidad ni condiciones de envío. No se añadieron cookies, estadísticas, servicios de seguimiento ni dependencias. El contenido dinámico actual continúa cargando con JavaScript; la inspección de URL de Google permitirá observar su renderizado cuando el sitio esté publicado.

## Dominio y variables opcionales

El dominio predeterminado es **`https://losprimos.uy`**. Si el dominio definitivo cambia, establecer `NEXT_PUBLIC_SITE_URL` con su origen completo y volver a desplegar. Debe usar HTTPS en producción. No usar una URL temporal de Vercel como dominio canónico. Una variable vacía o inválida conserva el dominio predeterminado.

La publicación no configura DNS ni crea una propiedad de Search Console. El usuario confirmó que todavía no verificó el dominio.

## Pasos para completar el envío a Google

1. Publicar estos cambios en producción.
2. Entrar a [Google Search Console](https://search.google.com/search-console/) con la cuenta que administrará el sitio.
3. Elegir **Añadir propiedad → Dominio** e ingresar `losprimos.uy`, sin `https://` ni rutas.
4. Google mostrará un registro DNS TXT cuyo valor comienza con `google-site-verification=`. Agregar ese registro al DNS del dominio usando exactamente el nombre/host y valor que indique Google. Mantener los registros existentes del sitio y del correo.
5. Volver a Search Console y pulsar **Verificar**. Si todavía no detecta el registro, esperar a que el cambio DNS sea visible y reintentar. No retirar el registro tras la verificación.
6. En la propiedad verificada, abrir **Sitemaps** y enviar `https://losprimos.uy/sitemap.xml`.
7. Inspeccionar `https://losprimos.uy/landing` y `https://losprimos.uy/catalogo`, y solicitar indexación para cada una. Revisar en esa herramienta si Google puede obtener y renderizar sus contenidos.

El sitemap se publica en la web y se comunica a Google mediante su URL; no se carga un archivo directamente a Google. El envío no garantiza indexación ni una fecha concreta de aparición.

### Alternativa sin modificar el DNS

Se puede verificar una propiedad de tipo **Prefijo de URL** para `https://losprimos.uy/` usando el método **Etiqueta HTML**. En ese caso configurar en Vercel `GOOGLE_SITE_VERIFICATION` con únicamente el valor del atributo `content` que proporcione Google, volver a desplegar y pulsar Verificar. El layout raíz inserta esa etiqueta en el HTML de las páginas. No hace falta Google Analytics ni un banner nuevo.

## Estado de esta entrega

Preparación del código y documentación, con revisión estática del diff. No se ejecutaron pruebas, build ni migraciones; no se publicó el sitio ni se modificó el dominio o una cuenta de Google. La herramienta web no pudo acceder a las páginas públicas durante esta entrega; esto no confirma un problema del sitio, pero impide confirmar su respuesta pública desde aquí. La verificación y el envío a Search Console quedan pendientes del acceso del usuario.

Referencias oficiales: [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=es), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=es), [verificación de propiedad](https://support.google.com/webmasters/answer/9008080?hl=es), [enviar un sitemap](https://support.google.com/webmasters/answer/7451001?hl=es), [SEO con JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=es).
