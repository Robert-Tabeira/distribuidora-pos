import Link from 'next/link'
import { LegalPage, legalMetadata } from '@/components/legal-page'
import { LEGAL_DETAILS } from '@/lib/legal-details'

export const metadata = legalMetadata('Términos y condiciones de uso')

export default function TermsPage() {
  return <LegalPage title="Términos y condiciones de uso" introduction="Condiciones aplicables al catálogo, las cuentas y la preparación de listas de pedidos y consultas por WhatsApp.">
    <p>Estos términos regulan el uso de las funciones del sitio de {LEGAL_DETAILS.tradingName}, nombre comercial de {LEGAL_DETAILS.legalName}. La web facilita la consulta de productos y la comunicación con el negocio; la facturación y los cobros se gestionan fuera de este sitio.</p>
    <h2>1. Uso del servicio</h2>
    <p>El catálogo público puede consultarse sin registrarse. Quien utilice una cuenta o envíe solicitudes en nombre de un comercio debe estar autorizado para hacerlo. El sitio debe utilizarse sin alterar su funcionamiento ni intentar acceder a información ajena.</p>
    <h2>2. Registro y cuenta</h2>
    <p>Cuando el registro está habilitado, se deben completar los datos requeridos con información correcta. El correo es opcional. El acceso como comercio queda sujeto a revisión y aprobación del negocio. Cada usuario debe cuidar su código de acceso y comunicar cualquier uso no autorizado que detecte.</p>
    <h2>3. Listas y consultas por WhatsApp</h2>
    <p>Las listas permiten reunir productos, cantidades y notas para preparar un pedido o consultar precios. Pueden guardarse en el navegador o en la cuenta, según la función utilizada. Borrar el almacenamiento del navegador puede eliminar las listas guardadas únicamente allí.</p>
    <p>El botón de WhatsApp abre un texto preparado que el usuario puede revisar y enviar desde ese servicio. Guardar una lista o abrir WhatsApp no confirma por sí solo el envío del mensaje, una compra ni una reserva de mercadería.</p>
    <h2>4. Confirmación de pedidos y precios</h2>
    <p>Antes de enviar una solicitud, se deben revisar los productos, cantidades, unidades y notas. Los precios definitivos, las presentaciones, la disponibilidad y las condiciones del pedido se confirman directamente con el negocio por sus canales de atención. La web no procesa pagos ni emite facturas.</p>
    <h2>5. Entrega, retiro y atención posterior</h2>
    <p>Las condiciones de entrega o retiro, los plazos y los costos que correspondan se coordinan con el negocio antes de confirmar la operación. Las consultas sobre pedidos, cambios o reclamos se atienden por los canales publicados, respetando los derechos que correspondan.</p>
    <h2>6. Datos personales</h2>
    <p>Los datos de cuenta y las listas se utilizan para gestionar el acceso, guardar los productos seleccionados y atender consultas y pedidos. Su tratamiento, el almacenamiento y el ejercicio de derechos se explican en la <Link href="/privacidad">política de privacidad</Link>.</p>
    <h2>7. Contenidos y funcionamiento</h2>
    <p>Los derechos sobre los textos, imágenes, marcas y demás contenidos corresponden a sus respectivos titulares. Su utilización debe respetar la normativa aplicable. El sitio puede tener actualizaciones o interrupciones; ante una dificultad, el usuario puede comunicarse con el negocio.</p>
    <h2>8. Legislación y actualizaciones</h2>
    <p>El uso del sitio se rige por la normativa de la República Oriental del Uruguay. La fecha de versión figura al comienzo del documento. Las actualizaciones de estos términos no modifican por sí solas las condiciones ya acordadas para un pedido ni limitan los derechos que correspondan conforme a la normativa aplicable.</p>
    <h2>9. Domicilio y contacto</h2>
    <p>El domicilio de {LEGAL_DETAILS.legalName} es {LEGAL_DETAILS.registeredAddress}. Para consultas sobre el servicio o estas condiciones, se puede acudir al local o utilizar los canales de atención publicados en el sitio.</p>
  </LegalPage>
}
