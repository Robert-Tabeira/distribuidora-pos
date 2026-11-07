# Pedidos de media caja

## Instalación

Ejecutar el contenido completo de `supabase/migrations/202611060001_product_half_box.sql` en el editor SQL de Supabase y publicar los cambios. El nuevo campo `products.allow_half_box` comienza en `false` para todos los productos existentes. La migración no modifica sus presentaciones ni habilita medias cajas automáticamente.

Si la columna aún no existe, las lecturas del catálogo y las listas guardadas continúan funcionando sin ofrecer media caja. El formulario del administrador informa qué migración falta al guardar.

## Configuración por producto

En Productos, abrir la ficha y marcar Caja en «Se vende por». Dentro de ese bloque aparece la casilla «Permitir pedidos de media caja». Guardar la ficha conserva esa elección, también en el reemplazo de un producto duplicado. Al guardar sin Caja, la autorización de media caja queda desactivada.

Las variantes del producto comparten esta autorización. No se crea una presentación global en `unit_types`: habilitarla en un producto no afecta a los demás.

## Catálogo, pedidos y listas

El catálogo ofrece Media caja únicamente si el producto admite Caja y tiene la casilla habilitada. No se preselecciona ninguna presentación. Media caja se conserva como `media_caja`, separada de `caja`; no se usan cantidades decimales ni se convierte una selección en otra automáticamente.

Una cantidad de 1 corresponde a media caja; una cantidad de 2 corresponde a dos medias cajas. Para una caja de 12 unidades, el detalle, el carrito y las listas muestran 6 unidades por media caja, y el pedido de dos medias cajas informa 12 unidades en total. Si no hay cantidad por caja, se muestra la presentación sin inventar el contenido. Si la caja contiene un número impar, se indica la cantidad de la caja completa sin deducir un fraccionamiento de sus unidades.

WhatsApp distingue «1 media caja» y «2 medias cajas». Las cajas completas y medias cajas quedan en líneas distintas, conservando las variantes y notas. Las listas guardadas permiten guardar, editar y repetir esa presentación. El servidor valida la autorización consultando el producto actual, sin confiar en un campo de autorización enviado por el navegador.

Al deshabilitar la casilla y volver a cargar el catálogo o la lista, una media caja guardada deja de ser una presentación válida: se pide elegir otra o quitar el artículo antes de guardar, repetir o enviar. El carrito ofrece un selector para reparar esa presentación; no la sustituye automáticamente.

## Revisión manual pendiente del despliegue

1. Aplicar la migración. Comprobar que un producto existente no ofrece media caja.
2. Habilitar Caja y Media caja, indicar 12 unidades, guardar y reabrir la ficha.
3. En móvil y escritorio, intentar agregar sin elegir presentación y comprobar el aviso. Seleccionar Media caja: debe mostrar 6 unidades.
4. Agregar una caja completa y una media caja del mismo producto. Comprobar que son líneas distintas y que aumentar la media caja a cantidad 2 informa 12 unidades.
5. Revisar el texto de WhatsApp sin enviarlo. Guardar la lista desde una cuenta aprobada, editarla y repetirla.
6. Deshabilitar Media caja, recargar y comprobar que no puede enviarse o repetirse la selección anterior sin revisarla. Probar también un producto sin cantidad por caja y otro con cantidad impar.

Se revisó el código estáticamente con `git diff --check`. No se ejecutaron pruebas, build, comprobación de tipos ni SQL remoto.
