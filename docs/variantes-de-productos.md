# Variantes de productos

Antes de publicar, ejecutar el contenido completo de `supabase/migrations/202611010001_product_variants.sql` en Supabase. Agrega `products.variants`, una lista JSON de opciones con identificador estable, nombre y disponibilidad. Los productos existentes comienzan sin variantes. No modifica sus datos comerciales ni las listas de compras anteriores.

## Edición

En el formulario de producto del administrador, el apartado **Variantes del producto** permite agregar hasta 50 opciones, nombrarlas, renombrarlas, desactivarlas o quitarlas. Los nombres deben ser distintos y tener como máximo 80 caracteres. Ejemplo: un único producto «Cobertura de chocolate» con «Blanco», «Negro» y «Con leche».

Cada opción conserva su identificador al renombrarla. Para una baja temporal, conviene desactivarla. Eliminar y crear otra opción genera otro identificador; los pedidos y listas anteriores no se convierten automáticamente a esa nueva opción, aunque su nombre coincida.

Las variantes comparten fotos, descripción, presentaciones y unidades por caja de la ficha. No tienen precio, imagen, stock ni código propio en esta versión. Si necesitan datos comerciales diferentes, siguen siendo productos diferentes.

## Catálogo y pedidos

- El detalle muestra las variantes disponibles y exige elegir una, incluso cuando solo queda una disponible. No hay una opción preseleccionada. Al pulsar Agregar sin elegir, aparece el aviso en el selector y el producto no se agrega.
- El mismo producto puede agregarse en varias variantes. Solo aumenta una línea existente si coinciden producto, variante, presentación y anotación.
- El carrito permite cambiar la variante de cada línea. Si una opción queda inactiva, se elimina o un producto que antes no tenía variantes ahora las requiere, hay que elegir una opción válida antes de enviar o guardar.
- La consulta de precios conserva cada variante por separado y la nombra en WhatsApp. Una consulta antigua con una variante pendiente se conserva y avisa que hay que quitar esa línea y seleccionar una opción vigente.
- Los mensajes de pedido incluyen cantidad, presentación, producto y variante, por ejemplo: «2 unidades de Cobertura de chocolate — Blanco».

## Listas guardadas

El servidor verifica que cada variante pertenece al producto y está activa. Guarda su identificador y toma su nombre del catálogo, en lugar de confiar en un nombre enviado por el navegador. Al editar una lista, se puede elegir otra variante; al repetirla, se conserva la elección.

Las listas y carritos antiguos sin variantes siguen funcionando para los productos que no las tienen. Si se agregan variantes posteriormente al producto, se solicita elegir una; no se adivina cuál quería el cliente. Las listas existentes usan JSON y no necesitan otra migración.

## Revisión después de publicar

1. Crear las tres variantes del ejemplo, guardar el producto y volver a abrirlo.
2. Abrirlo en móvil y escritorio; intentar agregar sin seleccionar y comprobar el aviso. Seleccionar variante y presentación para continuar.
3. Agregar Blanco y Negro y comprobar que son líneas distintas. Repetir Blanco con la misma presentación y nota para comprobar el aumento de cantidad.
4. Consultar ambos precios y revisar el texto de WhatsApp sin enviarlo. Revisar también el texto del pedido con su variante.
5. Guardar la lista desde una cuenta de negocio aprobada, editar una variante y repetir el pedido.
6. Desactivar una opción y volver a cargar el catálogo o la lista: debe avisar que no está disponible. Verificar un producto sin variantes y una lista anterior.
7. Desactivar todas las opciones: el producto sigue mostrando su ficha pero no permite agregarlo con una variante inexistente.

Entrega revisada estáticamente con `git diff --check`. No se ejecutaron pruebas, build, comprobación de tipos ni SQL remoto. La revisión de interacción descrita queda pendiente del despliegue con la migración aplicada.
