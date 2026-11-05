# Eliminar productos que aparecen en pedidos

El error PostgreSQL `23503` de `order_items_product_id_fkey` significa que un artículo de pedido conserva una referencia a la ficha del producto. El borrado anterior estaba bloqueado por esa relación.

Ejecutar el contenido completo de `supabase/migrations/202611050001_preserve_order_items_on_product_delete.sql` en el editor SQL de Supabase. No alcanza con publicar el código: la relación debe actualizarse en la base de datos.

La migración permite que `order_items.product_id` sea nulo y configura la relación con `ON DELETE SET NULL`. No elimina productos ni pedidos al ejecutarla. Cuando el administrador borra posteriormente una ficha, PostgreSQL desvincula las líneas de pedidos que la referenciaban, dentro de la misma operación. Conserva sus nombres, cantidades, pesos, volúmenes, detalles de caja y notas. Caja e Historial muestran esos datos guardados y no necesitan la ficha original.

No se agrega `ON DELETE CASCADE` a los artículos de pedidos, no se modifican sus permisos y no se borran archivos de imágenes. Las demás relaciones de la base mantienen sus restricciones; si otra impide eliminar un producto, el panel informa el bloqueo sin eliminar los registros relacionados.

El panel solo retira una ficha de su lista cuando Supabase devuelve su identificador como eliminado. Las listas de compras guardadas mantienen su copia del nombre; su validación existente avisa si un producto eliminado ya no está disponible para repetir el pedido.

## Revisión manual después de aplicar la migración

En un entorno de prueba, usar un producto de prueba asociado a un pedido:

1. Anotar el nombre, cantidades y notas de la línea del pedido.
2. Eliminar la ficha desde Productos y recargar el panel y el catálogo: no debe aparecer.
3. Abrir el pedido en Caja o Historial: debe conservar la línea y sus datos. En la base, solo su referencia `product_id` debe quedar nula.
4. Comprobar también el borrado de un producto sin pedidos y el descarte de un duplicado.

Revisión estática con `git diff --check`. No se ejecutaron pruebas, build, comprobación de tipos ni la migración en una base remota.
