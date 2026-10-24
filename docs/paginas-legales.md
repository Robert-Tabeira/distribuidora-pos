# Páginas legales y preferencias

## Entregado

- Dos páginas principales: `/privacidad` y `/terminos` (Términos de uso), con textos breves sobre el funcionamiento real del sitio.
- `/privacidad` reúne datos, finalidades, almacenamiento, mapa opcional, servicios que intervienen, conservación, derechos y contacto. Indica que las estadísticas internas están deshabilitadas. La sección de almacenamiento está en `/privacidad#cookies`.
- `/terminos` describe catálogo, listas, cuentas y consultas por WhatsApp; la cotización definitiva, facturación y cobros quedan fuera de la web.
- La ruta anterior `/cookies` redirige permanentemente a `/privacidad#cookies` para conservar enlaces existentes; ya no es una tercera página de contenido ni figura en la navegación legal.
- Enlaces permanentes en el footer y aviso informativo en el formulario de registro.
- Preferencias para permitir el mapa externo o mantenerlo apagado, con cambio posterior desde el footer. La opción de estadísticas está oculta y bloqueada por configuración.

## Completar antes de publicar como definitivo

Editar `src/lib/legal-details.ts` con información confirmada por la dueña:

1. Razón social/nombre del responsable, domicilio comercial que corresponda y un medio de contacto para privacidad. Están cargados Rusterson Sociedad Anónima, Ruta Interbalnearia Km 47 y Calle B, y atención presencial en ese domicilio. El correo del negocio no es un requisito de esta configuración. Los documentos de este proyecto no solicitan ni muestran RUT. Este ajuste no evalúa otras obligaciones comerciales que puedan corresponder.
2. Plazos reales de conservación de cuentas y listas, junto con un procedimiento de eliminación que esté aplicado. Si existen registros de estadísticas anteriores al bloqueo, revisar también su conservación y eventual eliminación; desactivar la función no los borra.
3. Confirmar internamente destinatarios, regiones/países y condiciones de transferencia de los proveedores contratados; no se infieren a partir del dominio. El aviso público describe clases de destinatarios por su función, sin publicar marcas de alojamiento o base de datos ni el inventario técnico. Completar `internationalTransfers` con la información confirmada sobre el tratamiento fuera de Uruguay, evitando detalles de infraestructura innecesarios.
4. Revisar que `/terminos` describa el alcance real: catálogo, listas de pedido, listas de consulta de precios y envío por WhatsApp. La cotización definitiva, la facturación, los cobros y la coordinación de entrega o retiro se gestionan fuera de la web.
5. Revisar permisos de acceso a datos de clientes y las obligaciones de inscripción y documentación del negocio ante la URCDP con su asesor.
6. Tras la revisión y completar los campos, cambiar `reviewed` a `true`. Este indicador es un control editorial del proyecto, no una certificación de cumplimiento legal.

Sin completar los datos requeridos y la revisión, las páginas indican **Borrador para revisión del negocio**, no se indexan y el mapa integrado permanece apagado. Las estadísticas están deshabilitadas de forma independiente: completar la revisión no las reactiva. El catálogo, listas, acceso y enlaces externos continúan disponibles.

## Contacto de privacidad sin correo

`privacyContact` contiene el medio de contacto que se muestra en ambos documentos. Actualmente indica atención presencial en el local, utilizando el domicilio confirmado por el negocio. `privacyContactHref` es opcional: puede configurarse con un enlace `tel:` o de WhatsApp si se confirma ese canal y su número. No se inventó ni se publicó un teléfono sin confirmar.

El correo opcional de las cuentas de clientes para recuperar el acceso es una función distinta y se mantiene. La revisión pendiente del negocio incluye confirmar cómo recibe y tramita las solicitudes presenciales. Los formularios de ejercicio de derechos de la [URCDP](https://www.gub.uy/unidad-reguladora-control-datos-personales/tramites-y-servicios/formularios) contemplan su presentación ante la empresa.

## Finalidades confirmadas por el negocio

- La web prepara listas y facilita su envío por WhatsApp. No emite facturas ni procesa pagos; usar el catálogo o enviar listas no requiere datos de tarjeta ni credenciales bancarias. La cotización definitiva se confirma con el negocio fuera del sitio.
- Estadísticas internas de navegación deshabilitadas por decisión del negocio. El código anterior se conserva inactivo; no se solicita autorización para habilitarlo en la interfaz actual.
- Datos de cuenta para gestionar el acceso, asociar las listas guardadas a cada usuario y permitir recuperarlas y reutilizarlas. Datos de contacto y contenido de listas para atender consultas y gestionar pedidos.
- Cuentas, listas y consultas funcionan sin el sistema de estadísticas.
- No se incorpora monitoreo automático de errores. Si se decide agregarlo, documentar primero qué recoge, su proveedor, permisos y conservación.

## Información pública reducida

La política conserva las finalidades, datos utilizados, clases de destinatarios, información sobre transferencias internacionales, conservación, identidad y domicilio del responsable, contacto y derechos. Se omiten RUT, marcas de infraestructura y claves técnicas de almacenamiento. WhatsApp y Google Maps se identifican donde intervienen directamente en la elección de la persona. El artículo 13 de la Ley 18.331 permite informar destinatarios o clases de destinatarios; describir solo las finalidades no sustituye los demás apartados de información previa.

Estos cambios simplifican la información publicada; no eliminan campos de las cuentas ni datos existentes. El registro mantiene el correo opcional. Las preferencias ya no ofrecen activar estadísticas.

La redacción se limita a describir las funciones disponibles. No agrega garantías absolutas de seguridad, plazos de atención, promesas de disponibilidad, condiciones de venta o cláusulas generales de exención de responsabilidad. Los borradores siguen sujetos a revisión del negocio; acortar los documentos no modifica las obligaciones que puedan corresponder.

## Publicación y bloqueo de estadísticas

1. Aplicar `supabase/migrations/202610230002_disable_site_analytics.sql` para cerrar recepción y consulta de métricas desde clientes anteriores. No requiere instalar las migraciones antiguas si las métricas nunca se habilitaron.
2. Publicar el código en Vercel. La configuración del código bloquea las estadísticas aun si existen preferencias antiguas o se completa la revisión legal.
3. Completar la revisión editorial anterior para los documentos y el mapa opcional.

No se agregan secretos ni variables de entorno. No se ejecutaron migraciones remotas en esta entrega.

## Comportamiento del consentimiento

- Las estadísticas están bloqueadas por `SITE_ANALYTICS_ENABLED = false`, sin depender del consentimiento. El componente público borra el identificador local anterior sin recopilar actividad.
- La preferencia se guarda localmente con su fecha, versión y vencimiento de 180 días, plazo elegido por el proyecto. Si el almacenamiento está bloqueado se mantiene únicamente una elección temporal en memoria.
- Al pasar de borrador a versión final, se vuelve a solicitar la elección del mapa. Las estadísticas permanecen bloqueadas.
- Los nuevos guardados de preferencias fuerzan `analytics: false`; los valores anteriores se interpretan como falsos mientras la funcionalidad esté deshabilitada.
- Deshabilitar la recopilación no elimina eventos previos en la base. El procedimiento de acceso/supresión debe contemplar los identificadores y los registros que razonablemente puedan identificarse, sin recolectar datos excesivos para esa verificación.
- No se carga el iframe de Google Maps sin permiso. Al retirar mapas se desmonta. Los enlaces externos que la persona decide abrir siguen disponibles.
- La tipografía de Google utilizada por el diseño está alojada en el propio proyecto; permitir mapas no implica permitir otros servicios no incluidos.
- Las decisiones se sincronizan entre pestañas cuando el navegador comunica cambios de almacenamiento.

## Versiones, eventos anteriores y proveedores

No se atribuye consentimiento retroactivo a eventos existentes: sus campos de consentimiento siguen vacíos. Si ya hubo recopilación antes de este cambio, revisar con el responsable el tratamiento y eventual supresión de esos registros.

Al cambiar finalidades o permisos, revisar `LEGAL_VERSION` y la versión de preferencias, junto con los documentos y plazos. Una nueva versión de preferencias invalida la elección anterior. Las estadísticas no se reactivan mediante esa revisión; consultar `docs/metricas-web.md` si el negocio decide reconsiderar la función.

El almacenamiento de preferencias y la constancia incorporada en eventos no reemplazan los contratos con prestadores, la evaluación de transferencias, el control de accesos ni las obligaciones que correspondan al negocio.

## Fuentes de referencia

- [Ley 18.331, artículo 9: consentimiento y excepciones](https://www.impo.com.uy/bases/leyes/18331-2008/9).
- [Ley 18.331, artículo 13: información previa](https://www.impo.com.uy/bases/leyes/18331-2008/13).
- [URCDP: guía de cookies y perfiles](https://www.gub.uy/unidad-reguladora-control-datos-personales/comunicacion/publicaciones/guia-de-cookies-y-perfiles).
- [URCDP: obligaciones](https://www.gub.uy/unidad-reguladora-control-datos-personales/politicas-y-gestion/obligaciones).

No se ejecutaron build, pruebas automáticas ni pruebas sobre la base de datos remota.
