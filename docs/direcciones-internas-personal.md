# Direcciones internas con identificador aleatorio

## Entrada del personal

Después de publicar, la dirección de entrada es:

```text
/acceso/9a87a1b3ee06514e995bd3d1e10ac1fc/login
```

Agregala al dominio habitual y guardala como marcador. El panel de administración se abre bajo el mismo prefijo:

```text
/acceso/9a87a1b3ee06514e995bd3d1e10ac1fc/admin
```

Mostrador, caja, productos, edición web y todas las otras páginas del personal comparten ese prefijo. Sus botones, enlaces, redirecciones de rol, cierre de sesión y vencimiento conservan el identificador.

## Comportamiento

- `/login`, `/admin` y todas las rutas internas anteriores, incluidas sus subsecciones, redirigen a `/landing`. Esto también ocurre si ya hay una sesión iniciada. No redirigen a la dirección nueva, para no mostrar el identificador al visitante.
- Un identificador incorrecto, ausente o mal formado bajo `/acceso` lleva a la landing. La comprobación se realiza en middleware y layouts del servidor, antes de cualquier redirección de autenticación que pueda revelar la ruta configurada.
- Dentro de la ruta correcta, se mantienen las sesiones firmadas y los permisos por rol. Conocer la URL no permite entrar al panel sin identificarse.
- Las páginas físicas están en `src/app/acceso/[staffKey]/...`. Las carpetas de rutas simples se trasladaron; no se utiliza un alias público que conserve las páginas originales.
- Los endpoints de sesión y gestión de empleados también requieren `X-Staff-Access-Key`, que el cliente obtiene de su dirección actual. Esta cabecera no sustituye la sesión y los permisos que ya verifican los endpoints.
- El identificador predeterminado se define únicamente en `src/lib/staff-private-path.server.ts`, sin importarlo en módulos cliente. No se añade a la navegación pública ni a ningún sitemap. El enlace completo será conocido por las personas que usen el área interna.
- Se conservan `noindex` y la prevención de caché compartida. `Referrer-Policy: no-referrer` evita enviar la dirección de la página interna como referencia al navegar a otros recursos.
- Landing, catálogo, páginas legales y acceso de clientes `/cliente/*` mantienen sus direcciones.

## Cambiar el identificador

Opcionalmente, configurá **`STAFF_ACCESS_PATH_KEY`** en el entorno del servidor/Vercel y volvé a desplegar. Admite entre 24 y 128 caracteres: letras ASCII, números, guion y guion bajo. Usá un valor aleatorio y evitá espacios, `%` y caracteres que requieran codificación en una URL.

Un valor no válido deshabilita el acceso por la ruta. Al cambiarlo, los marcadores anteriores llevan a la landing y las pestañas abiertas necesitan la dirección nueva. Cambiar el identificador no revoca las sesiones firmadas; para invalidarlas se utilizan los mecanismos de sesión ya documentados.

El identificador es una dirección menos predecible, no un cifrado ni una contraseña. La autorización sigue dependiendo del PIN, la sesión y el rol. Los límites y la revisión pendiente de otras tablas de Supabase siguen descritos en `docs/acceso-interno-personal.md`.

No requiere SQL adicional ni una nueva variable obligatoria. Se conserva la necesidad de la configuración privada y del SQL de empleados de la entrega anterior. No se ejecutaron pruebas, build ni comprobación de tipos; revisión estática del diff.
