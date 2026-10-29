# Visibilidad de cada hero por dispositivo

Antes de publicar, ejecutar el contenido completo de `supabase/migrations/202610290002_hero_device_visibility.sql` en Supabase. Agrega dos campos con valor inicial `true`, conservando la visibilidad actual. No reemplaza la migración anterior de tipografía del botón.

En Edición web → Hero → Editar → **Mostrar este hero en**, seleccionar Móvil, Escritorio / tablet o ambos. Desmarcar ambos lo oculta sin eliminarlo. El estado se ve también en la lista de heroes del editor. La desactivación general `is_active` sigue teniendo prioridad.

El corte es de 768 px, coincidente con la imagen móvil del hero. Las listas, flechas, indicadores y rotación automática incluyen únicamente heroes activos y habilitados para cada pantalla. Con uno solo se ocultan los controles de rotación. Con ninguno, desaparece el carrusel y queda únicamente una franja oscura de 72 px detrás del header, para conservar la legibilidad de su logo y enlaces.

Ambas variantes se generan desde el servidor y su visibilidad inicial depende de CSS. Un `source` de imagen transparente evita descargar la imagen de la variante oculta. Los temporizadores solo funcionan en el tamaño de pantalla activo y se actualizan al redimensionar. Una consulta correcta sin heroes devuelve una lista vacía; no vuelve a mostrar los heroes de ejemplo.

Verificación manual sugerida: crear un hero exclusivo de móvil y otro de escritorio, guardar y recargar el editor, revisar ambas pantallas y cambiar el ancho con el carrusel en una posición avanzada. Comprobar también un único hero y ninguno visible por dispositivo.

No se ejecutan SQL remoto, pruebas, build ni comprobaciones de tipos en esta entrega. Revisión estática del diff.
