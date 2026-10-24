import Link from 'next/link'
import { LegalPage, LegalResponsibleDetails, legalMetadata } from '@/components/legal-page'
import { LEGAL_DETAILS } from '@/lib/legal-details'
import { PrivacySettingsButton } from '@/components/privacy-controls'
import styles from '@/components/legal-page.module.css'

export const metadata = legalMetadata('Política de privacidad')

export default function PrivacyPage() {
  return <LegalPage title="Política de privacidad" introduction="Usamos la información para mejorar el catálogo y la navegación, guardar tus listas y gestionar tus consultas y pedidos. Acá explicamos qué datos intervienen y qué podés elegir.">
    <p>La web permite preparar listas de pedido y consultas de precios para enviarlas por WhatsApp. La cotización definitiva, la facturación y los cobros se gestionan directamente con el negocio fuera de esta web. Para utilizar estas funciones no te pedimos datos de tarjeta ni credenciales bancarias.</p>
    <h2>1. Responsable del sitio y de los datos</h2><LegalResponsibleDetails />
    <h2>2. Información que se utiliza</h2>
    <ul>
      <li><strong>Navegación y estadísticas opcionales:</strong> páginas visitadas, productos abiertos, términos de búsqueda, filtros de categorías, acciones de agregar a las listas y clics hacia WhatsApp. Si aceptás las estadísticas se genera un identificador del navegador y una sesión de navegación.</li>
      <li><strong>Cuenta de comercio, cuando está habilitada:</strong> nombre de la persona, nombre del comercio, teléfono, correo opcional, datos de acceso y estado de aprobación de la solicitud.</li>
      <li><strong>Listas y pedidos:</strong> productos, cantidades, presentaciones y notas que ingresás. Las listas pueden permanecer en tu navegador o guardarse en tu cuenta si utilizás esa función.</li>
      <li><strong>Infraestructura:</strong> los proveedores de alojamiento, base de datos y servicios externos pueden procesar información técnica de las conexiones para prestar sus servicios.</li>
    </ul>
    <p>El registro de estadísticas de la aplicación no incluye nombres de clientes, teléfonos, correos ni el contenido de mensajes o notas de compra. Se aplican filtros para omitir búsquedas con apariencia de teléfono, correo o URL. No ingreses datos personales o sensibles en el buscador.</p>
    <h2>3. Finalidades y elección</h2>
    <h3>Estadísticas para mejorar la experiencia</h3>
    <p>Las estadísticas son de uso interno del negocio. Permiten saber qué productos y categorías generan más interés, qué busca la gente, qué búsquedas no encuentran resultados y cómo se utilizan las listas y los accesos a WhatsApp. Con esa información buscamos mejorar el catálogo, detectar dificultades de navegación y facilitar el uso de la página.</p>
    <p>Estas estadísticas son opcionales y solo se activan si las aceptás. No se utilizan para publicidad personalizada. Rechazarlas no impide navegar, crear una cuenta ni consultar o pedir productos. El panel actual registra las acciones indicadas; no recopila automáticamente errores técnicos ni grabaciones de pantalla.</p>
    <p>Los identificadores de estadísticas permiten vincular acciones de un mismo navegador. Por ese motivo no describimos este registro como completamente anónimo, aunque los informes internos muestren datos agregados.</p>
    <PrivacySettingsButton className={styles.preferences} />
    <h3>Cuenta, listas guardadas y gestión de pedidos</h3>
    <p>Los datos de la cuenta permiten gestionar el acceso de cada usuario y asociarle sus listas de pedido guardadas para que pueda recuperarlas y volver a utilizarlas. Los productos, cantidades, presentaciones y notas se utilizan para organizar las listas, atender consultas y gestionar correctamente los pedidos que comuniques al negocio.</p>
    <p>El nombre y los datos de contacto se utilizan para identificar la cuenta y comunicarnos sobre solicitudes y pedidos. El correo es opcional y, si lo proporcionás, también permite recuperar el acceso. No usamos los datos de la cuenta ni el contenido de las listas para publicidad personalizada ni como contenido de las estadísticas de navegación.</p>
    <p>Los datos obligatorios y opcionales se indican en los formularios. Sin los datos requeridos puede no ser posible crear una cuenta o tramitar una solicitud; el catálogo público sigue disponible. El uso de la cuenta y las listas no requiere aceptar las estadísticas opcionales.</p>
    <h2>4. Quiénes pueden tratar la información</h2>
    <ul>
      <li><strong>El negocio:</strong> las personas autorizadas para gestionar cuentas, consultas y pedidos, y consultar los informes internos de uso.</li>
      <li><strong>Servicios de alojamiento y almacenamiento:</strong> permiten que la web funcione y que se guarden cuentas, listas, archivos y estadísticas autorizadas.</li>
      <li><strong>Servicios de correo:</strong> permiten enviar mensajes de recuperación de acceso cuando utilizás esa función.</li>
      <li><strong>Mensajería que elegís utilizar:</strong> al abrir WhatsApp, el enlace puede incluir tu lista y, según la función, nombre del comercio y notas. Podés revisar el texto antes de enviarlo. El servicio aplica sus propias condiciones; abrirlo no confirma el envío ni una compra.</li>
      <li><strong>Mapas externos:</strong> el mapa integrado de Google se carga solo si lo permitís. También podés abrir por decisión propia un enlace externo para ver la ubicación.</li>
    </ul>
    <p>La información se utiliza para los fines descritos y los servicios necesarios para prestarlos. Información sobre el tratamiento de datos fuera de Uruguay: {LEGAL_DETAILS.internationalTransfers || <strong className={styles.pending}>pendiente de confirmar por el responsable antes de cerrar esta política.</strong>}</p>
    <h2>5. Conservación</h2>
    <p>La preferencia de privacidad se recuerda hasta 180 días en este navegador. Las listas y el acceso local permanecen según lo indicado en la <Link href="/cookies">información de almacenamiento</Link>.</p>
    <p>Plazos de conservación y eliminación de cuentas, listas guardadas y estadísticas: {LEGAL_DETAILS.retentionDetails || <strong className={styles.pending}>pendientes de definir y aplicar por el responsable antes de cerrar esta política.</strong>}</p>
    <h2>6. Tus derechos y consultas</h2>
    <p>Podés solicitar acceso, rectificación, actualización o supresión de tus datos, y consultar el uso que se hace de ellos, conforme a la normativa aplicable. Utilizá el contacto de privacidad indicado al inicio. Para tramitar la solicitud puede ser necesario verificar de manera proporcionada tu identidad.</p>
    <p>Podés retirar el permiso para estadísticas o mapas desde «Configurar privacidad». Se detendrá la recopilación futura de estadísticas y se eliminará el identificador local de métricas; retirar el permiso no borra automáticamente los datos que ya se hubieran registrado. Para consultar su supresión, contactá al responsable.</p>
    <p>También podés consultar o acudir a la <a href="https://www.gub.uy/unidad-reguladora-control-datos-personales/" target="_blank" rel="noopener noreferrer">Unidad Reguladora y de Control de Datos Personales de Uruguay</a>.</p>
    <h2>7. Actualizaciones</h2><p>La fecha de versión se informa al comienzo. Si cambian las finalidades o los permisos opcionales, se actualizarán los textos y se solicitará una nueva elección cuando corresponda.</p>
  </LegalPage>
}
