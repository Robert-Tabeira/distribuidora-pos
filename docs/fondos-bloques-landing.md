# Fondos editables de la landing

En **Edición web → Bloques de Landing → Editar**, el panel **Fondo de la sección** aparece antes de la tipografía, abierto de forma predeterminada.

- **Color de fondo del bloque** cambia toda la sección, incluidos contenido, información del local, banners, tarjetas, carruseles, productos y los tres tipos de instructivos.
- **Fondo de las tarjetas o recuadros** cambia la superficie interior cuando el bloque incluye tarjetas. En categorías y ubicación usa las mismas opciones guardadas que sus controles anteriores.
- En los instructivos, **Mostrar textura decorativa en el fondo** permite conservar el acabado orgánico o quitarlo para mostrar un color liso. El recuadro de vista previa refleja el color y la textura seleccionados.
- Los instructivos también ofrecen **Fondo de las aclaraciones y la franja inferior** y **Fondo de los espacios de imágenes** en ese mismo panel. Este último se aplica también a los espacios que todavía no tienen una imagen cargada.

Guardar la sección para publicar los cambios. Cada bloque conserva su configuración de forma independiente. Los controles de colores de fondo se centralizan en el panel nuevo para no duplicar opciones dentro del mismo editor.

Se reutilizan los campos existentes `background_color`, `instruction_section_bg`, `instruction_card_bg`, `category_section_bg`, `category_card_bg`, `map_section_bg` y `map_card_bg`. Los nuevos valores `card_background_color` e `instruction_texture_enabled` se guardan en el JSON `settings` existente. Los bloques sin cambios conservan sus colores y textura actuales.

No requiere SQL ni nuevas variables de entorno. Revisión estática del diff; no se ejecutaron pruebas ni build.
