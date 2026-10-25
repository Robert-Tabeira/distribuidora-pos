# Mi cuenta y listas reutilizables

## Activación

1. Mantener el acceso de servidor de listas privadas ya configurado (`SUPABASE_SERVICE_ROLE_KEY`, migración `202610250003_private_customer_shopping_lists.sql` y sesión de negocio aprobada).
2. Antes de publicar esta versión, ejecutar en Supabase → SQL Editor el archivo completo `supabase/migrations/202610250004_editable_customer_shopping_lists.sql`. Agrega `name` y `updated_at` conservando los artículos guardados y concede actualización al rol de servidor. Mantiene las restricciones de acceso privado.
3. Publicar el código. No requiere variables de entorno ni dependencias adicionales.

## Mi cuenta

- Diseño con fondos crema, acentos oliva, títulos Lora y cuerpo DM Sans, siguiendo el catálogo. Navegación horizontal en móvil y tablet; panel lateral desde escritorio.
- **Mis listas** muestra tarjetas con nombre, fecha, cantidad de artículos y un resumen. Las listas anteriores sin nombre usan «Pedido del…». Las imágenes nuevas se guardan como parte de la copia de cada artículo; el detalle consulta las imágenes actuales para listas anteriores.
- **Ver y editar** abre el detalle con miniaturas, cantidades, presentación, contenido de cajas y notas.
- **Editar lista** permite poner nombre (hasta 80 caracteres), cambiar cantidades y presentaciones, editar anotaciones, quitar artículos y buscar otros productos del catálogo para agregarlos. Un artículo nuevo requiere elegir presentación. La lista debe conservar al menos un artículo válido.
- **Guardar cambios** actualiza la misma lista de la cuenta autenticada. La edición conserva su borrador si falla el guardado. Si la lista cambió en otra ventana, se pide volver a abrirla; no se pisan cambios silenciosamente.
- Al cerrar o cancelar una edición con cambios pendientes, se pide confirmación para descartarlos.
- **Repetir pedido** consulta la lista y las presentaciones actuales, carga los artículos en el carrito y abre «Mi pedido» en el catálogo. Si ya había un carrito, se pide confirmar su reemplazo. Si un producto o presentación ya no está disponible, se solicita revisar la lista antes de repetirla.
- Repetir no envía WhatsApp ni confirma un pedido por sí solo. El cliente revisa el carrito y usa el botón de WhatsApp cuando quiera enviarlo. Editar la lista no modifica mensajes de pedidos enviados previamente.

## Instructivo de landing

En **Edición web → Bloques de Landing → Nuevo bloque**, elegir **Cómo repetir pedidos con listas guardadas** y guardar como visible. Se cargan tres pasos con textos editables:

1. Guardar la primera lista desde el carrito y ponerle un nombre desde Mi cuenta.
2. Ver y editar los artículos guardados.
3. Repetir, revisar y enviar el pedido por WhatsApp.

Admite las mismas imágenes para escritorio/móvil, colores, números, fondos, botón, tipografías y pesos de los bloques de instrucciones existentes. El botón inicial lleva a `/cliente/cuenta`. El bloque es independiente de las instrucciones de consulta de precios y de pedidos; se puede reordenar u ocultar desde el editor.

## Alcance de revisión

Revisión estática de los cambios y del diff. No se ejecutaron pruebas, build ni comprobaciones de tipos. No se aplicó la migración ni se creó contenido remoto automáticamente.
