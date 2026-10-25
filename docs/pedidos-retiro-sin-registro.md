# Pedidos para retiro sin registro

## Funcionamiento

- Con **Pedidos desde el catálogo** activado en Edición Web, cualquier visitante puede agregar productos, cantidades, presentaciones y notas al carrito sin crear una cuenta.
- El carrito avisa **Solo retiro en mostrador** a quienes no tienen una cuenta de empresa aprobada. El botón de WhatsApp indica **Pedir para retirar en mostrador**.
- El carrito solicita **Nombre para el retiro**, obligatorio para quienes no tienen una cuenta de empresa aprobada. Se rechazan nombres vacíos o compuestos solo por espacios; se normalizan espacios y se limita el texto a 80 caracteres.
- El mensaje incluye el nombre, los artículos y **RETIRO EN MOSTRADOR (sin envío)**. La confirmación y el horario se coordinan con el local por WhatsApp.
- Se valida el nombre antes de abrir WhatsApp y nuevamente tras comprobar el acceso, por si una cuenta deja de estar aprobada. El error se indica junto al campo y se lleva el foco allí.
- No se crea una cuenta ni un registro de pedido en la base para visitantes. El nombre permanece únicamente en memoria durante la página actual; no se guarda en localStorage ni en listas. Se incorpora al enlace de WhatsApp que la persona decide abrir y al mensaje que puede revisar y enviar.
- El carrito se conserva en este navegador si el almacenamiento está disponible; de lo contrario funciona en memoria durante la página actual. Esto es distinto de una lista guardada en una cuenta.
- Las cuentas pendientes, rechazadas o sin nombre de comercio pueden utilizar el retiro, pero no guardar listas. Si falla la verificación de una cuenta existente, se informa el error y se pide reintentar antes de enviar.

## Empresas y listas guardadas

- El acceso desde **Mi cuenta** informa que el registro es únicamente para negocios y está sujeto a la revisión y confirmación del local. El formulario destaca la aclaración antes de pedir datos, presenta el envío como una solicitud y confirma que la cuenta queda pendiente. También ofrece el enlace al catálogo para pedidos de retiro sin registro. Se conserva `approval_status: 'pending'` al registrar y la comprobación de aprobación al iniciar sesión.
- Se verifica en `customers` que exista un nombre de comercio y que `approval_status` sea `approved` antes de mostrar el botón para guardar listas.
- Se vuelve a comprobar el acceso antes de guardar en `customer_shopping_lists` y antes de preparar el mensaje de empresa. El guardado y la lectura de listas pasan por `/api/customer-shopping-lists`, con cookie de sesión verificada por el servidor; ver `docs/listas-compras-privadas.md` para la configuración.
- Las empresas aprobadas mantienen el mensaje con el nombre y comercio de su cuenta y no deben completar el campo de nombre de retiro. Coordinan las condiciones de atención directamente con el negocio.
- Se reutilizan la sesión de clientes y el control de aprobación que ya usa la aplicación. Este cambio no rediseña la autenticación ni las políticas de la base de datos.

## Configuración y alcance

Se reutilizan el teléfono de WhatsApp y `customer_orders_enabled` de `website_settings`. El retiro sin registro no requiere nuevas variables de entorno. El guardado privado de listas requiere la configuración y migración indicadas en `docs/listas-compras-privadas.md`. Desactivar el interruptor oculta los pedidos, manteniendo el catálogo y la consulta de precios. Las estadísticas internas continúan deshabilitadas.

No se ejecutaron build ni pruebas automáticas en esta entrega.
