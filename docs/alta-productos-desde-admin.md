# Crear productos desde administración

El panel Productos incluye el botón «Nuevo producto» encima de las pestañas. Abre el formulario existente con nombre vacío, venta por unidad, sin categoría, fotos ni variantes, y las opciones de media caja y media horma desactivadas. Genera un código inicial que se puede cambiar o regenerar.

«Crear producto» inserta la ficha completa y visible en el catálogo, usando los mismos campos y validaciones de la edición: nombre, código, descripción, variantes, presentaciones, unidades por caja, medias cajas, medias hormas, categoría, subcategoría y ubicación. La base devuelve la ficha guardada, que se incorpora a la lista. El panel abre la pestaña Productos, limpia la búsqueda y ordena por modificación reciente para mostrar el alta. Las fotos se cargan luego con el botón de imágenes de esa fila.

Abrir o cancelar el formulario no inserta una ficha pendiente ni crea registros vacíos. Los errores conservan los campos para corregirlos y reintentar; mientras se guarda, se deshabilitan Crear y Cancelar y se impide cerrar desde el fondo.

Se mantiene el aviso de productos similares. En un alta nueva se puede continuar y crear una ficha diferente, volver al formulario, descartar el alta sin borrar el existente o abrir el producto existente para editarlo con sus datos actuales. Esta última opción no sobrescribe automáticamente sus fotos ni sus datos con el formulario nuevo. La resolución de duplicados pendientes ya ingresados conserva su funcionamiento anterior.

No requiere SQL nuevo ni cambios de permisos. Utiliza la ruta de personal autorizada y la tabla `products` existente; se mantienen los avisos de las migraciones previas si faltan sus columnas.

## Revisión manual después de publicar

1. En móvil y escritorio, abrir Nuevo producto desde ambas pestañas. Cancelar y comprobar que no aumenta la cantidad de productos, incluso después de recargar.
2. Crear una ficha con nombre único, categoría, subcategoría, ubicación, descripción y variantes. Configurar Caja/Horma y sus mitades, guardar y comprobar el cambio de pestaña y la ficha después de recargar.
3. Usar el botón de imágenes de la nueva ficha para cargar sus fotos. Revisar el detalle del catálogo.
4. Crear un nombre similar y revisar las opciones de continuar, volver al formulario, descartar y editar el existente. Comprobar que descartar no borra el existente ni crea uno nuevo, y que abrir el existente conserva sus fotos y configuración.
5. Abrir una ficha existente y un pendiente de mostrador; guardar y revisar que la edición y la detección de duplicados sigan funcionando.

Revisión estática con `git diff --check`. No se ejecutaron pruebas, build, comprobación de tipos ni escrituras remotas.
