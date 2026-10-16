// evolucion.js
// CON obtenerDatosFormulario() para exportación TSV / TXT / SQL

document.addEventListener("DOMContentLoaded", () => {
    inicializarEvolucion();
});

function inicializarEvolucion() {
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-agregar-registro")) {
            agregarRegistro(e.target);
        }
        if (e.target.classList.contains("btn-eliminar-registro")) {
            eliminarRegistro(e.target);
        }
    });
}

function agregarRegistro(boton) {
    const turno       = boton.closest(".turno");
    const tbody       = turno.querySelector(".registros");
    const primeraFila = tbody.querySelector(".registro");
    if (!tbody || !primeraFila) return;

    const nuevaFila = primeraFila.cloneNode(true);
    limpiarCampos(nuevaFila);
    tbody.appendChild(nuevaFila);
}

function eliminarRegistro(boton) {
    const fila  = boton.closest(".registro");
    const tbody = fila.closest(".registros");
    if (!fila || !tbody) return;

    if (tbody.querySelectorAll(".registro").length === 1) {
        alert("Debe existir al menos un registro.");
        return;
    }
    fila.remove();
}

function limpiarCampos(fila) {
    fila.querySelectorAll("input, textarea").forEach((campo) => {
        campo.value = "";
    });
}

// ─────────────────────────────────────────────────────
// LIMPIAR FORMULARIO COMPLETO
// ─────────────────────────────────────────────────────
function limpiarFormulario() {
    document.querySelectorAll('.registros').forEach(tbody => {
        // Dejar solo la primera fila y limpiarla
        const filas = tbody.querySelectorAll('.registro');
        filas.forEach((fila, idx) => {
            if (idx === 0) limpiarCampos(fila);
            else           fila.remove();
        });
    });
}

// ─────────────────────────────────────────────────────
// OBTENER DATOS PARA EXPORTACIÓN TSV / TXT / SQL
//
// Estructura devuelta (preparada para columnas SQL futuras):
// {
//   tecnico_largo:   [ { hora, observacion, responsable }, ... ],
//   tecnico_noche:   [ ... ],
//   enfermera_largo: [ ... ],
//   enfermera_noche: [ ... ],
//   timestamp: string ISO
// }
//
// Cada turno es un array de objetos → en SQL futuro se puede
// serializar como JSON en una columna TEXT, o normalizar en
// una tabla evoluciones(id, tipo_rol, turno, hora, observacion, responsable).
// ─────────────────────────────────────────────────────

function extraerRegistrosTurno(turnoEl) {
    if (!turnoEl) return [];
    const registros = [];

    turnoEl.querySelectorAll('.registro').forEach(fila => {
        const hora        = fila.querySelector('input[type="time"]')?.value || '';
        const observacion = fila.querySelector('textarea')?.value           || '';
        const responsable = fila.querySelector('input[type="text"]')?.value || '';

        // Solo incluir si hay algún dato real
        if (hora || observacion || responsable) {
            registros.push({ hora, observacion, responsable });
        }
    });

    return registros;
}

function obtenerDatosFormulario() {
    // Selecciona los turnos por su atributo data-tipo y data-turno
    const bloques = document.querySelectorAll('.evolucion-bloque');

    let tecnico_largo   = [];
    let tecnico_noche   = [];
    let enfermera_largo = [];
    let enfermera_noche = [];

    bloques.forEach(bloque => {
        const tipo = bloque.dataset.tipo; // 'tecnico' o 'enfermera'

        const turnoLargoEl  = bloque.querySelector('.turno[data-turno="largo"]');
        const turnoNocheEl  = bloque.querySelector('.turno[data-turno="noche"]');

        if (tipo === 'tecnico') {
            tecnico_largo = extraerRegistrosTurno(turnoLargoEl);
            tecnico_noche = extraerRegistrosTurno(turnoNocheEl);
        } else if (tipo === 'enfermera') {
            enfermera_largo = extraerRegistrosTurno(turnoLargoEl);
            enfermera_noche = extraerRegistrosTurno(turnoNocheEl);
        }
    });

    return {
        tecnico_largo,
        tecnico_noche,
        enfermera_largo,
        enfermera_noche,
        timestamp: new Date().toISOString()
    };
}

// ─────────────────────────────────────────────────────
// EXPORTAR AL SISTEMA DE NAVEGACIÓN
// ─────────────────────────────────────────────────────
window.obtenerDatosFormulario = obtenerDatosFormulario;
window.limpiarFormulario      = limpiarFormulario;