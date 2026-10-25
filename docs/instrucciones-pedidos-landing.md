# Bloque «Cómo hacer pedidos en 3 pasos»

En **Edición web → Secciones → Bloques de Landing → Nuevo bloque**, seleccionar **Cómo hacer pedidos en 3 pasos**. Se completan el nombre, título y descripción si están vacíos, y se cargan tres pasos iniciales:

1. Elegir productos y su presentación, y agregarlos al pedido.
2. Revisar «Mi pedido» y ajustar cantidades.
3. Enviar por WhatsApp y coordinar con el local. Sin registro, se pide un nombre y el retiro es únicamente en mostrador.

La franja inferior aclara el retiro sin registro, las listas guardadas para empresas aprobadas y la confirmación de precios y disponibilidad con el negocio. El botón lleva al catálogo.

Se pueden editar textos, imágenes de escritorio y móvil, colores, fondos, números, tipografías, pesos y enlace. El bloque reutiliza el diseño adaptable de las instrucciones de consulta de precios y guarda su configuración por separado. Las imágenes se muestran completas, sin recortarlas, y usan la optimización existente.

Guardar el bloque con **Visible** activado para publicarlo. Se puede reordenar, ocultar y volver a editar desde el listado. Crear este bloque no reemplaza la guía de consulta de precios.

No requiere SQL adicional: utiliza las columnas existentes `block_type` (texto) y `settings` (JSON) de `landing_sections`. No crea contenido remoto automáticamente ni cambia la configuración de pedidos del catálogo; esa función debe estar activada para usar «Agregar al pedido».
