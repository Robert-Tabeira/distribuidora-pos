# Contraseñas de cuentas de negocios

## Publicación

1. Ejecutar en Supabase → SQL Editor el archivo completo `supabase/migrations/202610250002_customer_passwords.sql` antes de publicar el código. Permite almacenar hashes con sal en la columna histórica `customers.pin_hash` convirtiéndola a texto; conserva las credenciales y los datos existentes.
2. Publicar el código actualizado. No hay nuevas dependencias ni variables de entorno.

## Uso

- El registro y el cambio de contraseña exigen entre 12 y 128 caracteres, con al menos una letra y un número. Admiten símbolos y espacios sin recortarlos. Incluyen confirmación y controles para mostrar u ocultar cada contraseña.
- Se mantiene el teléfono como usuario. Los registros siguen pendientes de aprobación del local y son exclusivos para negocios.
- Las contraseñas nuevas se derivan con PBKDF2-HMAC-SHA-256, 600.000 iteraciones, sal aleatoria de 16 bytes y resultado de 32 bytes. El formato almacena algoritmo, iteraciones, sal y derivación. Dos usuarios con la misma contraseña no reciben el mismo hash.
- La compatibilidad con SHA-256 se usa únicamente para verificar las credenciales anteriores. No se crean PIN nuevos. Al entrar con un código anterior se abre Mi cuenta → Datos con un aviso y el formulario de cambio. El usuario debe ingresar ese código como contraseña actual y definir una nueva. Tras guardarla, el código anterior deja de ser válido. Esta transición no desactiva automáticamente las cuentas que todavía no hicieron el cambio.
- Las sesiones existentes siguen operativas. El objeto que se guarda desde ahora en localStorage contiene únicamente los campos de perfil necesarios y la indicación de migración; no incluye el hash consultado.
- `/api/customer-access` valida registro, inicio de sesión y cambio de contraseña en el servidor. Comprueba el interruptor de pedidos y el estado de aprobación; responde con el perfil permitido sin enviar hashes. El cambio comprueba la credencial actual y actualiza únicamente si la derivación almacenada sigue siendo la verificada, para no pisar un cambio simultáneo.

## Recuperación y administración

- `/cliente/recuperar` usa `/api/recover-password`; `/api/recover-pin` se conserva como ruta compatible.
- Sin correo registrado, se mantiene la asistencia por WhatsApp. Con correo, se utiliza la configuración existente de Resend para enviar una contraseña de recuperación aleatoria de 24 caracteres. El local puede generar una contraseña equivalente desde Administración → Clientes, después de verificar al titular.
- La contraseña de recuperación debe cambiarse desde Mi cuenta → Datos → Cambiar contraseña. No tiene caducidad automática en este flujo.
- Si falta la configuración de correo o falla el envío, no se sustituye la contraseña actual. Si otro cambio de contraseña ocurre durante el envío, la actualización se rechaza y el cliente debe repetir la recuperación; el mensaje recibido en ese caso puede contener una contraseña que no quedó activa.

## Alcance

Este cambio refuerza la elección, verificación y almacenamiento de contraseñas dentro de la autenticación personalizada existente. La sesión sigue en localStorage y otros flujos conservan consultas directas de Supabase. No sustituye ese sistema por Supabase Auth, cookies de sesión verificadas en servidor, límites de intentos distribuidos ni nuevas políticas RLS. Por tanto, no debe presentarse como una revisión completa de la seguridad del acceso o de la autorización de datos. Las políticas actuales de la tabla deben auditarse antes de afirmar que los hashes y datos no se pueden consultar o modificar por otras vías.

Se realizó revisión estática de los cambios. No se ejecutaron build, comprobaciones de tipos ni pruebas automáticas, ni la migración remota.
