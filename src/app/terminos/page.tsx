import Link from 'next/link'
import { LegalPage, LegalResponsibleDetails, legalMetadata } from '@/components/legal-page'

export const metadata = legalMetadata('Términos de uso')

export default function TermsPage() {
  return <LegalPage title="Términos de uso" introduction="La web permite explorar el catálogo, preparar listas de pedido y consultar precios por WhatsApp.">
    <h2>1. El negocio</h2>
    <LegalResponsibleDetails />
    <h2>2. Catálogo y listas</h2>
    <p>Podés buscar productos y preparar listas para comunicar pedidos o consultar precios. Antes de enviarlas, revisá los productos, cantidades y notas. El botón de WhatsApp abre un texto que podés revisar y enviar desde ese servicio; abrirlo no confirma el envío ni una compra.</p>
    <p>Los precios definitivos, disponibilidad, confirmación del pedido y entrega o retiro se coordinan directamente con el negocio. La facturación y los cobros se gestionan fuera de esta web, que no emite facturas ni procesa pagos.</p>
    <h2>3. Cuenta y listas guardadas</h2>
    <p>Cuando el registro está habilitado, el acceso como comercio requiere aprobación del negocio. Proporcioná datos correctos y cuidá tu código de acceso. Las listas se guardan en el navegador o en tu cuenta, según la función que utilices; borrar el almacenamiento local puede eliminar las listas que solo estén en ese navegador.</p>
    <h2>4. Uso y consultas</h2>
    <p>Utilizá el sitio sin alterar su funcionamiento ni acceder a información ajena. Si encontrás un error o necesitás ayuda con un pedido, comunicate con el negocio por los canales publicados.</p>
    <p>El uso de datos y el almacenamiento se explican en la <Link href="/privacidad">política de privacidad</Link>. Estos términos no limitan los derechos que correspondan conforme a la normativa aplicable.</p>
  </LegalPage>
}
