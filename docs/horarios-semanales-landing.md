# Horarios de atención de toda la semana

En **Edición web → Secciones → Bloques de Landing → Nuevo bloque**, elegí **Horarios de atención · toda la semana**.

El bloque muestra los siete días en orden, de lunes a domingo, con el estilo crema y oliva de la landing. Sus títulos, descripción, fondos, colores, tipografías, pesos y alineación del encabezado son editables. Incluye una vista previa en el editor.

## Completar los horarios

Cada día admite:

- **Horario a confirmar**, si todavía no tenés las horas exactas.
- **Abierto**, con apertura y cierre para un horario corrido.
- **Abierto** con **Agregar segundo turno**, para atención por la mañana y por la tarde con un corte intermedio.
- **Cerrado**, sin mostrar horarios de atención para ese día.

Los botones de copia permiten aplicar el lunes a martes–viernes o a toda la semana. La copia modifica el formulario y no publica hasta guardar.

Si un día está marcado abierto, antes de guardar se comprueba que los turnos tengan horas completas, que el cierre sea posterior a la apertura y que no se superpongan. Los turnos corresponden al mismo día; no se implementaron turnos nocturnos con cierre al día siguiente.

Podés cambiar los textos para cerrado y horario pendiente, el texto pequeño superior y una aclaración opcional, por ejemplo para feriados. La aclaración solo se muestra si la escribís.

Los días comienzan **sin horas precargadas**, como pendientes de confirmar: el usuario solicitó todas las opciones pero no proporcionó horarios exactos. No se presume apertura ni cierre en ningún día.

El bloque se guarda y ordena como los otros bloques de landing. Sus horarios son independientes del texto libre de horarios que se usa en Info, footer y ubicación. No sincroniza ni reemplaza esos datos.

Usa `block_type = weekly_hours` y los ajustes JSON existentes. No requiere una migración SQL ni dependencias. No se creó un registro remoto ni se ejecutaron pruebas, build o comprobación de tipos; revisión estática del diff.
