import Link from 'next/link'
import { LegalPage, legalMetadata } from '@/components/legal-page'
import { PrivacySettingsButton } from '@/components/privacy-controls'
import styles from '@/components/legal-page.module.css'

export const metadata = legalMetadata('Cookies y almacenamiento')

export default function CookiesPage() {
  const rows = [
    ['Preferencias de privacidad', 'Necesario', 'Elección, fecha y versión del aviso. Hasta 180 días.'],
    ['Lista de pedido', 'Funcional', 'Productos, cantidades y notas. Hasta vaciarla, eliminar elementos o borrar el almacenamiento.'],
    ['Consulta de precios', 'Funcional', 'Productos seleccionados. Hasta vaciarla o borrar el almacenamiento.'],
    ['Acceso a la cuenta', 'Funcional', 'Datos locales de la sesión de cliente. Hasta cerrar sesión o borrar el almacenamiento.'],
    ['Estadísticas', 'Opcional', 'Identificador del navegador, sesión, última actividad, origen y dispositivo. Solo mientras esté autorizado; se borra localmente al retirar el permiso o al detectar que venció.'],
    ['Avisos ya mostrados', 'Funcional', 'Evita repetir avisos configurados una vez por pestaña. Almacenamiento de sesión.'],
  ]
  return <LegalPage title="Cookies y almacenamiento" introduction="Qué información recuerda el sitio en tu navegador y cómo elegir las funciones opcionales.">
    <h2>1. Cookies y otras tecnologías</h2><p>Una cookie es un dato que un sitio puede guardar en el navegador. Esta web también utiliza almacenamiento local y de sesión: aunque no sean cookies, permiten recordar información y por eso los explicamos en esta página.</p>
    <h2>2. Tu elección</h2><p>El almacenamiento necesario para recordar la elección y las funciones que solicitás se mantiene separado de las estadísticas y mapas externos. Las opciones de estadísticas y mapas están apagadas hasta que las permitas. Podés rechazar las opciones y seguir usando el catálogo.</p><PrivacySettingsButton className={styles.preferences} />
    <p>La elección queda documentada en este navegador con su fecha y versión, hasta 180 días. Cuando vence, cambia la versión del aviso o se borra el almacenamiento, el sitio vuelve a solicitarla. Si el navegador impide guardar preferencias, la elección puede durar solo mientras permanezca abierta la página.</p>
    <h2>3. Almacenamiento utilizado</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Uso</th><th>Tipo</th><th>Contenido y duración</th></tr></thead><tbody>{rows.map(row => <tr key={row[0]}>{row.map((cell,index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>
    <h2>4. Estadísticas opcionales</h2><p>Si las aceptás se registran acciones como visitas, búsquedas, aperturas de productos y uso de las listas y enlaces de WhatsApp. El negocio utiliza los informes internamente para conocer qué productos interesan, identificar búsquedas sin resultados y mejorar la experiencia de navegación. No se utilizan para publicidad personalizada.</p><p>Las sesiones se renuevan tras 30 minutos sin eventos. Los conteos son aproximados: un navegador no equivale a una persona, y los bloqueadores o la falta de conexión pueden reducir el registro. El panel no recopila automáticamente errores técnicos.</p><p>El sitio respeta las señales Do Not Track y Global Privacy Control: cuando las detecta no activa las estadísticas, incluso si se selecciona esa opción.</p>
    <h2>5. Mapas y sitios externos</h2><p>El mapa integrado de Google no se carga mientras no permitas mapas externos. Al permitirlo se establece una conexión con Google, que puede procesar información técnica y utilizar tecnologías propias conforme a sus políticas.</p><p>Los enlaces externos a Google Maps o WhatsApp se abren cuando los pulsás. Las preferencias de este sitio no controlan lo que sucede al navegar en esos otros servicios.</p>
    <h2>6. Cambiar o retirar permisos</h2><p>Usá «Configurar privacidad» en el footer o el botón de esta página. Al desactivar estadísticas se cancelan los eventos pendientes de envío, se detienen nuevos registros y se borra el identificador local. Las solicitudes que ya hubieran sido recibidas por el servidor pueden haberse registrado previamente.</p><p>También podés borrar datos desde las opciones del navegador. Eso puede vaciar tus listas, cerrar el acceso local y eliminar tu elección de privacidad. Más información sobre datos guardados en servidores y derechos en la <Link href="/privacidad">política de privacidad</Link>.</p>
  </LegalPage>
}
