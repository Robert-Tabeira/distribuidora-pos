import { LegalPage, LegalResponsibleDetails, legalMetadata } from '@/components/legal-page'
import { LEGAL_DETAILS } from '@/lib/legal-details'
import { PrivacySettingsButton } from '@/components/privacy-controls'
import styles from '@/components/legal-page.module.css'

export const metadata = legalMetadata('Política de privacidad')

export default function PrivacyPage() {
  return <LegalPage title="Política de privacidad" introduction="Cómo usamos la información para guardar tus listas y atender consultas y pedidos.">
    <h2>1. Identificación y contacto</h2>
    <LegalResponsibleDetails />
    <h2>2. Datos y finalidades</h2>
    <ul>
      <li><strong>Cuenta:</strong> nombre, comercio, teléfono, datos de acceso y correo opcional, para gestionar el acceso, asociarte listas guardadas y atender consultas y pedidos. El correo también permite recuperar el acceso.</li>
      <li><strong>Listas:</strong> productos, cantidades y notas que elegís guardar o comunicar al negocio por WhatsApp.</li>
    </ul>
    <p>Los datos requeridos permiten gestionar la cuenta y los pedidos; sin ellos puede no ser posible utilizar esas funciones. El catálogo público sigue disponible. La web no procesa pagos ni emite facturas y no pide datos de tarjeta ni credenciales bancarias.</p>
    <p>La función de estadísticas internas de navegación está deshabilitada.</p>
    <h2 id="cookies">3. Cookies, almacenamiento y preferencias</h2>
    <p>Usamos almacenamiento del navegador para las listas, el acceso a tu cuenta y tus preferencias. Las listas locales permanecen hasta vaciarlas o borrar ese almacenamiento; el acceso local, hasta cerrar sesión o borrarlo. Los avisos configurados para mostrarse una vez por pestaña se recuerdan durante esa sesión.</p>
    <p>El mapa integrado de Google es opcional. Podés permitirlo, mantenerlo apagado o cambiar tu elección desde «Configurar privacidad», sin perder el acceso al catálogo, la cuenta o las listas.</p>
    <p>La elección se recuerda hasta 180 días en este navegador. Al retirar el permiso se cierra el mapa integrado. Borrar el almacenamiento puede vaciar listas y cerrar el acceso local.</p>
    <PrivacySettingsButton className={styles.preferences} />
    <h2>4. Servicios que intervienen</h2>
    <p>La información puede ser tratada por el personal autorizado del negocio y los servicios de alojamiento, almacenamiento y correo necesarios para estas funciones. Estos servicios pueden procesar datos técnicos de conexión. WhatsApp recibe la información que decidís comunicar; el mapa de Google se conecta con ese servicio si lo permitís. Los enlaces externos y esos servicios tienen sus propias políticas.</p>
    <p>Tratamiento fuera de Uruguay: {LEGAL_DETAILS.internationalTransfers || <span className={styles.pending}>información pendiente de confirmar por el negocio.</span>}</p>
    <h2>5. Conservación</h2>
    <p>Cuentas y listas guardadas en servidores: {LEGAL_DETAILS.retentionDetails || <span className={styles.pending}>plazos de conservación y eliminación pendientes de revisar por el negocio.</span>}</p>
    <h2>6. Derechos y consultas</h2>
    <p>Podés solicitar acceso, rectificación, actualización o supresión de tus datos mediante el contacto indicado al inicio, conforme a la Ley 18.331. También podés acudir a la <a href="https://www.gub.uy/unidad-reguladora-control-datos-personales/" target="_blank" rel="noopener noreferrer">Unidad Reguladora y de Control de Datos Personales</a>. La fecha de esta política figura al comienzo.</p>
  </LegalPage>
}
