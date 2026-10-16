// prec.js - Prevención IAAS
// CON obtenerDatosFormulario() para exportación TSV / TXT / SQL

document.addEventListener('DOMContentLoaded', function() {

   
    const gradoFlebitis = document.getElementById('grado-flebitis');


    // Alerta por grado alto de flebitis
    gradoFlebitis.addEventListener('change', function() {
        if (parseInt(this.value) >= 3) {
            alert('Alerta: Grado de flebitis ≥3');
        }
    });
    });


// ─────────────────────────────────────────────────────
// OBTENER DATOS PARA EXPORTACIÓN TSV / TXT / SQL
//
// Estructura devuelta (pensada para columnas SQL):
// {
//   fecha: string ISO,
//   flebitis: {
//     fijacion: boolean,
//     vencimiento: boolean,
//     grado: string,
//     obs: string
//   },
//   navm: {
//     posicion: boolean,
//     cuff: 'si'|'no'|'',
//     aspiracion: 'si'|'no'|'',
//     bucal: 'si'|'no'|'',
//     manos: 'si'|'no'|'',
//     clorhex: 'si'|'no'|'',
//     obs: string
//   },
//   itu: {
//     aseo: 'si'|'no'|'',
//     fijacion: boolean,
//     obs: string
//   }
// }
//
// Los booleanos se guardan como true/false (no como string 'sí'/'no')
// para facilitar el mapeo a columnas BIT/BOOLEAN en SQL futuro.
// En cib-export.js se convierten a 'sí'/'no' solo al momento de
// generar el texto legible para TSV/TXT.
// ─────────────────────────────────────────────────────

function obtenerDatosFormulario() {
    // Helper para leer radio buttons de forma segura
    const getRadio = (name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : '';
    };

    return {
        fecha: new Date().toISOString(),

        flebitis: {
            fijacion:    document.getElementById('rev-fijacion')?.checked    ?? false,
            vencimiento: document.getElementById('rev-vencimiento')?.checked ?? false,
            grado:       document.getElementById('grado-flebitis')?.value    || '',
            obs:         document.getElementById('obs-flebitis')?.value      || ''
        },

        navm: {
            posicion:  document.getElementById('posicion')?.checked ?? false,
            cuff:      getRadio('cuff'),
            aspiracion:getRadio('aspiracion'),
            bucal:     getRadio('bucal'),
            manos:     getRadio('manos'),
            clorhex:   getRadio('clorhex'),
            obs:       document.getElementById('obs-navm')?.value || ''
        },

        itu: {
            aseo:    getRadio('aseo'),
            fijacion:document.getElementById('rev-fijacion-itu')?.checked ?? false,
            obs:     document.getElementById('obs-itu')?.value || ''
        }
    };
}

// ─────────────────────────────────────────────────────
// LIMPIAR FORMULARIO
// ─────────────────────────────────────────────────────
function limpiarFormulario() {
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.querySelectorAll('textarea').forEach(t => t.value = '');
}

// ─────────────────────────────────────────────────────
// EXPORTAR AL SISTEMA DE NAVEGACIÓN
// ─────────────────────────────────────────────────────
window.obtenerDatosFormulario = obtenerDatosFormulario;
window.limpiarFormulario      = limpiarFormulario;