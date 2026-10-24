# Métricas Web de Los Primos

## Estado actual: deshabilitadas

Por decisión del negocio, las estadísticas internas están inhabilitadas. El código se conserva como archivo de la funcionalidad.

- `SITE_ANALYTICS_ENABLED = false` en `src/lib/analytics-config.ts` bloquea eventos, identificadores nuevos y envíos, aunque se complete la revisión legal o haya preferencias antiguas que autorizaban estadísticas.
- El componente público elimina identificadores locales anteriores y no instala escuchas para recopilar visitas o clics.
- La opción de estadísticas se oculta en preferencias y las elecciones nuevas guardan `analytics: false`.
- Se oculta el acceso en el menú de administración. La ruta directa `/admin/metricas` muestra un aviso, sin montar el informe ni consultar sus RPC.
- Para cerrar también el acceso desde versiones antiguas ya abiertas, ejecutar **solo** `supabase/migrations/202610230002_disable_site_analytics.sql` en Supabase. Es seguro aplicarla si las funciones de métricas nunca se instalaron.
- La migración revoca el acceso de `public`, `anon` y `authenticated` a la recepción de eventos, el login de métricas y sus reportes. No elimina tablas ni registros históricos. El logout se conserva para permitir cerrar autorizaciones previas.
- No se ejecutó esta migración en la base remota. Publicar el código y aplicar el bloqueo SQL son pasos separados.

No instalar ni volver a ejecutar las migraciones antiguas de activación, que podrían restituir permisos. Una eventual reactivación requiere una nueva decisión del negocio, revisar los textos y el consentimiento y restaurar los permisos en una migración específica. Cambiar la configuración legal no reactiva estadísticas.

## Referencia histórica: activación original (inactiva)

Las secciones siguientes documentan el funcionamiento anterior. No son instrucciones para la versión actual.

1. En Supabase → SQL Editor, ejecutar el archivo completo `supabase/migrations/202610220001_site_analytics.sql`.
2. Ejecutar también `supabase/migrations/202610230001_analytics_consent.sql`. Completar la información y revisión indicadas en `docs/paginas-legales.md`; mientras el contenido legal esté en borrador, la recopilación opcional permanece apagada.
3. Publicar estos cambios en Vercel. Se usan las variables de Supabase que la aplicación ya tiene; no hay claves adicionales que configurar.
4. Entrar en `/admin` → **Métricas Web**, o abrir `/admin/metricas`.
5. Confirmar el PIN del administrador. La función comprueba el rol en la base de datos y reutiliza `verify_pin_secure`, con el bloqueo de intentos que ya utiliza el login.
6. El acceso al informe dura cuatro horas en esta pestaña. «Bloquear métricas» lo revoca; cerrar sesión desde `/admin` también lo revoca.

La migración crea tablas propias, sin modificar los datos existentes del catálogo. Los reportes se consultan mediante una sesión validada en la base de datos; las tablas de métricas no tienen lectura directa para `anon` ni `authenticated`.

## Qué mide

Las estadísticas son de uso interno: permiten conocer el interés por productos, identificar búsquedas sin resultados y mejorar la navegación y la experiencia del usuario. La gestión de cuentas, listas guardadas y pedidos funciona independientemente de aceptar estas estadísticas. No se utiliza esta información para publicidad personalizada.

El panel actual no registra automáticamente errores técnicos ni graba sesiones de navegación. Esa función requeriría una implementación y documentación específicas.

| Métrica | Interpretación |
| --- | --- |
| Visitas | Sesiones con actividad. La sesión se renueva tras 30 minutos sin eventos. |
| Visitantes estimados | Identificadores de navegadores, guardados en almacenamiento local. No equivalen a personas ni hacen que el registro sea completamente anónimo. |
| Páginas vistas | Aperturas de `/landing` y `/catalogo`, sin guardar los parámetros de la URL. |
| Productos abiertos | Aperturas del detalle, tanto al pulsar una tarjeta como mediante un enlace directo. |
| Búsquedas | Términos con al menos dos caracteres, tras un segundo sin cambios; incluye el número de resultados visibles con los filtros aplicados. |
| Categorías elegidas | Selecciones de categorías y subcategorías, incluidos accesos con una categoría en la URL. |
| Agregados a consulta | Productos incorporados a la lista de consulta de precios; abrir una lista existente no vuelve a contarlos. |
| Agregados a compras | Acciones de agregar un producto a la lista de compras, cuando esa función está habilitada. |
| Clics a WhatsApp | Botones de consulta, compras y enlaces de contacto directo. No confirman mensajes enviados, pedidos aceptados ni ventas. |
| Visitas con contacto | Sesiones con al menos un clic hacia WhatsApp, divididas por sesiones con actividad en el período. |
| Origen | Dominio de procedencia comunicado por el navegador. «Directo» también incluye un origen no informado. |
| Dispositivo | Ancho inicial de la visita: celular <768 px, tablet <1024 px, computadora a partir de 1024 px. |

Los períodos de 7, 30 y 90 días incluyen el día actual y usan `America/Montevideo`. Las visitas de cada día no necesariamente suman el total del período: una sesión que cruza medianoche puede aparecer en dos días.

## Datos reales y exclusiones

- El registro comienza al ejecutar la migración y publicar el código. No se recuperan visitas previas y no se insertan datos de demostración.
- Solo se recopilan eventos tras aceptar estadísticas con una versión vigente del aviso. La versión y fecha de aceptación se incorporan a los nuevos eventos.
- No se recopilan eventos desde un navegador con `employee` en localStorage, desarrollo local, robots identificables, WebDriver, Do Not Track o Global Privacy Control.
- Solo se mide la landing y el catálogo. No se mide el login ni las pantallas internas o de cuenta.
- No se guardan IP, teléfono, nombre de cliente, contenido de mensajes o notas de compra. Se omiten términos de búsqueda con apariencia de email, teléfono o URL.
- Los identificadores pueden cambiar si se borra el almacenamiento, se usa incógnito u otro dispositivo. Bloqueadores y pérdidas de conexión también pueden reducir los conteos.
- Los eventos del navegador pueden ser manipulados; no son registros contables. Hay validación de campos, límite por sesión y deduplicación de reintentos.
- Los datos no se eliminan automáticamente. Si el volumen crece, definir una política de conservación antes de agregar una tarea de limpieza.

## Presentación a la dueña

El panel incluye evolución diaria, hasta 20 productos, búsquedas y categorías, dispositivos, hasta 10 orígenes y acciones de WhatsApp. Permite exportar CSV para Excel e imprimir/guardar como PDF.

Para recorrer la web y generar actividad de demostración real, usar la versión publicada desde un celular u otro navegador sin sesión de empleado, con las páginas legales completas y estadísticas aceptadas. Después actualizar el panel. No usar una ventana que bloquee todo el seguimiento si se espera ver esos eventos.

El CSV contiene los datos agregados del período y los rankings indicados; no es una exportación de todos los eventos individuales.

## Referencias técnicas

- [Funciones y permisos de Supabase](https://supabase.com/docs/guides/database/functions).
- [Funciones SHA de PostgreSQL](https://www.postgresql.org/docs/current/functions-binarystring.html).

## Estado de entrega

Código y migración preparados. No se ejecutaron la migración en la base remota, el build ni pruebas de integración en esta entrega.
