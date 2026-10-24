import { LegalPage, LegalResponsibleDetails, legalMetadata } from '@/components/legal-page'
import { LEGAL_DETAILS } from '@/lib/legal-details'
import { PrivacySettingsButton } from '@/components/privacy-controls'
import styles from '@/components/legal-page.module.css'

export const metadata = legalMetadata('Política de privacidad')

export default function PrivacyPage() {
  return <LegalPage title="Política de privacidad" introduction="Cómo usamos la información para guardar tus listas, atender consultas y pedidos, y mejorar el catálogo.">
    <h2>1. Identificación y contacto</h2>
    <LegalResponsibleDetails />
    <h2>2. Datos y finalidades</h2>
    <ul>
      <li><strong>Cuenta:</strong> nombre, comercio, teléfono, datos de acceso y correo opcional, para gestionar el acceso, asociarte listas guardadas y atender consultas y pedidos. El correo también permite recuperar el acceso.</li>
      <li><strong>Listas:</strong> productos, cantidades y notas que elegís guardar o comunicar al negocio por WhatsApp.</li>
      <li><strong>Estadísticas opcionales:</strong> visitas, búsquedas, productos y categorías consultados, acciones en listas y clics hacia WhatsApp. Incluyen un identificador del navegador y sesión, origen y tipo de dispositivo, para conocer el interés por los productos y mejorar la navegación.</li>
    </ul>
    <p>Los datos requeridos permiten gestionar la cuenta y los pedidos; sin ellos puede no ser posible utilizar esas funciones. El catálogo público sigue disponible. La web no procesa pagos ni emite facturas y no pide datos de tarjeta ni credenciales bancarias.</p>
    <p>Las estadísticas son de uso interno, se activan con tu permiso y no se utilizan para publicidad personalizada. No incluyen datos identificativos de la cuenta ni notas de pedido. No ingreses datos personales en el buscador. El identificador permite relacionar acciones de un mismo navegador; el registro no es completamente anónimo.</p>
    <h2 id="cookies">3. Cookies, almacenamiento y preferencias</h2>
    <p>Usamos almacenamiento del navegador para las listas, el acceso a tu cuenta y tus preferencias. Las listas locales permanecen hasta vaciarlas o borrar ese almacenamiento; el acceso local, hasta cerrar sesión o borrarlo. Los avisos configurados para mostrarse una vez por pestaña se recuerdan durante esa sesión.</p>
    <p>Las estadísticas y los mapas integrados de Google son opcionales. Podés aceptarlos por separado, rechazarlos o cambiar tu elección desde «Configurar privacidad», sin perder el acceso al catálogo, la cuenta o las listas.</p>
    <p>La elección se recuerda hasta 180 días en este navegador. Al retirar las estadísticas se detienen nuevos registros y se borra su identificador local; esto no elimina automáticamente eventos ya recibidos. Al retirar mapas se cierra el mapa integrado. Borrar el almacenamiento puede vaciar listas y cerrar el acceso local.</p>
    <PrivacySettingsButton className={styles.preferences} />
    <h2>4. Servicios que intervienen</h2>
    <p>La información puede ser tratada por el personal autorizado del negocio y los servicios de alojamiento, almacenamiento y correo necesarios para estas funciones. Estos servicios pueden procesar datos técnicos de conexión. WhatsApp recibe la información que decidís comunicar; el mapa de Google se conecta con ese servicio si lo permitís. Los enlaces externos y esos servicios tienen sus propias políticas.</p>
    <p>Tratamiento fuera de Uruguay: {LEGAL_DETAILS.internationalTransfers || <span className={styles.pending}>información pendiente de confirmar por el negocio.</span>}</p>
    <h2>5. Conservación</h2>
    <p>Cuentas, listas guardadas y estadísticas en servidores: {LEGAL_DETAILS.retentionDetails || <span className={styles.pending}>plazos de conservación y eliminación pendientes de revisar por el negocio.</span>}</p>
    <h2>6. Derechos y consultas</h2>
    <p>Podés solicitar acceso, rectificación, actualización o supresión de tus datos mediante el contacto indicado al inicio, conforme a la Ley 18.331. También podés acudir a la <a href="https://www.gub.uy/unidad-reguladora-control-datos-personales/" target="_blank" rel="noopener noreferrer">Unidad Reguladora y de Control de Datos Personales</a>. La fecha de esta política figura al comienzo.</p>
  </LegalPage>
}
