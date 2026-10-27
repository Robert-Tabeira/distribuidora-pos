# Ubicación exacta desde la pestaña Info

En **Edición web → Header y menú → Pestaña Info → Enlace de Google Maps del local**, pegá el enlace que obtenés al abrir el local en Google Maps y elegir **Compartir → Copiar enlace**. Pulsá **Comprobar ubicación en Google Maps** para revisar el destino y después **Guardar Estilo**.

- La dirección sigue mostrando el texto de Datos del Negocio. Al pulsarla, se abre el enlace exacto configurado en una nueva pestaña o en la aplicación de mapas según el dispositivo.
- Se aplica a Info en computadora y a la dirección del menú móvil.
- Se admiten enlaces completos de Google Maps, sus dominios regionales y enlaces compartidos de `maps.app.goo.gl` o `goo.gl/maps`. Se conservan las coordenadas, identificadores y demás parámetros del enlace, sin buscar otra ubicación a partir del texto.
- Si el campo queda vacío, se mantiene la búsqueda por la dirección escrita del negocio. Un enlace inválido impide guardar y muestra un aviso.
- Este campo corresponde al enlace de Info. El mapa integrado y el botón de ubicación de la landing conservan su editor propio.

La configuración utiliza `header_settings.mobile_menu_settings.info_maps_url`, en el JSON existente del header, y el normalizador conserva también los colores y la configuración de Modo de uso. No requiere una nueva migración SQL ni dependencias. No se ejecutaron pruebas, build ni comprobación de tipos; revisión estática del diff.
