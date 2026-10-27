# Páginas legales y preferencias

## Entregado

- Dos páginas principales: `/privacidad` y `/terminos` (Términos de uso), con textos breves sobre el funcionamiento real del sitio.
- `/privacidad` adopta el formato breve del ejemplo aportado por el usuario: presentación, referencia a la Ley 18.331, finalidades, servicios de soporte, contacto y un apartado breve de almacenamiento y mapa automático en `/privacidad#cookies`. Las estadísticas internas siguen deshabilitadas; no se ofrecen como finalidad ni permiso en el documento.
- `/terminos` utiliza el formato numerado del ejemplo aportado: uso, registro, listas y WhatsApp, confirmación de pedidos y precios, coordinación de entrega/retiro, datos personales, contenidos, normativa y domicilio. La cotización definitiva, facturación y cobros quedan fuera de la web.
- La ruta anterior `/cookies` redirige permanentemente a `/privacidad#cookies` para conservar enlaces existentes; ya no es una tercera página de contenido ni figura en la navegación legal.
- Enlaces permanentes en el footer y aviso informativo en el formulario de registro.
- El mapa externo se carga automáticamente, sin solicitar permiso. El acceso de privacidad del footer muestra información; no se presenta un aviso automático mientras las estadísticas están deshabilitadas.
- Publicación habilitada por solicitud del usuario el 24 de octubre de 2026. El aviso de borrador deja de mostrarse y las páginas permiten indexación.

## Publicación y mantenimiento de la información

Editar `src/lib/legal-details.ts` con información confirmada por la dueña:

1. Razón social/nombre del responsable, domicilio comercial que corresponda y un medio de contacto para privacidad. Están cargados Rusterson Sociedad Anónima, Ruta Interbalnearia Km 47 y Calle B, Las Toscas, Canelones, República Oriental del Uruguay, y atención presencial en ese domicilio. La dirección se comparte entre ambas páginas legales. El correo del negocio no es un requisito de esta configuración. Los documentos de este proyecto no solicitan ni muestran RUT. Este ajuste no evalúa otras obligaciones comerciales que puedan corresponder.
2. Plazos reales de conservación de cuentas y listas, junto con un procedimiento de eliminación que esté aplicado. Si existen registros de estadísticas anteriores al bloqueo, revisar también su conservación y eventual eliminación; desactivar la función no los borra.
3. Confirmar internamente destinatarios, regiones/países y condiciones de transferencia de los proveedores contratados; no se infieren a partir del dominio. El aviso público describe clases de destinatarios por su función, sin publicar marcas de alojamiento o base de datos ni el inventario técnico. Completar `internationalTransfers` con la información confirmada sobre el tratamiento fuera de Uruguay, evitando detalles de infraestructura innecesarios.
4. Revisar que `/terminos` describa el alcance real: catálogo, listas de pedido, listas de consulta de precios y envío por WhatsApp. La cotización definitiva, la facturación, los cobros y la coordinación de entrega o retiro se gestionan fuera de la web.
5. Revisar permisos de acceso a datos de clientes y las obligaciones de inscripción y documentación del negocio ante la URCDP con su asesor.
6. La publicación se controla con `published`, actualmente `true` por solicitud del usuario. Es un control editorial del proyecto, no una certificación de cumplimiento legal. `retentionDetails` e `internationalTransfers` son campos de texto ampliado y ya no bloquean la publicación cuando están vacíos; no se inventa su contenido.

Con `published: true`, razón social, domicilio y contacto completos, las páginas se muestran sin aviso de borrador y permiten indexación. El mapa se carga automáticamente. Las estadísticas están deshabilitadas de forma independiente: publicar las páginas no las reactiva. El catálogo, listas, acceso y enlaces externos continúan disponibles.

## Contacto de privacidad sin correo

`privacyContact` contiene el medio de contacto que se muestra en ambos documentos. Actualmente indica atención presencial en el local, utilizando el domicilio confirmado por el negocio. `privacyContactHref` es opcional: puede configurarse con un enlace `tel:` o de WhatsApp si se confirma ese canal y su número. No se inventó ni se publicó un teléfono sin confirmar.

El correo opcional de las cuentas de clientes para recuperar el acceso es una función distinta y se mantiene. El negocio debe organizar la recepción y tramitación de solicitudes presenciales. Los formularios de ejercicio de derechos de la [URCDP](https://www.gub.uy/unidad-reguladora-control-datos-personales/tramites-y-servicios/formularios) contemplan su presentación ante la empresa.

## Finalidades confirmadas por el negocio

- La web prepara listas y facilita su envío por WhatsApp. No emite facturas ni procesa pagos; usar el catálogo o enviar listas no requiere datos de tarjeta ni credenciales bancarias. La cotización definitiva se confirma con el negocio fuera del sitio.
- Los visitantes pueden preparar pedidos sin registro únicamente para retirar en mostrador, cuando el interruptor de pedidos está activo. El carrito y el mensaje de WhatsApp indican esa modalidad. Las listas guardadas en una cuenta se reservan para empresas aprobadas. Ver `docs/pedidos-retiro-sin-registro.md`.
- Para identificar pedidos sin registro, se pide un nombre obligatorio que se añade al mensaje de WhatsApp. Se mantiene en memoria durante la página actual, sin crear cuenta ni guardarlo en el almacenamiento local de la web.
- Estadísticas internas de navegación deshabilitadas por decisión del negocio. El código anterior se conserva inactivo; no se solicita autorización para habilitarlo en la interfaz actual.
- Datos de cuenta para gestionar el acceso, asociar las listas guardadas a cada usuario y permitir recuperarlas y reutilizarlas. Datos de contacto y contenido de listas para atender consultas y gestionar pedidos.
- El negocio confirmó que utiliza los datos para el funcionamiento del servicio de cuentas y listas, gestión de consultas y pedidos y atención en el local en Uruguay. Esta finalidad local no confirma la ubicación física de servidores ni las condiciones de los prestadores.
- Cuentas, listas y consultas funcionan sin el sistema de estadísticas.
- No se incorpora monitoreo automático de errores. Si se decide agregarlo, documentar primero qué recoge, su proveedor, permisos y conservación.

## Información pública reducida

La política conserva las finalidades, datos utilizados, clases de destinatarios, información sobre transferencias internacionales, conservación, identidad y domicilio del responsable, contacto y derechos. Se omiten RUT, marcas de infraestructura y claves técnicas de almacenamiento. WhatsApp y Google Maps se identifican donde intervienen directamente en la elección de la persona. El artículo 13 de la Ley 18.331 permite informar destinatarios o clases de destinatarios; describir solo las finalidades no sustituye los demás apartados de información previa.

La mención a servidores fuera de Uruguay describe alojamiento o procesamiento técnico para el servicio. No se deduce una finalidad comercial adicional ni se declara que los datos permanezcan físicamente en Uruguay. La región contratada y las condiciones siguen pendientes de confirmar; `internationalTransfers` permanece vacío hasta verificarlo. La [documentación de regiones de Supabase](https://supabase.com/docs/guides/platform/regions) explica que la región elegida determina dónde se guardan los datos principales del proyecto.

Estos cambios simplifican la información publicada; no eliminan campos de las cuentas ni datos existentes. El registro mantiene el correo opcional. Las preferencias ya no ofrecen activar estadísticas.

La redacción se limita a describir las funciones disponibles. No agrega garantías absolutas de seguridad, plazos de atención, promesas de disponibilidad, condiciones de venta o cláusulas generales de exención de responsabilidad. La publicación solicitada no modifica las obligaciones que puedan corresponder.

La adaptación del ejemplo no incorpora comunicaciones promocionales ni una declaración de ausencia total de prestadores externos. Tampoco reproduce garantías de seguridad absoluta ni la exención general de responsabilidad del modelo. La identidad, domicilio y contacto figuran en párrafos en lugar de una ficha extensa. Los detalles de conservación y transferencias se muestran cuando se completan `retentionDetails` e `internationalTransfers`; mientras sigan vacíos no se inventan plazos ni regiones. `LEGAL_READY` representa el estado de publicación y los datos básicos, sin depender de esos textos ampliados.

Los términos se adaptan al servicio de listas y comunicación por WhatsApp. No se copian los medios de pago, señas, reservas, plazos de retiro o condiciones de devoluciones del comercio del ejemplo; tampoco la renuncia de jurisdicción ni las exenciones generales de responsabilidad. La coordinación de una operación con el local no implica que se facture o cobre en la web.

## Publicación y bloqueo de estadísticas

1. Aplicar `supabase/migrations/202610230002_disable_site_analytics.sql` para cerrar recepción y consulta de métricas desde clientes anteriores. No requiere instalar las migraciones antiguas si las métricas nunca se habilitaron.
2. Publicar el código en Vercel. La configuración del código bloquea las estadísticas aun si existen preferencias antiguas o se completa la revisión legal.
3. La publicación ya está habilitada en el código. El mapa se carga automáticamente sin depender de las preferencias.

No se agregan secretos ni variables de entorno. No se ejecutaron migraciones remotas en esta entrega.

## Comportamiento del consentimiento

- Las estadísticas están bloqueadas por `SITE_ANALYTICS_ENABLED = false`, sin depender del consentimiento. El componente público borra el identificador local anterior sin recopilar actividad.
- El código de preferencias de estadísticas se conserva inactivo. Si se habilitara expresamente en el futuro, guardaría la elección con fecha, versión y vencimiento de 180 días; con almacenamiento bloqueado, solo en memoria. El panel informativo actual no guarda una elección al cerrarse.
- La versión de preferencias usa `LEGAL_VERSION` y el sufijo `-draft` solo si no está publicada. No condiciona la carga del mapa. Las estadísticas permanecen bloqueadas.
- Los nuevos guardados de preferencias fuerzan `analytics: false`; los valores anteriores se interpretan como falsos mientras la funcionalidad esté deshabilitada.
- Deshabilitar la recopilación no elimina eventos previos en la base. El procedimiento de acceso/supresión debe contemplar los identificadores y los registros que razonablemente puedan identificarse, sin recolectar datos excesivos para esa verificación.
- El iframe de Google Maps se monta directamente con `loading="lazy"`: el navegador inicia su carga al acercarse a la sección. Las preferencias antiguas y el antiguo ajuste `map_load_on_click` no bloquean el mapa. La vista previa del editor conserva una representación sin iframe.
- El editor ya no ofrece carga del mapa al pulsar. La política y el panel informativo explican la conexión automática con Google y los datos técnicos que puede recibir. No se agregan dependencias ni migraciones SQL. No se ejecutaron pruebas ni build; revisión estática del diff.
- La tipografía de Google utilizada por el diseño está alojada en el propio proyecto.
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
