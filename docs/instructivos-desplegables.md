# Cómo utilizar el catálogo web: instructivos desplegables

## Comportamiento al publicar este cambio

Si aún no existe un bloque contenedor guardado y hay al menos dos instructivos visibles, la landing los reúne automáticamente bajo **Cómo utilizar el catálogo web**, en la posición del primer instructivo. Cada instructivo aparece una sola vez. Se incluyen consultas de precios, pedidos, retiro en mostrador y listas guardadas, según los bloques existentes y visibles.

Las filas tienen un icono, título y flecha. Empiezan cerradas; abrir una cierra la anterior y tocarla de nuevo la cierra. Funcionan con toque, clic y teclado (Enter/Espacio; flechas arriba/abajo, Inicio y Fin para recorrer los títulos). Los paneles tienen sus relaciones ARIA. Sus imágenes se montan solo al abrir el panel y conservan la ampliación al tocarlas.

## Personalización

En **Edición web → Secciones → Bloques de Landing → Personalizar guía del catálogo**, se abre el contenedor existente o se prepara uno nuevo con los instructivos visibles seleccionados.

- Guardá para crear el bloque **Cómo utilizar el catálogo (desplegables)**. El título y la descripción generales son editables.
- Elegí los instructivos incluidos, usá las flechas para ordenarlos y, opcionalmente, cambiá el título de cada desplegable. Si se deja vacío, utiliza el título original del instructivo.
- Personalizá fondos, tarjetas, bordes, iconos, colores de texto, tipografías, pesos y alineación del encabezado por dispositivo.
- Para editar pasos, imágenes de escritorio/móvil, botones y colores interiores, seguí editando cada bloque original. El contenedor referencia esos bloques; no copia ni reemplaza su contenido.
- Los instructivos incluidos no se repiten fuera de la guía. Los no seleccionados conservan su lugar como bloques individuales. Ocultar un instructivo también lo quita de los desplegables.
- El contenedor se crea inicialmente a la altura del primer instructivo seleccionado. Podés moverlo con las flechas de los bloques.
- Si ocultás el contenedor guardado, sus instructivos visibles vuelven a mostrarse individualmente. Si lo eliminás y quedan dos o más instructivos visibles, se aplica otra vez la agrupación automática. Para agrupar nuevamente uno oculto, volvé a mostrarlo.
- Si se crean varios contenedores y repiten una selección, cada instructivo se muestra solo en el primero según el orden de la landing.

Los cambios se guardan en los ajustes JSON y el tipo de bloque de texto existentes. No requiere SQL, nuevas dependencias ni copiar imágenes. No se ejecutaron pruebas, build ni comprobación de tipos; se revisó el diff estáticamente.
