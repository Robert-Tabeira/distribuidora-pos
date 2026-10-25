# Unidades por caja cerrada

## Configuración

1. Ejecutar en Supabase → SQL Editor el archivo completo `supabase/migrations/202610250001_product_units_per_box.sql`.
2. Publicar el código actualizado.
3. En **Productos**, abrir un producto pendiente o ya completado, seleccionar **Caja** en **Se vende por** y completar **Unidades por caja cerrada**.
4. Para **Pulpa de tomate Conaprole**, indicar **12** y guardar. La migración no modifica cantidades de productos por su nombre ni asigna 12 a otras cajas.

El dato es opcional para mantener compatibles los productos existentes. Si se completa, debe ser un número entero mayor a cero. Al quitar la venta por caja y guardar, se elimina este dato del producto. El flujo de reemplazar un duplicado también conserva la cantidad ingresada.

## Dónde se muestra

- En el detalle del catálogo, junto a la opción **Por caja**: **Caja cerrada de 12 unidades**. Con pedidos desactivados, se muestra igualmente la presentación de la caja.
- En el carrito, se detalla la cantidad por caja y, al pedir más de una caja, el total de unidades.
- En WhatsApp: por ejemplo, **2 cajas de Pulpa de tomate Conaprole (12 unidades por caja cerrada; 24 unidades en total)**, conservando las notas del producto y la modalidad de retiro cuando corresponde.
- Las listas de empresas guardadas desde esta versión incluyen una copia de las unidades por caja. Las listas anteriores siguen funcionando sin ese dato. Al repetir una lista se consulta la presentación actual del producto en el catálogo.

La cantidad del pedido sigue expresada en cajas; el dato no cambia precios ni convierte el pedido automáticamente a unidades sueltas. Las formas de venta distintas de caja mantienen su comportamiento.

## Compatibilidad y entrega

La columna nueva es nullable y tiene una restricción para aceptar únicamente enteros positivos. El catálogo reintenta la consulta sin la columna si la migración todavía no se aplicó, para seguir mostrando los productos. El editor informa la migración requerida si se intenta guardar una cantidad sin la columna instalada.

Código y migración preparados. No se ejecutó la migración remota, el build ni pruebas automáticas.
