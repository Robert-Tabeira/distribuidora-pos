# Unidades por funda

Ejecutar el contenido completo de `supabase/migrations/202611070001_product_units_per_bag.sql` en Supabase antes de utilizar el nuevo campo. Agrega `products.units_per_bag`, un entero opcional mayor a cero. Los productos existentes comienzan sin ese dato. No cambia las unidades por caja ni activa la venta por funda automáticamente.

En Productos → Nuevo producto o Editar → Se vende por, elegir Funda. Aparece «Unidades por funda (opcional)», con la misma lógica que el campo de cajas. Se puede indicar un entero entre 1 y 2147483647 o dejarlo vacío. El formulario, el guardado normal y la resolución de duplicados validan el dato; quitar Funda o vaciarlo y guardar elimina la cantidad anterior. Volver a abrir una ficha recupera la cantidad guardada; un alta nueva empieza sin cantidad.

El detalle del catálogo muestra la cantidad bajo Por funda y también cuando los pedidos estén deshabilitados. El carrito, las listas y el mensaje de WhatsApp indican, por ejemplo, «6 unidades por funda; 12 unidades en total» para dos fundas. Las variantes comparten el contenido de funda de la ficha. No se agrega media funda ni se presupone ninguna equivalencia entre cajas y fundas.

El servidor obtiene la cantidad de la ficha vigente al guardar una lista, sin confiar en un valor enviado por el cliente, y la guarda como copia en la línea JSON. Las listas anteriores sin ese campo siguen siendo válidas. Si un producto ya no existe, la copia del dato puede seguir mostrándose en la lista; no habilita repetir un producto no disponible. Si se borra la cantidad de la ficha vigente, no se sustituye por un dato antiguo para esa funda.

El catálogo y las consultas de listas toleran que todavía falte la columna, omitiendo el dato en ese caso. El administrador recibe un aviso indicando qué migración ejecutar si intenta guardarlo antes de aplicarla. No se modifican los permisos de escritura.

## Revisión manual pendiente del despliegue

1. Aplicar la migración. Crear y editar un producto con Funda, indicar 6 y reabrir la ficha para comprobar su persistencia.
2. En móvil y escritorio, revisar el detalle del catálogo y agregar dos fundas: deben indicar 6 unidades por funda y 12 en total. Revisar WhatsApp sin enviar el mensaje.
3. Guardar, editar y repetir la lista desde una cuenta aprobada. Comprobar que se mantiene la presentación por funda y se muestra su contenido.
4. Usar un producto con caja de 12 y funda de 6; comprobar que cada presentación usa su propio dato y que las medias cajas siguen funcionando.
5. Vaciar el campo o quitar Funda y guardar; reabrir y comprobar que se limpia. Probar vacío, cero, negativo, decimal y un valor superior al máximo; solo vacío o enteros dentro del rango deben guardarse.
6. Revisar productos sin este dato, listas antiguas, variantes y duplicados, además de un alta nueva después de haber editado otro producto con funda.

Revisión estática con `git diff --check`. No se ejecutaron pruebas, build, comprobación de tipos ni SQL remoto.
