// ====================
// cib-navegacion.js
// Depende de: cib-estado.js, cib-storage.js, cib-export.js
// ====================

// --------------------------------------------
// 1. VERIFICACIÓN DE SESIÓN (se ejecuta inmediatamente)
// --------------------------------------------
(function verificarSesion() {
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = 'login/login.html';
        return;
    }
    try {
        const user = JSON.parse(userData);
        if (!user.loggedIn) {
            window.location.href = 'login/login.html';
            return;
        }
        // Guardar usuario globalmente para uso posterior
        window._sessionUser = user;
    } catch (e) {
        window.location.href = 'login/login.html';
    }
})();



document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ CIB System v2.0 Inicializado');
    cargarEstado();
    if (typeof inicializarPythonBridge === 'function') inicializarPythonBridge();
    configurarEventos();
    cargarModulo(0);
    actualizarInterfaz();
});

 // --------------------------------------------
    // 3. ACTUALIZAR NOMBRE DE USUARIO Y LOGOUT
    // --------------------------------------------
    const user = window._sessionUser;
    if (user && user.name) {
        const nameSpan = document.getElementById('user-name-display');
        if (nameSpan) {
            nameSpan.textContent = user.name;
        }
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                localStorage.removeItem('user');
                window.location.href = 'login/login.html';
            }
        });
    }
;


// ====================
// ¿El objeto tiene datos reales del usuario?
// ====================

function contieneInformacionReal(datos) {
    if (!datos || typeof datos !== 'object' || Object.keys(datos).length === 0) return false;

    const llavesIgnorables = [
        'timestamp', 'formType', 'codigo', 'numero', 'fechaHora',
        'totalInstalados', 'created_at', 'id', 'bloques'
    ];

    const tieneCamposSignificativos = Object.keys(datos).some(key => {
        if (llavesIgnorables.includes(key)) return false;

        const keyLower = key.toLowerCase();
        if (keyLower.includes('fecha') || keyLower.includes('hora')) return false;

        const val = datos[key];
        if (val === '' || val === null || val === undefined) return false;

        // Un booleano true sí es un dato real (checkbox marcado)
        // Un booleano false NO lo consideramos significativo por sí solo
        if (typeof val === 'boolean') return val === true;

        const valoresPorDefecto = ['no', 'Cama', 'camilla', 'Seleccione', 'Seleccione...'];
        if (valoresPorDefecto.includes(val)) return false;

        if (Array.isArray(val)) {
            return val.some(item => item !== '' && !valoresPorDefecto.includes(item));
        }

        return true;
    });

    if (tieneCamposSignificativos) return true;

    if (datos.bloques && Array.isArray(datos.bloques)) {
        return datos.bloques.some(bloque => contieneInformacionReal(bloque));
    }

    if (datos.laboratorio?.length > 0 || datos.imagenologia?.length > 0 ||
        datos.interconsultas?.length > 0 || datos.controlesSeriados?.length > 0) {
        return true;
    }

    if (datos.tecnico_largo?.length > 0 || datos.tecnico_noche?.length > 0 ||
        datos.enfermera_largo?.length > 0 || datos.enfermera_noche?.length > 0) {
        return true;
    }

    if (datos.flebitis || datos.navm || datos.itu) return true;

    if (datos.totales && Object.values(datos.totales).some(v => v !== 0)) return true;

    if (datos.mediciones?.length > 0) return true;

    return false;
}

// ====================
// RESUMEN DE MÓDULOS PARA EL MODAL
// ====================

function generarResumenModulos() {
    return MODULES.map((module, index) => {
        const datos           = datosCompletos[module.id] || {};
        const tieneDatosReal  = contieneInformacionReal(datos);
        const camposFaltantes = verificarCamposRequeridos(module.id, datos);
        const completo        = tieneDatosReal && camposFaltantes.length === 0;

        return `
            <div class="module-status-item ${completo ? 'complete' : 'incomplete'}">
                <div class="status-icon ${completo ? 'complete' : 'incomplete'}">
                    <i class="fas ${completo ? 'fa-check' : 'fa-exclamation'}"></i>
                </div>
                <div class="module-info">
                    <h4>${index + 1}. ${module.name}</h4>
                    <p>${tieneDatosReal ? 'Datos ingresados' : 'Sin datos registrados'}</p>
                    ${!completo && camposFaltantes.length > 0 ? `
                        <div class="missing-fields">
                            <strong>Faltan:</strong> ${camposFaltantes.join(', ')}
                        </div>` : ''}
                </div>
            </div>`;
    }).join('');
}

// ====================
// CONFIGURAR EVENTOS DE BOTONES
// ====================

function configurarEventos() {
    // Navegación por links superiores
    document.querySelectorAll('.module-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const index = MODULES.findIndex(m => m.id === link.dataset.module);
            if (index !== -1) cambiarModulo(index);
        });
    });

    // Botón Anterior — solo navega, sin guardar en DB
    document.getElementById('btn-anterior').addEventListener('click', () => {
        cambiarModulo(currentModuleIndex - 1);
    });

    // Botón Siguiente — guarda en memoria Y en DB antes de cambiar
    document.getElementById('btn-siguiente').addEventListener('click', async () => {
        guardarDatosModuloActual();

        const moduleId = MODULES[currentModuleIndex].id;
        const datos    = datosCompletos[moduleId];
        guardarModuloEnDB(moduleId, datos).catch(err => {
            console.warn('Guardado en DB falló silenciosamente:', err);
        });

        guardarEstado();
        if (currentModuleIndex === MODULES.length - 1) {
        mostrarVistaPrevia('finalizar');
    } else {
        cambiarModulo(currentModuleIndex + 1);
    }

    });

    // Botón "Previsualizar"
    // Captura el módulo activo (incluido el último que no tiene "Siguiente")
    document.getElementById('btn-finalizar').addEventListener('click', () => {
        guardarDatosModuloActual();
        guardarEstado();
        mostrarVistaPrevia('finalizar');
    });

    // Botones de la barra inferior
    document.getElementById('btn-limpiar-modulo').addEventListener('click', limpiarModuloActual);
    document.getElementById('btn-nuevo-paciente').addEventListener('click', nuevoPaciente);

    // Botones dentro del modal
    document.getElementById('btn-preview-almacenar').addEventListener('click', finalizarIngreso);
    document.getElementById('btn-preview-descargar-tsv').addEventListener('click', () => descargarTSV(true));
    document.getElementById('btn-preview-descargar-txt').addEventListener('click', () => descargarTXT(true));

    // Cerrar modal
    document.querySelector('.modal-close').addEventListener('click', cerrarModal);
    document.getElementById('preview-modal').addEventListener('click', (e) => {
        if (e.target.id === 'preview-modal') cerrarModal();
    });
}

// ====================
// FINALIZAR INGRESO
// ====================

async function finalizarIngreso() {
    const datosHHHA = datosCompletos['hhha'] || {};
    const usuarioOk  = datosHHHA.responsable_usuario && datosHHHA.responsable_usuario.trim().length > 0;
    const passwordOk = datosHHHA.tiene_password === true;

    if (!usuarioOk || !passwordOk) {
        alert('Debe completar Usuario y Contraseña en el módulo de Indicadores HHHA antes de finalizar.');
        return;
    }
    const conDatos = Object.keys(datosCompletos).filter(id =>
        Object.keys(datosCompletos[id] || {}).length > 0
    ).length;

    if (conDatos === 0) {
        alert('No hay datos para finalizar. Complete al menos un módulo.');
        return;
    }

    try {
        await guardarIngresoCompletoEnDB();

        tsvData.push(generarFilaTSV());
        codigoSecuencia++;
        guardarEstado();

        mostrarNotificacion(
            `✅ Ingreso finalizado (Código: SIRCLE${(codigoSecuencia - 1).toString().padStart(4, '0')})`,
            'success'
        );
        cerrarModal();

    } catch (error) {
        console.error('Error al finalizar ingreso:', error);

        tsvData.push(generarFilaTSV());
        codigoSecuencia++;
        guardarEstado();

        mostrarNotificacion(
            '⚠️ Sin conexión al servidor. Ingreso guardado localmente.',
            'warning'
        );
        cerrarModal();
    }
}

// ====================
// CARGAR MÓDULO
// Marca el módulo como visitado DESPUÉS de que el iframe termina de cargar,
// para que marcarModuloVisitado() refleje que el usuario realmente llegó a él.
// ====================

function cargarModulo(index) {
    if (index < 0 || index >= MODULES.length) return;

    guardarDatosModuloActual();
    currentModuleIndex = index;

    const iframe     = document.getElementById('module-frame');
    const moduleId   = MODULES[index].id;

    iframe.src = MODULES[index].path;
    iframe.onload = function () {
        // Marcar como visitado una vez que el iframe cargó
        marcarModuloVisitado(moduleId);

        setTimeout(() => cargarDatosEnModulo(), 100);
        ajustarAlturaIframe();
    };
    actualizarInterfaz();
}

function cambiarModulo(index) {
    if (index < 0 || index >= MODULES.length) return;

    guardarDatosModuloActual();
    currentModuleIndex = index;

    const iframe   = document.getElementById('module-frame');
    const moduleId = MODULES[index].id;

    iframe.src = MODULES[index].path;
    iframe.onload = function () {
        // Marcar como visitado una vez que el iframe cargó
        marcarModuloVisitado(moduleId);

        setTimeout(() => {
            cargarDatosEnModulo();
            setTimeout(() => forzarEventosEnModulo(), 200);
        }, 300);
        ajustarAlturaIframe();
    };
    actualizarInterfaz();
}

// ====================
// MODAL DE PREVISUALIZACIÓN
// ====================

function mostrarVistaPrevia(accion = 'ver') {
    document.getElementById('modules-status').innerHTML = generarResumenModulos();
    document.getElementById('preview-modal').classList.add('show');
    document.getElementById('preview-modal').dataset.accion = accion;
}

function cerrarModal() {
    document.getElementById('preview-modal').classList.remove('show');
}

// ====================
// INTERFAZ Y ESTADOS
// ====================

function actualizarInterfaz() {
    const module = MODULES[currentModuleIndex];
    document.querySelectorAll('.module-link').forEach(link => {
        link.classList.toggle('active', link.dataset.module === module.id);
    });

    const nameDisplay = document.getElementById('current-module-name');
    if (nameDisplay) nameDisplay.textContent = module.name;

    document.querySelectorAll('.indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentModuleIndex);
        const moduleId     = MODULES[index].id;
        const datos        = datosCompletos[moduleId] || {};
        const tieneDatos   = contieneInformacionReal(datos);
        const estaCompleto = verificarCamposRequeridos(moduleId, datos).length === 0;
        indicator.classList.toggle('has-data',     tieneDatos && estaCompleto);
        indicator.classList.toggle('missing-data', tieneDatos && !estaCompleto);
    });

    const btnAnt = document.getElementById('btn-anterior');
const btnSig = document.getElementById('btn-siguiente');
if (btnAnt) btnAnt.disabled = currentModuleIndex === 0;
if (btnSig) {
    btnSig.disabled = false; // NUEVO: ya no se apaga en el último módulo
    const esUltimo = currentModuleIndex === MODULES.length - 1;
    btnSig.innerHTML = esUltimo
        ? '<i class="fas fa-flag-checkered"></i> Guardar y finalizar'
        : 'Siguiente <i class="fas fa-arrow-right"></i>';
}
}

function actualizarEstadoModulo(moduleId, tieneDatos) {
    const index = MODULES.findIndex(m => m.id === moduleId);
    if (index === -1) return;
    const indicator = document.querySelectorAll('.indicator')[index];
    if (!indicator) return;
    const datos        = datosCompletos[moduleId] || {};
    const estaCompleto = verificarCamposRequeridos(moduleId, datos).length === 0;
    const tieneReal    = contieneInformacionReal(datos);
    indicator.classList.toggle('has-data',     tieneReal && estaCompleto);
    indicator.classList.toggle('missing-data', tieneReal && !estaCompleto);
}

function verificarCamposRequeridos(moduleId, datos) {
    const module = MODULES.find(m => m.id === moduleId);
    if (!module || !module.requiredFields) return [];
    return module.requiredFields.filter(field => {
        const value = datos[field];
        return !value || value.toString().trim() ==='';
    });
}

function ajustarAlturaIframe() {
    setTimeout(() => {
        try {
            const iframe    = document.getElementById('module-frame');
            const container = document.querySelector('.module-container');
            if (iframe.contentDocument) {
                const height = Math.max(iframe.contentDocument.body.scrollHeight, 600);
                container.style.height = height + 'px';
            }
        } catch (e) {}
    }, 300);
}

// ====================
// API PÚBLICA
// ====================

window.CIBNavegacion = {
    cambiarModulo,
    guardarDatosModuloActual,
    cargarDatosEnModulo,
    limpiarModuloActual,
    nuevoPaciente,
    finalizarIngreso,
    descargarTSV,
    descargarTXT,
    mostrarVistaPrevia
};

// --------------------------------------------
// 4. EXPONER SESIÓN PARA OTROS MÓDULOS 
// --------------------------------------------
window.getSessionUser = function () {
    return window._sessionUser || null;
};
