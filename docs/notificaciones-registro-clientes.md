# Notificaciones de registros pendientes

El dashboard de administración incluye una campana en su encabezado, visible en móvil y escritorio. Su contador representa clientes con `approval_status = 'pending'`; no representa notificaciones sin leer. Abrir la campana no quita el aviso. Aprobar o rechazar una solicitud la retira del siguiente conteo. Las solicitudes ya aprobadas no generan avisos históricos.

El desplegable muestra el total y las cinco solicitudes más recientes, con comercio, nombre y fecha local de Uruguay. Cada aviso y el botón de revisión llevan a Clientes, que ya abre la pestaña Pendientes. Las aprobaciones se realizan en esa pantalla.

Se consulta al abrir el dashboard, cada 30 segundos mientras la pestaña esté visible, al recuperar el foco, al recuperar conexión y al abrir la campana. Las solicitudes simultáneas se agrupan evitando lecturas superpuestas. Al salir del dashboard, se cancelan la lectura pendiente y los temporizadores. No requiere habilitar Realtime en Supabase ni una migración SQL.

Si falla la consulta, la campana muestra un signo de advertencia y permite reintentar; no informa cero pendientes por un error. Si la sesión deja de ser válida o pierde el rol de administrador, indica que debe iniciarse sesión y suspende la consulta periódica. No se guardan notificaciones ni perfiles en almacenamiento local.

El endpoint `GET /api/staff-customer-notifications` exige la clave de acceso interna, una sesión del personal válida y el rol administrador comprobado en servidor. Devuelve solo el total y los campos públicos mínimos del aviso (`id`, `name`, `business_name`, `created_at`), sin teléfonos, correo ni contraseñas. Las respuestas son privadas, sin caché y con exclusión de indexación. No modifica registros, permisos ni estadísticas.

Son avisos dentro del dashboard: no se agregan correos, notificaciones push del navegador ni sonidos.

## Revisión manual pendiente del despliegue

1. Entrar como administrador y comprobar contador y vista previa contra la pestaña Pendientes de Clientes. Con más de cinco solicitudes, comprobar que el contador total no se limite a cinco.
2. Crear una solicitud de prueba mientras el dashboard esté abierto y comprobar que aparezca dentro del siguiente intervalo, sin recargar.
3. Aprobar o rechazar la solicitud desde Clientes y volver al dashboard: el aviso debe desaparecer del conteo. Abrir y cerrar la campana sin resolverla debe conservarlo.
4. Revisar el estado sin pendientes, el cierre al tocar fuera o pulsar Escape, la navegación por teclado y la disposición en móvil.
5. Simular una consulta fallida: debe advertir el error y permitir reintentar, sin anunciar cero solicitudes. Comprobar que una sesión ausente o un empleado sin rol administrador no obtenga los datos del endpoint.

Se revisó el código estáticamente con `git diff --check`. No se ejecutaron pruebas, build, comprobación de tipos ni lecturas o escrituras remotas.
