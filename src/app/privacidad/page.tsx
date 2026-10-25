import { LegalPage, legalMetadata } from '@/components/legal-page'
import { LEGAL_DETAILS } from '@/lib/legal-details'
import { PrivacySettingsButton } from '@/components/privacy-controls'
import styles from '@/components/legal-page.module.css'

export const metadata = legalMetadata('Política de privacidad')

export default function PrivacyPage() {
  return <LegalPage title="Política de privacidad" introduction="Información sobre los datos utilizados en los servicios de Los Primos.">
    <p>Para utilizar las funciones de cuenta y listas guardadas de {LEGAL_DETAILS.tradingName}, nombre comercial de {LEGAL_DETAILS.legalName}, se solicitan nombre, comercio, teléfono y datos de acceso. El correo es opcional y permite recuperar el acceso. El catálogo y los pedidos para retirar en mostrador pueden utilizarse sin registro. Las listas guardadas en una cuenta están disponibles solamente para empresas aprobadas.</p>
    <p>Para pedidos sin registro se solicita un nombre para identificar el retiro. Se incluye en el mensaje de WhatsApp y no crea una cuenta; la web lo mantiene únicamente en memoria mientras permanece abierta esta página.</p>
    <p>El tratamiento de los datos personales está sujeto a la Ley Nº 18.331 de la República Oriental del Uruguay y sus decretos reglamentarios, incluidas las obligaciones de seguridad y confidencialidad de la información.</p>
    <h2>Finalidad del tratamiento de los datos</h2>
    <p>La información se utiliza para las siguientes finalidades:</p>
    <ul>
      <li>Gestionar el acceso a la cuenta y guardar las listas de productos, cantidades y notas de cada usuario.</li>
      <li>Atender consultas de precios y solicitudes de pedido comunicadas por WhatsApp.</li>
      <li>Facilitar el funcionamiento del servicio de pedidos y la atención en el local.</li>
    </ul>
    <p>Los precios definitivos, la facturación y los cobros se gestionan directamente con el negocio fuera de esta web.</p>
    <p>La información puede ser tratada por el personal autorizado y los servicios de alojamiento, almacenamiento y correo que dan soporte a estas funciones. El alojamiento técnico puede realizarse fuera de Uruguay. WhatsApp recibe la información que decidís comunicar mediante ese servicio.</p>
    {LEGAL_DETAILS.internationalTransfers && <p>{LEGAL_DETAILS.internationalTransfers}</p>}
    {LEGAL_DETAILS.retentionDetails && <p>{LEGAL_DETAILS.retentionDetails}</p>}
    <h2>Contacto y derechos</h2>
    <p>Podés solicitar acceso, rectificación, actualización o supresión de tus datos mediante el contacto de privacidad: {LEGAL_DETAILS.privacyContactHref ? <a href={LEGAL_DETAILS.privacyContactHref}>{LEGAL_DETAILS.privacyContact}</a> : LEGAL_DETAILS.privacyContact} Domicilio: {LEGAL_DETAILS.registeredAddress}.</p>
    <h2 id="cookies">Almacenamiento y preferencias</h2>
    <p>El navegador recuerda tus listas y el acceso hasta que los elimines o cierres sesión, según corresponda, y tus preferencias por hasta 180 días. Borrar el almacenamiento puede eliminar listas locales. El mapa integrado de Google se carga únicamente si lo permitís; podés cambiar esa elección desde «Configurar privacidad».</p>
    <PrivacySettingsButton className={styles.preferences} />
  </LegalPage>
}
