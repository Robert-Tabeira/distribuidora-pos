# Bloque «Cómo hacer pedidos en 3 pasos»

En **Edición web → Secciones → Bloques de Landing → Nuevo bloque**, seleccionar **Cómo hacer pedidos en 3 pasos**. Se completan el nombre, título y descripción si están vacíos, y se cargan tres pasos iniciales:

1. Elegir productos y su presentación, y agregarlos al pedido.
2. Revisar «Mi pedido» y ajustar cantidades.
3. Enviar por WhatsApp y coordinar con el local. Sin registro, se pide un nombre y el retiro es únicamente en mostrador.

La franja inferior aclara el retiro sin registro, las listas guardadas para empresas aprobadas y la confirmación de precios y disponibilidad con el negocio. El botón lleva al catálogo.

## Retiro y envíos

Debajo de los tres pasos se muestra un inciso **Envíos exclusivos para empresas o negocios**. Indica que los envíos son únicamente para empresas o negocios con cuenta aprobada y que sin registro solo se retira en mostrador. Invita a consultar por WhatsApp la zona, disponibilidad, costos y plazos; no promete entregas ni establece condiciones de reparto sin confirmarlas con el local.

En el editor del bloque, **Aclaración sobre retiros y envíos** permite cambiar título, texto y visibilidad. Usa los colores de la franja inferior y las tipografías del bloque. El aviso predeterminado también aparece en bloques de pedidos ya guardados que todavía no tienen estos campos; los pasos, imágenes y otros textos personalizados se conservan. No requiere SQL ni volver a crear la sección.

Se pueden editar textos, imágenes de escritorio y móvil, colores, fondos, números, tipografías, pesos y enlace. El bloque reutiliza el diseño adaptable de las instrucciones de consulta de precios y guarda su configuración por separado. Las imágenes se muestran completas, sin recortarlas, y usan la optimización existente.

Guardar el bloque con **Visible** activado para publicarlo. Se puede reordenar, ocultar y volver a editar desde el listado. Crear este bloque no reemplaza la guía de consulta de precios.

No requiere SQL adicional: utiliza las columnas existentes `block_type` (texto) y `settings` (JSON) de `landing_sections`. No crea contenido remoto automáticamente ni cambia la configuración de pedidos del catálogo; esa función debe estar activada para usar «Agregar al pedido».
