# Tipografía del botón del hero

Antes de publicar el código, ejecutar en el editor SQL de Supabase el contenido completo de `supabase/migrations/202610290001_hero_cta_typography.sql`. Agrega dos columnas opcionales a `hero_slides`, sin modificar los valores existentes, y recarga el esquema de la API.

En Edición web → Hero → Editar, el apartado **Tipografía del botón** permite seleccionar fuente y grosor por separado de la descripción. Incluye las fuentes integradas y las de la biblioteca personalizada, además de una vista previa.

Ambas opciones pueden heredar la descripción. Los heroes anteriores mantienen ese comportamiento hasta elegir un estilo propio. Las opciones se guardan por hero y se aplican tanto al botón situado bajo el texto como al fijado a una distancia del borde inferior, en todos los dispositivos.

Verificación manual sugerida tras publicar: cambiar solo la fuente y el grosor del botón, guardar, recargar el editor y la landing, y revisar ambos modos de colocación. Confirmar también que un hero con herencia sigue los cambios de su descripción.

Esta entrega no ejecuta SQL remoto, pruebas, build ni comprobaciones de tipos; incluye revisión estática del diff.
