# Índice «Modo de uso» en el header

El menú público muestra **Modo de uso** cuando existe al menos un instructivo visible en la landing. En computadora aparece junto a los enlaces del header; en móvil, dentro del menú hamburguesa, como un desplegable.

- Incluye los bloques de consulta de precios, pedidos, retiro en mostrador y listas guardadas que estén creados y visibles.
- Toma sus títulos y orden desde **Edición web → Bloques de Landing**. Ocultar un bloque también lo excluye del índice al volver a cargar la página.
- Cada destino usa `/landing#instructivo-ID`, basado en el identificador del bloque. Cambiar su título u orden conserva el enlace; eliminarlo y crear otro genera un identificador nuevo.
- Funciona desde la landing y desde otras páginas públicas. Al abrir una URL con ese fragmento, la landing espera a que las secciones estén disponibles y desplaza la vista al instructivo. El destino recibe foco y tiene margen superior para el header fijo.
- Se abre por clic o toque y admite teclado. Se cierra con Escape, al pulsar afuera, al salir con Tab o al elegir un destino. En móvil, elegir un enlace también cierra el menú principal.
- El botón de escritorio utiliza la tipografía, peso, mayúsculas y color de los enlaces del header, incluyendo su estado transparente. El panel y la versión móvil utilizan los colores personalizados del menú móvil para conservar contraste.
- Los instructivos conservan su diseño individual y sus imágenes ampliables. No se agrupan ni se copian sus contenidos.

El header consulta únicamente identificador, título, nombre interno y tipo de los instructivos visibles. Esta consulta se inicia por separado para no demorar el logo y los demás enlaces. No descarga imágenes ni contenidos completos para construir el índice. Si no hay instructivos visibles, no muestra un desplegable vacío.

No requiere SQL ni nuevas dependencias. No se ejecutaron pruebas, build ni comprobación de tipos; se revisó el diff estáticamente.
