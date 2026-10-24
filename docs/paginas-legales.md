# Páginas legales y preferencias

## Entregado

- `/privacidad`: responsable, datos, finalidades, destinatarios, conservación, derechos y contacto.
- `/cookies`: almacenamiento local/de sesión, elecciones y servicios externos.
- `/terminos`: navegación, consultas, listas, cuentas de comercios y confirmación de operaciones.
- Enlaces permanentes en el footer y aviso informativo en el formulario de registro.
- Preferencias con estadísticas y mapas externos desactivados inicialmente, rechazo de opciones y cambio posterior desde el footer.

## Completar antes de publicar como definitivo

Editar `src/lib/legal-details.ts` con información confirmada por la dueña:

1. Razón social/nombre del responsable, domicilio comercial que corresponda y correo de contacto para privacidad. Se pueden completar directamente en el archivo, sin enviarlos por el chat. El RUT es opcional en estos documentos: solo se muestra si se completa y no condiciona la habilitación de estadísticas o mapas. Este ajuste no evalúa otras obligaciones comerciales que puedan corresponder.
2. Plazos reales de conservación de cuentas, listas y eventos, junto con un procedimiento de eliminación que esté aplicado. El panel de 90 días no es un mecanismo de eliminación.
3. Destinatarios, regiones/países y condiciones de transferencia de los proveedores contratados. Confirmar las regiones de Supabase y Vercel y el proveedor de correo; no se infieren a partir del dominio.
4. Revisar las condiciones de pedidos, pagos, entregas y atención de reclamos de `/terminos` contra la operación real del local.
5. Revisar permisos de acceso a datos de clientes y las obligaciones de inscripción y documentación del negocio ante la URCDP con su asesor.
6. Tras la revisión y completar los campos, cambiar `reviewed` a `true`. Este indicador es un control editorial del proyecto, no una certificación de cumplimiento legal.

Sin completar los datos requeridos y la revisión, las páginas indican **Documento en preparación**, no se indexan y las estadísticas y mapas integrados opcionales permanecen apagados. El catálogo, listas, acceso y enlaces externos continúan disponibles.

## Finalidades confirmadas por el negocio

- Estadísticas de uso interno para conocer los productos y categorías más buscados, las búsquedas sin resultados y el uso del catálogo, listas y enlaces de WhatsApp. Se utilizan para mejorar la navegación y la experiencia del usuario, con permiso previo y sin publicidad personalizada.
- Datos de cuenta para gestionar el acceso, asociar las listas guardadas a cada usuario y permitir recuperarlas y reutilizarlas. Datos de contacto y contenido de listas para atender consultas y gestionar pedidos.
- La autorización de estadísticas no es requisito para crear una cuenta, guardar listas ni gestionar pedidos. Los eventos de métricas no incluyen los datos identificativos de la cuenta ni el contenido de sus listas.
- Detectar fallos técnicos es un objetivo del negocio, pero el panel actual no captura errores automáticamente. Los documentos no prometen esa función. Si se incorpora monitoreo de errores, documentar primero qué recoge, su proveedor, permisos y conservación.

## Activación técnica

1. Si aún no se ejecutó, aplicar `supabase/migrations/202610220001_site_analytics.sql`.
2. Aplicar `supabase/migrations/202610230001_analytics_consent.sql`. Agrega versión y fecha declarada de consentimiento a los nuevos eventos y exige esos campos en la recepción de métricas.
3. Publicar el código en Vercel y completar la revisión editorial anterior.

No se agregan secretos ni variables de entorno. No se ejecutaron migraciones remotas en esta entrega.

## Comportamiento del consentimiento

- Hasta elegir estadísticas no se crea ni se lee el identificador de métricas para recopilar actividad. Se elimina cualquier identificador anterior si no hay autorización vigente.
- La preferencia se guarda localmente con su fecha, versión y vencimiento de 180 días, plazo elegido por el proyecto. Si el almacenamiento está bloqueado se mantiene únicamente una elección temporal en memoria.
- La versión de borrador no habilita estadísticas. Al pasar a versión final, se vuelve a solicitar la elección.
- Do Not Track y Global Privacy Control mantienen las estadísticas desactivadas.
- Al retirar estadísticas se borra el identificador local, se vacía la cola y se intenta abortar la petición activa. Esto no puede deshacer una petición que el servidor ya hubiera recibido.
- La retirada no elimina automáticamente eventos previos en la base. El procedimiento de acceso/supresión debe contemplar los identificadores y los registros que razonablemente puedan identificarse, sin recolectar datos excesivos para esa verificación.
- No se carga el iframe de Google Maps sin permiso. Al retirar mapas se desmonta. Los enlaces externos que la persona decide abrir siguen disponibles.
- La tipografía de Google utilizada por el diseño está alojada en el propio proyecto; permitir mapas no implica permitir otros servicios no incluidos.
- Las decisiones se sincronizan entre pestañas cuando el navegador comunica cambios de almacenamiento.

## Versiones, eventos anteriores y proveedores

No se atribuye consentimiento retroactivo a eventos existentes: sus campos de consentimiento siguen vacíos. Si ya hubo recopilación antes de este cambio, revisar con el responsable el tratamiento y eventual supresión de esos registros.

Al cambiar finalidades o permisos, actualizar `LEGAL_VERSION`, la versión de preferencias y la versión aceptada por la función SQL, y ajustar los documentos y plazos. Una nueva versión invalida la elección anterior.

El almacenamiento de preferencias y la constancia incorporada en eventos no reemplazan los contratos con prestadores, la evaluación de transferencias, el control de accesos ni las obligaciones que correspondan al negocio.

## Fuentes de referencia

- [Ley 18.331, artículo 9: consentimiento y excepciones](https://www.impo.com.uy/bases/leyes/18331-2008/9).
- [Ley 18.331, artículo 13: información previa](https://www.impo.com.uy/bases/leyes/18331-2008/13).
- [URCDP: guía de cookies y perfiles](https://www.gub.uy/unidad-reguladora-control-datos-personales/comunicacion/publicaciones/guia-de-cookies-y-perfiles).
- [URCDP: obligaciones](https://www.gub.uy/unidad-reguladora-control-datos-personales/politicas-y-gestion/obligaciones).

No se ejecutaron build, pruebas automáticas ni pruebas sobre la base de datos remota.
