# Guardado y lectura de listas privadas

## Motivo del cambio

El navegador guardaba y consultaba listas directamente con la clave pública de Supabase. La cuenta personalizada en localStorage no proporciona una sesión de Supabase Auth: si faltan permisos o las políticas de la tabla no permiten esa operación anónima, Supabase puede devolver 401. La captura no permite distinguir el detalle exacto de la denegación remota.

Ahora ambas operaciones usan `/api/customer-shopping-lists`. La cuenta se obtiene de una cookie HttpOnly firmada por el servidor, emitida únicamente tras verificar la credencial en el inicio de sesión o el cambio de contraseña. El servidor vuelve a comprobar aprobación, nombre de negocio y activación de pedidos; filtra las listas por esa cuenta.

## Activación

1. Agregar `SUPABASE_SERVICE_ROLE_KEY` en las variables de entorno del servidor de Vercel y, para desarrollo, en `.env.local`. Usar la clave privada `service_role` del mismo proyecto Supabase configurado en `NEXT_PUBLIC_SUPABASE_URL`. No usar la clave pública ni agregar el prefijo `NEXT_PUBLIC_` a esta variable. No incluir su valor en Git ni en mensajes de soporte.
2. Ejecutar en Supabase → SQL Editor el archivo completo `supabase/migrations/202610250003_private_customer_shopping_lists.sql`. Crea la tabla si falta, conserva los registros existentes, mantiene RLS activo, elimina la antigua política abierta «Allow all» y revoca el acceso directo de `anon`, `authenticated` y `public`. El servidor accede con el rol privado.
3. Publicar el código con la variable configurada. Reiniciar el servidor local si corresponde.
4. Volver a iniciar sesión una vez para generar la cookie. La sesión anterior en localStorage no basta para acceder a las listas. El carrito existente se conserva en el navegador.

Sin la clave privada, el inicio de sesión conserva su funcionamiento y el guardado informa que requiere configuración; nunca vuelve a insertar de forma anónima. Sin cookie válida, se muestra un enlace para volver a iniciar sesión.

## Datos y alcance

- La cookie dura siete días, usa SameSite Lax y Secure en producción. Contiene el identificador y una revisión de la credencial, firmados con HMAC-SHA-256. La clave privada también firma las cookies con un prefijo específico de sesión; rotarla invalida todas esas sesiones.
- El cambio o restablecimiento de contraseña invalida las cookies anteriores al comprobar la revisión contra el hash actual. El cambio desde Mi cuenta renueva la cookie de quien realiza el cambio. Cerrar sesión elimina la cookie y el perfil local.
- El identificador de cuenta nunca se toma del cuerpo para autorizar ni elegir el propietario de una lista. `X-Customer-Id` solo detecta diferencias entre la cuenta mostrada en la interfaz y la cookie actual, por ejemplo entre pestañas.
- El servidor valida cantidades, presentaciones y notas, y construye las copias de nombres y unidades por caja consultando los productos actuales del catálogo. Conserva la compatibilidad de productos sin `units_per_box`.
- Mi cuenta muestra estados de carga y error con opción de reintentar, en vez de presentar un fallo de permisos como si no hubiera listas.
- La edición, los nombres y la repetición guiada de listas se describen en `docs/mi-cuenta-y-listas-guardadas.md`. Requieren además la migración `202610250004_editable_customer_shopping_lists.sql`.
- Los pedidos y las consultas por WhatsApp conservan su funcionamiento. Este cambio restringe únicamente la tabla de listas y no constituye una revisión de permisos de las demás tablas del proyecto.

No se configuró la clave privada remota ni se ejecutó la migración de producción. Se revisaron los cambios estáticamente; no se ejecutaron pruebas, build ni comprobaciones de tipos.
