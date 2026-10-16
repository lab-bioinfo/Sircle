// hhha.js
// CON obtenerDatosFormulario() para exportación TSV / TXT / SQL
// Los checkboxes se capturan como booleanos true/false
// para compatibilidad con columnas BIT/BOOLEAN en SQL futuro.

// ─────────────────────────────────────────────────────
// OBTENER DATOS PARA EXPORTACIÓN TSV / TXT / SQL
//
// Estructura devuelta:
// {
//   // Orden ficha clínica (booleanos)
//   hoja_ingreso_medico, ingreso_estadistico, hoja_dau,
//   docs_externos, hoja_evolucion, examenes_ficha,
//   protocolo_pertenencias, hoja_enfermeria,
//
//   // Identificación
//   brazalete: 'si'|'no'|'',
//   ubicacion_brazalete: string,
//   pizarra: 'si'|'no'|'',
//   obs_identificacion: string,
//
//   // Pertenencias
//   pertenencias: 'si'|'no'|'',
//   obs_pertenencias: string,
//
//   // Responsable
//   responsable_nombre: string,
//   responsable_usuario: string
//   // La contraseña NO se exporta al TSV/TXT por seguridad
// }
// ─────────────────────────────────────────────────────

function obtenerDatosFormulario() {
    const getCheckbox = (name) => {
        const el = document.querySelector(`input[name="${name}"]`);
        return el ? el.checked : false;
    };

    const getRadio = (name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : '';
    };

    const getText = (name) => {
        const el = document.querySelector(`[name="${name}"]`);
        return el ? (el.value || '') : '';
    };

    return {
        // Orden ficha clínica
        hoja_ingreso_medico:    getCheckbox('hoja_ingreso_medico'),
        ingreso_estadistico:    getCheckbox('ingreso_estadistico'),
        hoja_dau:               getCheckbox('hoja_dau'),
        docs_externos:          getCheckbox('docs_externos'),
        hoja_evolucion:         getCheckbox('hoja_evolucion'),
        examenes_ficha:         getCheckbox('examenes_ficha'),
        protocolo_pertenencias: getCheckbox('protocolo_pertenencias'),
        hoja_enfermeria:        getCheckbox('hoja_enfermeria'),

        // Identificación
        brazalete:           getRadio('brazalete'),
        ubicacion_brazalete: getText('ubicacion_brazalete'),
        pizarra:             getRadio('pizarra'),
        obs_identificacion:  getText('obs_identificacion'),

        // Pertenencias
        pertenencias:    getRadio('pertenencias'),
        obs_pertenencias:getText('obs_pertenencias'),

        // Responsable (contraseña excluida intencionalmente)
        responsable_nombre:  getText('responsable_nombre'),
        responsable_usuario: getText('responsable_usuario'),
         tiene_password:      document.querySelector('[name="responsable_password"]')?.value.trim().length > 0,

        timestamp: new Date().toISOString()


    };
}

function limpiarFormulario() {
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[type="text"], input[type="password"]').forEach(i => i.value = '');
    document.querySelectorAll('textarea').forEach(t => t.value = '');
}

window.obtenerDatosFormulario = obtenerDatosFormulario;
window.limpiarFormulario      = limpiarFormulario;