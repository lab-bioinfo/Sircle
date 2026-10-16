// ====================
// cib-storage.js
// Captura datos del iframe, los guarda en datosCompletos,
// y los restaura al volver a un módulo.
// Depende de: cib-estado.js
// ====================

// Set que registra qué módulos el usuario realmente visitó.
// Un módulo se marca como visitado solo cuando el usuario
// navega a él (cambiarModulo / cargarModulo).
// Esto evita que módulos con valores por defecto en el HTML
// (radios pre-marcados, checkboxes false) se guarden
// sin que el usuario los haya llenado.
const modulosVisitados = new Set();

// ====================
// MARCAR MÓDULO COMO VISITADO
// Se llama desde cib-navegacion.js al cargar/cambiar módulo
// ====================
function marcarModuloVisitado(moduleId) {
    modulosVisitados.add(moduleId);
    console.log(`👁 Módulo visitado: ${moduleId}. Total: ${[...modulosVisitados].join(', ')}`);
}

// ====================
// CAPTURA DE DATOS DEL IFRAME
//
// PRIORIDAD DE CAPTURA (de mayor a menor):
//   1. window.obtenerDatosFormulario() del módulo  → datos estructurados y completos
//   2. inputs con data-campo                        → nuevo sistema de marcado
//   3. inputs con name=                             → compatibilidad hacia atrás
// ====================

function capturarDatosIframe(iframe) {
    try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument || win.document;

        // ── PRIORIDAD 1: función estructurada del módulo ──────────────
        if (typeof win.obtenerDatosFormulario === 'function') {
            const datosEstructurados = win.obtenerDatosFormulario();
            if (datosEstructurados && Object.keys(datosEstructurados).length > 0) {
                const modulosComplejos = [
                    'balance', 'control-signos', 'evolucion', 'prec-iaas',
                    'indicaciones', 'elementos', 'examen-fisico', 'atencion-1'
                ];
                const moduleId = MODULES[currentModuleIndex]?.id || '';

                if (modulosComplejos.includes(moduleId)) {
                    return datosEstructurados;
                }

                const datosPlanos = capturarInputsPlanos(doc);
                return Object.assign(datosPlanos, datosEstructurados);
            }
        }

        // ── PRIORIDAD 2 y 3: solo inputs ──
        return capturarInputsPlanos(doc);

    } catch (error) {
        console.log('Error capturando datos del iframe:', error);
        return {};
    }
}

// ─────────────────────────────────────────────────────
// CAPTURA DE INPUTS PLANOS
// ─────────────────────────────────────────────────────

function capturarInputsPlanos(doc) {
    const datos = {};

    // Inputs con data-campo (nuevo sistema)
    doc.querySelectorAll('[data-campo]').forEach(input => {
        const campo = input.dataset.campo;
        if (input.type === 'checkbox') {
            datos[campo] = input.checked;
        } else if (input.type === 'radio') {
            if (input.checked) datos[campo] = input.value;
        } else {
            datos[campo] = input.value;
        }
    });

    // Inputs con name= (compatibilidad)
    const radiosProcesados = new Set();

    doc.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.dataset.campo) return;
        if (!input.name)         return;

        if (input.type === 'radio') {
            if (radiosProcesados.has(input.name)) return;
            radiosProcesados.add(input.name);
            const checked = doc.querySelector(`input[name="${input.name}"]:checked`);
            datos[input.name] = checked ? checked.value : '';

        } else if (input.type === 'checkbox') {
            if (!(input.name in datos)) {
                datos[input.name] = input.checked;
            }

        } else {
            datos[input.name] = input.value;
        }
    });

    return datos;
}

// ====================
// GUARDAR DATOS DEL MÓDULO ACTUAL EN MEMORIA
// Solo guarda si el módulo fue visitado por el usuario.
// ====================

function guardarDatosModuloActual() {
    try {
        const iframe   = document.getElementById('module-frame');
        const moduleId = MODULES[currentModuleIndex].id;

        // Si el módulo nunca fue visitado no capturamos nada,
        // así evitamos guardar valores por defecto del HTML.
        if (!modulosVisitados.has(moduleId)) {
            console.log(`⏭ Módulo ${moduleId} no visitado, se omite captura.`);
            return;
        }

        if (iframe.contentWindow) {
            const datos = capturarDatosIframe(iframe);
            if (datos && Object.keys(datos).length > 0) {
                datosCompletos[moduleId] = datos;
                console.log(`💾 Datos guardados en memoria para ${moduleId}:`, datos);
                actualizarEstadoModulo(moduleId, true);
            }
        }
    } catch (error) {
        console.log('⚠️ Error al guardar datos del módulo:', error);
    }
}

// ====================
// GUARDAR MÓDULO INDIVIDUAL EN EL BACKEND (SQL)
// ====================

async function guardarModuloEnDB(moduleId, datos) {
    if (!datos || Object.keys(datos).length === 0) {
        console.log(`⚠️ Sin datos para guardar en DB: ${moduleId}`);
        return;
    }

    if (!window.codigoSesionActual) {
        window.codigoSesionActual = `SESION_${Date.now()}`;
    }

    const usuarioActual = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = {
        codigo_sesion: window.codigoSesionActual,
        modulo_id:     moduleId,
        datos:         datos,
        timestamp:     new Date().toISOString(),
        username:      usuarioActual.username || null   
    };

    try {
        const response = await fetch('http://172.22.251.49:5000/api/guardar_modulo', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
            signal:  AbortSignal.timeout(5000)
        });

        if (response.ok) {
            console.log(`✅ Módulo ${moduleId} guardado en DB`);
        } else {
            console.warn(`⚠️ El servidor respondió con error al guardar ${moduleId}`);
        }
    } catch (error) {
        console.warn(`⚠️ No se pudo guardar ${moduleId} en DB (sin conexión): ${error.message}`);
    }
}

// ====================
// GUARDAR INGRESO COMPLETO EN EL BACKEND (SQL)
// ====================

async function guardarIngresoCompletoEnDB() {
    if (!window.codigoSesionActual) {
        window.codigoSesionActual = `SESION_${Date.now()}`;
    }

    const payload = {
        codigo_sesion: window.codigoSesionActual,
        codigo:        `SIRCLE${codigoSecuencia.toString().padStart(4, '0')}`,
        datos:         datosCompletos,
        timestamp:     new Date().toISOString()
    };

    const response = await fetch('http://172.22.251.49:5000/api/almacenar_tsv', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(10000)
    });

    if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
    }

    return await response.json();
}

// ====================
// RESTAURAR DATOS EN EL MÓDULO AL VOLVER
// ====================

function cargarDatosEnModulo() {
    try {
        const iframe   = document.getElementById('module-frame');
        const moduleId = MODULES[currentModuleIndex].id;
        const datos    = datosCompletos[moduleId];

        if (!datos || !iframe.contentWindow) return;

        const doc = iframe.contentDocument || iframe.contentWindow.document;

        // Función de carga estructurada del módulo (prioridad)
        if (typeof iframe.contentWindow.cargarDatosFormulario === 'function') {
            iframe.contentWindow.cargarDatosFormulario(datos);
            console.log(`📂 Datos cargados en ${moduleId} (función estructurada)`);
            return;
        }

        // Restaurar inputs con data-campo
        Object.entries(datos).forEach(([campo, value]) => {
            const elements = doc.querySelectorAll(`[data-campo="${campo}"]`);
            elements.forEach(el => {
                if (el.type === 'checkbox') {
                    el.checked = value === true || value === 'true';
                    el.dispatchEvent(new Event('change'));
                } else if (el.type === 'radio') {
                    if (el.value === value) {
                        el.checked = true;
                        el.dispatchEvent(new Event('change'));
                    }
                } else {
                    el.value = value || '';
                }
            });
        });

        // Restaurar inputs con name=
        Object.entries(datos).forEach(([name, value]) => {
            const elements = doc.querySelectorAll(`[name="${name}"]:not([data-campo])`);
            elements.forEach(element => {
                if (element.type === 'checkbox') {
                    element.checked = value === true || value === 'true';
                    element.dispatchEvent(new Event('change'));
                } else if (element.type === 'radio') {
                    if (element.value === value) {
                        element.checked = true;
                        element.dispatchEvent(new Event('change'));
                    }
                } else {
                    element.value = value || '';
                }
            });
        });

        // Restauraciones especiales por módulo
        switch (moduleId) {
            case 'iaas':
                restaurarIAAS(iframe, datos);
                break;
            case 'elementos':
                restaurarElementos(iframe, datos);
                break;
        }

        console.log(`📂 Datos cargados en ${moduleId} (inputs planos)`);

    } catch (error) {
        console.log('Error cargando datos en módulo:', error);
    }
}

// ====================
// RESTAURACIONES ESPECIALES POR MÓDULO
// ====================

function restaurarIAAS(iframe, datos) {
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    const requiresPrecautions = datos.requiresPrecautions || datos['requires-precautions'];
    if (requiresPrecautions) {
        const radioSi = doc.querySelector('input[name="requires-precautions"][value="si"]');
        const radioNo = doc.querySelector('input[name="requires-precautions"][value="no"]');

        if (requiresPrecautions === 'si' && radioSi) {
            radioSi.checked = true;
            const precautionsField = doc.getElementById('precautions-fields');
            if (precautionsField) precautionsField.classList.add('show');
        } else if (requiresPrecautions === 'no' && radioNo) {
            radioNo.checked = true;
        }
    }

    const precautionsValue = datos.precautions;
    if (precautionsValue) {
        const precautionsArray = precautionsValue.split(',');
        doc.querySelectorAll('#precautions-select .multi-select-option').forEach(option => {
            if (precautionsArray.includes(option.getAttribute('data-value'))) {
                option.classList.add('selected');
            }
        });
        const hiddenInput = doc.getElementById('precautions');
        if (hiddenInput) hiddenInput.value = precautionsValue;
    }

    if (datos.triage || datos['triage-category']) {
        setTimeout(() => {
            if (iframe.contentWindow && iframe.contentWindow.updateTriageColor) {
                iframe.contentWindow.updateTriageColor();
            }
        }, 100);
    }
}

function restaurarElementos(iframe, datos) {
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    Object.entries(datos).forEach(([name, value]) => {
        if (!name.startsWith('instalado_')) return;
        const selectEl = doc.querySelector(`select[name="${name}"]`);
        if (selectEl) {
            selectEl.value = value;
            selectEl.dispatchEvent(new Event('change'));
        }
    });

    setTimeout(() => {
        Object.entries(datos).forEach(([name, value]) => {
            if (name.startsWith('instalado_')) return;
            const element = doc.querySelector(`[name="${name}"]`);
            if (element) element.value = value || '';
        });
    }, 150);

    if (datos.drenajes && Array.isArray(datos.drenajes)) {
        setTimeout(() => {
            if (iframe.contentWindow && iframe.contentWindow.cargarDrenajes) {
                iframe.contentWindow.cargarDrenajes(datos.drenajes);
            }
        }, 200);
    }
}

// ====================
// FORZAR EVENTOS DESPUÉS DE CARGAR DATOS
// ====================

function forzarEventosEnModulo() {
    try {
        const iframe = document.getElementById('module-frame');
        const doc    = iframe.contentDocument || iframe.contentWindow.document;

        doc.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            radio.dispatchEvent(new Event('change'));
        });
        doc.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            checkbox.dispatchEvent(new Event('change'));
        });
        doc.querySelectorAll('select').forEach(select => {
            if (select.value) select.dispatchEvent(new Event('change'));
        });
    } catch (error) {
        console.log('Error forzando eventos:', error);
    }
}

// ====================
// LIMPIAR MÓDULO ACTUAL
// ====================

function limpiarModuloActual() {
    if (!confirm('¿Está seguro de que desea limpiar todos los datos del módulo actual?')) return;

    try {
        const iframe   = document.getElementById('module-frame');
        const moduleId = MODULES[currentModuleIndex].id;

        delete datosCompletos[moduleId];
        // Al limpiar también quitamos la marca de visitado
        modulosVisitados.delete(moduleId);

        if (iframe.contentWindow && typeof iframe.contentWindow.limpiarFormulario === 'function') {
            iframe.contentWindow.limpiarFormulario();
        } else {
            const form = (iframe.contentDocument || iframe.contentWindow.document).querySelector('form');
            if (form) form.reset();
        }

        console.log(`🧹 Módulo ${moduleId} limpiado`);
        actualizarEstadoModulo(moduleId, false);
    } catch (error) {
        console.log('Error limpiando módulo:', error);
    }
}

// ====================
// NUEVO PACIENTE
// ====================

function nuevoPaciente() {
    if (!confirm('¿Está seguro de que desea comenzar un nuevo paciente?\nSe limpiarán todos los módulos y volverá al inicio.')) return;

    datosCompletos = {};
    modulosVisitados.clear();
    window.codigoSesionActual = null;
    localStorage.removeItem('cib_estado');

    const iframe = document.getElementById('module-frame');
    try {
        if (iframe.contentWindow && typeof iframe.contentWindow.limpiarFormulario === 'function') {
            iframe.contentWindow.limpiarFormulario();
        } else {
            const form = (iframe.contentDocument || iframe.contentWindow.document).querySelector('form');
            if (form) form.reset();
        }
    } catch (error) {
        console.log('Error limpiando formulario:', error);
    }

    cambiarModulo(0);
    MODULES.forEach(module => actualizarEstadoModulo(module.id, false));

    console.log('🆕 Nuevo paciente - volviendo a Ingreso');
    mostrarNotificacion('Nuevo paciente iniciado. Comience desde el módulo de Ingreso.', 'success');
}

// ====================
// PERSISTENCIA EN localStorage
// ====================

function cargarEstado() {
    try {
        const estado = localStorage.getItem('cib_estado');
        if (estado) {
            const parsed = JSON.parse(estado);
            datosCompletos            = parsed.datosCompletos        || {};
            codigoSecuencia           = parsed.codigoSecuencia       || 1;
            tsvData                   = parsed.tsvData               || [];
            window.codigoSesionActual = parsed.codigoSesionActual    || null;

            // Restaurar módulos visitados desde localStorage
            const visitados = parsed.modulosVisitados || [];
            visitados.forEach(id => modulosVisitados.add(id));

            console.log('📂 Estado cargado desde localStorage');
        }
    } catch (error) {
        console.log('Error cargando estado:', error);
    }
}

function guardarEstado() {
    try {
        localStorage.setItem('cib_estado', JSON.stringify({
            datosCompletos,
            codigoSecuencia,
            tsvData,
            codigoSesionActual: window.codigoSesionActual || null,
            modulosVisitados:   [...modulosVisitados],
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.log('Error guardando estado:', error);
    }
}

// Autoguardado cada 30 segundos
setInterval(guardarEstado, 30000);

// Exportar funciones al sistema de navegación
window.marcarModuloVisitado       = marcarModuloVisitado;
window.guardarModuloEnDB          = guardarModuloEnDB;
window.guardarIngresoCompletoEnDB = guardarIngresoCompletoEnDB;
