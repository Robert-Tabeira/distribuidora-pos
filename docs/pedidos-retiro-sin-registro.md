# Pedidos para retiro sin registro

## Funcionamiento

- Con **Pedidos desde el catálogo** activado en Edición Web, cualquier visitante puede agregar productos, cantidades, presentaciones y notas al carrito sin crear una cuenta.
- El carrito avisa **Solo retiro en mostrador** a quienes no tienen una cuenta de empresa aprobada. El botón de WhatsApp indica **Pedir para retirar en mostrador**.
- El mensaje incluye los artículos y **RETIRO EN MOSTRADOR (sin envío)**. La confirmación y el horario se coordinan con el local por WhatsApp.
- No se agrega un formulario de datos personales ni se crea una cuenta o registro de pedido en la base para visitantes. WhatsApp permite identificar la conversación cuando la persona decide enviar el mensaje.
- El carrito se conserva en este navegador si el almacenamiento está disponible; de lo contrario funciona en memoria durante la página actual. Esto es distinto de una lista guardada en una cuenta.
- Las cuentas pendientes, rechazadas o sin nombre de comercio pueden utilizar el retiro, pero no guardar listas. Si falla la verificación de una cuenta existente, se informa el error y se pide reintentar antes de enviar.

## Empresas y listas guardadas

- Se verifica en `customers` que exista un nombre de comercio y que `approval_status` sea `approved` antes de mostrar el botón para guardar listas.
- Se vuelve a comprobar el acceso antes de guardar en `customer_shopping_lists` y antes de preparar el mensaje de empresa.
- Las empresas aprobadas mantienen el mensaje con su nombre y comercio y coordinan las condiciones de atención directamente con el negocio.
- Se reutilizan la sesión de clientes y el control de aprobación que ya usa la aplicación. Este cambio no rediseña la autenticación ni las políticas de la base de datos.

## Configuración y alcance

Se reutilizan el teléfono de WhatsApp y `customer_orders_enabled` de `website_settings`. No hay migración ni nuevas variables de entorno. Desactivar el interruptor oculta los pedidos, manteniendo el catálogo y la consulta de precios. Las estadísticas internas continúan deshabilitadas.

No se ejecutaron build ni pruebas automáticas en esta entrega.
