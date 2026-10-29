# Acceso interno para el personal desde cualquier lugar

## Publicación

1. Comprobar en el entorno de servidor/Vercel que estén configurados `NEXT_PUBLIC_SUPABASE_URL` y **`SUPABASE_SERVICE_ROLE_KEY`**. Esta última es privada, no debe tener prefijo `NEXT_PUBLIC_` ni compartirse en el navegador. Ya es la variable utilizada por el guardado privado de listas de clientes.
2. Publicar el código y entrar a `/login` con el empleado y PIN habituales. Las sesiones viejas guardadas únicamente en el navegador ya no dan acceso.
3. Aplicar **todo** `supabase/migrations/202610280001_private_staff_access.sql` en el SQL Editor de Supabase. Este paso es necesario para cerrar los permisos directos sobre empleados y sus credenciales. El código nuevo ya utiliza las rutas privadas del servidor; las versiones anteriores de la aplicación dejarán de poder crear o editar empleados o verificar PIN directamente al aplicar este SQL.

No se ejecutó SQL remoto, no se configuraron secretos ni se publicaron cambios desde esta conversación. El despliegue completo requiere tanto código como SQL. Si la clave privada falta, la aplicación deniega las rutas internas con un aviso de configuración; no vuelve al acceso anterior.

`STAFF_SESSION_SECRET` es opcional. Si se configura, debe tener al menos 32 caracteres aleatorios y distintos de claves públicas; separa la firma de sesiones del servicio de Supabase. Sin esa variable se utiliza la clave privada del servidor, con un identificador de firma exclusivo para sesiones del personal. Cambiar el secreto invalida las sesiones anteriores. No se proporciona ni se publica un valor de ejemplo reutilizable.

## Funcionamiento

- `/login` sigue siendo la entrada del personal desde cualquier conexión. Conserva la selección de empleado y el PIN de cuatro dígitos. El PIN se verifica con el procedimiento existente `verify_pin_secure`, incluyendo sus intentos y bloqueo; esta actualización no cambia la credencial por una contraseña.
- Tras verificar el PIN, el servidor consulta el empleado y crea una cookie firmada HMAC, `HttpOnly`, `SameSite=Lax`, `Secure` en producción y con vencimiento absoluto de 12 horas. No guarda el PIN ni su hash en la cookie ni los devuelve al cliente.
- Middleware y layouts del servidor validan la sesión y consultan el empleado actual antes de servir el área. La autorización no utiliza el rol que alguien escriba en `localStorage`. Cambiar el PIN o rol, o eliminar al empleado, invalida la sesión al comprobarla otra vez.
- La copia local del perfil existe por compatibilidad con las pantallas actuales: el servidor la sincroniza antes de montarlas. La sesión se vuelve a comprobar al navegar, volver a la pestaña y cada minuto mientras está visible.
- Cerrar sesión borra la cookie del navegador mediante el servidor y recarga el login. Si falla la conexión al cerrar, se muestra el error. Las cookies firmadas son stateless: una copia extraída fuera del navegador no se revoca individualmente por cerrar sesión; vence a las 12 horas y se invalida también al cambiar PIN, rol o secreto.
- Sin acceso, las rutas internas redirigen a `/login`; un rol sin permiso vuelve a su propia pantalla inicial. Si la base de datos no permite verificar la sesión, se deniega la petición con un aviso temporal.
- El login, las áreas privadas y sus API de acceso usan `noindex`. Las respuestas internas no se almacenan en cachés compartidas. No se agregan estas URLs a ningún sitemap.
- Landing, catálogo, páginas legales y `/cliente/*` mantienen sus flujos públicos. No se reactivan estadísticas.

## Permisos por rol

| Área | Administrador | Mostrador | Caja |
| --- | --- | --- | --- |
| `/admin` y sus subsecciones | Sí | No | No |
| Productos e imágenes, empleados, descuentos, ubicaciones | Sí | No | No |
| Mostrador, precios y reposición | Sí | Sí | No |
| Caja e historial | Sí | No | Sí |

El mapa está definido en `src/lib/staff-access-policy.ts`. Protege también las rutas hijas. Los endpoints de gestión de empleados vuelven a comprobar la sesión y el rol de administrador antes de cada operación.

## Empleados y SQL

El SQL revoca a `public`, `anon` y `authenticated` las escrituras y el acceso a credenciales de `employees`. Solo deja leer identificador, nombre, rol y fecha de creación, necesarios para el selector existente de empleados y los nombres de caja/historial. También restringe las funciones de PIN conocidas al servidor. No publica hashes ni agrega nuevas cuentas.

Crear, editar y borrar empleados se realiza mediante `/api/staff-employees`, con sesión y validación de origen. El servidor genera el hash usando la función existente. Se impide borrar la cuenta propia o quitarse el acceso de administrador; un trigger conserva al último administrador. Cambiar el PIN propio pide volver a iniciar sesión.

## Alcance y límites

Esta entrega protege las **páginas internas y la gestión de credenciales de empleados**. Los restantes flujos internos siguen utilizando el cliente Supabase existente; el control completo de lecturas/escrituras de productos, pedidos, configuración, clientes y Storage requiere revisar sus permisos y RLS en el proyecto remoto. Proteger una página no reemplaza esas políticas. Esta entrega no afirma que todas esas tablas ya tengan controles adecuados ni modifica sus políticas sin esa revisión.

El login conserva un PIN corto y perfiles visibles como en el sistema existente; no es una renovación de contraseñas ni incorpora MFA. Su limitación de intentos depende del procedimiento de bloqueo ya instalado en Supabase.

No se ejecutaron pruebas, build, comprobación de tipos ni migraciones remotas. Se revisó el diff estáticamente.
