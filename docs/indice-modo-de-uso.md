# Índice «Modo de uso» en el header

El menú público muestra **Modo de uso** cuando existe al menos un instructivo visible en la landing. En computadora aparece junto a los enlaces del header; en móvil, dentro del menú hamburguesa, como un desplegable.

- Incluye los bloques de consulta de precios, pedidos, retiro en mostrador y listas guardadas que estén creados y visibles.
- De forma predeterminada toma sus títulos y orden desde **Edición web → Bloques de Landing**. Ocultar un bloque también lo excluye del índice al volver a cargar la página.
- Cada destino usa `/landing#instructivo-ID`, basado en el identificador del bloque. Cambiar su título u orden conserva el enlace; eliminarlo y crear otro genera un identificador nuevo.
- Funciona desde la landing y desde otras páginas públicas. Al abrir una URL con ese fragmento, la landing espera a que las secciones estén disponibles y desplaza la vista al instructivo. El destino recibe foco y tiene margen superior para el header fijo.
- Se abre por clic o toque y admite teclado. Se cierra con Escape, al pulsar afuera, al salir con Tab o al elegir un destino. En móvil, elegir un enlace también cierra el menú principal.
- De forma predeterminada, el botón de escritorio utiliza la tipografía, peso, mayúsculas y color de los enlaces del header, incluyendo su estado transparente. El panel y la versión móvil utilizan los colores personalizados del menú móvil. Los controles propios permiten cambiar estos valores para el índice.
- Los instructivos conservan su diseño individual y sus imágenes ampliables. No se agrupan ni se copian sus contenidos.

El header consulta únicamente identificador, título, nombre interno y tipo de los instructivos visibles. Esta consulta se inicia por separado para no demorar el logo y los demás enlaces. No descarga imágenes ni contenidos completos para construir el índice. Si no hay instructivos visibles, no muestra un desplegable vacío.

## Editor del índice

En **Edición web → Header y menú → Modo de uso**, podés:

- Mostrar u ocultar el índice en escritorio y móvil.
- Cambiar el nombre del botón y el título interno del panel; el título interno puede quedar vacío.
- Elegir el icono del botón y si se muestra, y activar u ocultar los iconos de los enlaces.
- Seleccionar tipografía y grosor del botón y de los enlaces por separado, con las fuentes propias y personalizadas existentes.
- Heredar las mayúsculas del menú o elegirlas para este botón.
- Incluir automáticamente todos los instructivos visibles, o seleccionar y ordenar manualmente. Mover o seleccionar un enlace activa el modo manual. Nuevos instructivos se incluyen automáticamente solo en el modo automático.
- Cambiar el nombre y el icono de cada enlace sin modificar el título del bloque de la landing. Un nombre vacío utiliza el título original.
- Elegir colores del botón para header sólido, transparente y móvil; fondo, borde, título, enlaces y estados al pasar el cursor del panel. Cada color tiene «Volver a heredar».
- Abrir una vista previa del desplegable en escritorio sólido, sobre el hero y en móvil. Sus enlaces no navegan fuera del editor.

Publicá los cambios con **Guardar Estilo**, al final del editor del header. Si se desactiva el índice o no se eligen instructivos visibles, no se muestra un botón vacío.

La configuración se guarda dentro de `header_settings.mobile_menu_settings.usage_menu`, usando el JSON ya existente del menú móvil. El normalizador del menú conserva estos campos al cargar y guardar sus colores. Si la instalación aún no tiene `mobile_menu_settings`, se informa que falta la migración previa `202610210001_mobile_menu_colors.sql`; no se indica éxito para los ajustes del índice en ese caso.

No requiere una nueva migración SQL ni dependencias. No se ejecutaron pruebas, build ni comprobación de tipos; se revisó el diff estáticamente.
