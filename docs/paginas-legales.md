# Páginas legales y preferencias

## Entregado

- Dos páginas principales: `/privacidad` y `/terminos` (Términos de uso), con textos breves sobre el funcionamiento real del sitio.
- `/privacidad` reúne datos, finalidades, almacenamiento, métricas opcionales, servicios que intervienen, conservación, derechos y contacto. La sección de almacenamiento está en `/privacidad#cookies`.
- `/terminos` describe catálogo, listas, cuentas y consultas por WhatsApp; la cotización definitiva, facturación y cobros quedan fuera de la web.
- La ruta anterior `/cookies` redirige permanentemente a `/privacidad#cookies` para conservar enlaces existentes; ya no es una tercera página de contenido ni figura en la navegación legal.
- Enlaces permanentes en el footer y aviso informativo en el formulario de registro.
- Preferencias con estadísticas y mapas externos desactivados inicialmente, rechazo de opciones y cambio posterior desde el footer.

## Completar antes de publicar como definitivo

Editar `src/lib/legal-details.ts` con información confirmada por la dueña:

1. Razón social/nombre del responsable, domicilio comercial que corresponda y correo de contacto para privacidad. Se pueden completar directamente en el archivo, sin enviarlos por el chat. Los documentos de este proyecto no solicitan ni muestran RUT. Este ajuste no evalúa otras obligaciones comerciales que puedan corresponder.
2. Plazos reales de conservación de cuentas, listas y eventos, junto con un procedimiento de eliminación que esté aplicado. El panel de 90 días no es un mecanismo de eliminación.
3. Confirmar internamente destinatarios, regiones/países y condiciones de transferencia de los proveedores contratados; no se infieren a partir del dominio. El aviso público describe clases de destinatarios por su función, sin publicar marcas de alojamiento o base de datos ni el inventario técnico. Completar `internationalTransfers` con la información confirmada sobre el tratamiento fuera de Uruguay, evitando detalles de infraestructura innecesarios.
4. Revisar que `/terminos` describa el alcance real: catálogo, listas de pedido, listas de consulta de precios y envío por WhatsApp. La cotización definitiva, la facturación, los cobros y la coordinación de entrega o retiro se gestionan fuera de la web.
5. Revisar permisos de acceso a datos de clientes y las obligaciones de inscripción y documentación del negocio ante la URCDP con su asesor.
6. Tras la revisión y completar los campos, cambiar `reviewed` a `true`. Este indicador es un control editorial del proyecto, no una certificación de cumplimiento legal.

Sin completar los datos requeridos y la revisión, las páginas indican **Documento en preparación**, no se indexan y las estadísticas y mapas integrados opcionales permanecen apagados. El catálogo, listas, acceso y enlaces externos continúan disponibles.

## Finalidades confirmadas por el negocio

- La web prepara listas y facilita su envío por WhatsApp. No emite facturas ni procesa pagos; usar el catálogo o enviar listas no requiere datos de tarjeta ni credenciales bancarias. La cotización definitiva se confirma con el negocio fuera del sitio.
- Estadísticas de uso interno para conocer los productos y categorías más buscados, las búsquedas sin resultados y el uso del catálogo, listas y enlaces de WhatsApp. Se utilizan para mejorar la navegación y la experiencia del usuario, con permiso previo y sin publicidad personalizada.
- Datos de cuenta para gestionar el acceso, asociar las listas guardadas a cada usuario y permitir recuperarlas y reutilizarlas. Datos de contacto y contenido de listas para atender consultas y gestionar pedidos.
- La autorización de estadísticas no es requisito para crear una cuenta, guardar listas ni gestionar pedidos. Los eventos de métricas no incluyen los datos identificativos de la cuenta ni el contenido de sus listas.
- Detectar fallos técnicos es un objetivo del negocio, pero el panel actual no captura errores automáticamente. Los documentos no prometen esa función. Si se incorpora monitoreo de errores, documentar primero qué recoge, su proveedor, permisos y conservación.

## Información pública reducida

La política conserva las finalidades, datos utilizados, clases de destinatarios, información sobre transferencias internacionales, conservación, identidad y domicilio del responsable, contacto y derechos. Se omiten RUT, marcas de infraestructura y claves técnicas de almacenamiento. WhatsApp y Google Maps se identifican donde intervienen directamente en la elección de la persona. El artículo 13 de la Ley 18.331 permite informar destinatarios o clases de destinatarios; describir solo las finalidades no sustituye los demás apartados de información previa.

Estos cambios simplifican la información publicada; no eliminan campos de las cuentas ni datos existentes. El registro mantiene el correo opcional y la elección de métricas por separado.

La redacción se limita a describir las funciones disponibles. No agrega garantías absolutas de seguridad, plazos de atención, promesas de disponibilidad, condiciones de venta o cláusulas generales de exención de responsabilidad. Los borradores siguen sujetos a revisión del negocio; acortar los documentos no modifica las obligaciones que puedan corresponder.

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
