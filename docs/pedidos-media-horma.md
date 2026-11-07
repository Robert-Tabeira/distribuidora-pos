# Pedidos por horma y media horma

## Aplicación

Ejecutar el contenido completo de `supabase/migrations/202611060002_product_half_wheel.sql` en Supabase y publicar el código. Agrega `products.allow_half_wheel`, desactivado por defecto, y crea la opción Horma (`horma`) en `unit_types` si esa tabla existe y aún no contiene esa opción. Si ya existe, respeta su nombre, icono y orden. Una tabla vacía conserva también las cinco opciones que antes usaba el formulario por defecto.

No habilita Horma ni Media horma en ningún producto existente automáticamente. Las lecturas del catálogo y las listas toleran que la nueva columna aún no exista; en ese caso, no ofrecen media horma. El formulario indica la migración pendiente si se intenta guardar sin aplicarla.

## Configuración

En Productos → Editar → Se vende por, seleccionar Horma. Aparece la casilla «Permitir pedidos de media horma». Marcarla y guardar habilita la mitad únicamente para esa ficha; sus variantes comparten la configuración. Guardar sin Horma desactiva esta autorización. El guardado de un duplicado conserva la elección en la ficha que se mantiene.

No basta con vender por kilo para habilitar las hormas: se debe seleccionar Horma explícitamente. No se presupone un peso fijo ni se convierten hormas a kilogramos.

## Pedido y listas

El cliente selecciona Por horma y después 1 horma o 1/2 horma, cuando esté habilitada. Ninguna opción está preseleccionada. Agregar al pedido permanece disponible; si falta la elección, muestra un aviso y enfoca el selector. Cambiar a otra presentación descarta la elección anterior; abrir otro producto reinicia ambos pasos.

El carrito y las listas muestran las mismas etiquetas. Se guardan `horma` y `media_horma` como presentaciones distintas, conservando cantidad, variante y notas. La cantidad 1 de media horma representa 1/2 horma; la cantidad 2 representa dos medias hormas. WhatsApp indica «1 horma», «2 hormas», «1 media horma» o «2 medias hormas» según corresponda.

El servidor valida las presentaciones contra la ficha vigente al guardar una lista. Deshabilitar media horma y recargar invalida esa presentación en el carrito y las listas: se puede corregir o quitar antes de guardar, repetir o enviar, sin convertirla automáticamente en una horma completa. La caja y media caja conservan su funcionamiento.

## Revisión manual pendiente del despliegue

1. Aplicar la migración y comprobar que Horma aparece en el formulario; volver a ejecutarla no debe duplicar la opción.
2. Habilitar Horma sin media horma: Por horma debe desplegar únicamente 1 horma.
3. Habilitar media horma, guardar y reabrir la ficha. En móvil y escritorio, elegir Por horma y comprobar las dos opciones sin preselección y el aviso al agregar sin elegir.
4. Agregar una horma entera y una media horma del mismo producto y variante: deben ser líneas distintas. Aumentar la cantidad y revisar el texto de WhatsApp sin enviarlo.
5. Guardar, editar y repetir una lista con ambas presentaciones desde una cuenta aprobada.
6. Deshabilitar media horma, recargar y comprobar el aviso de presentación no disponible y su reparación. Revisar un producto con Caja y Horma, cambiando entre ambos selectores, y otro sin ninguna de esas presentaciones.

Revisión estática con `git diff --check`; sin pruebas, build, comprobación de tipos ni SQL remoto.
