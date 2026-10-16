// ===========================================
// MÓDULO DE INDICACIONES MÉDICAS
// ===========================================

let medicamentos = [];
let regímenes = [];
let reposos = [];

// ==========================
// INICIALIZACIÓN
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Módulo de Indicaciones Médicas cargado');

    // Medicamentos
    document.getElementById('agregar-medicamento').addEventListener('click', agregarMedicamento);
    document.getElementById('ver-medicamentos').addEventListener('click', () => abrirModal('medicamentos'));

    // Régimen
    document.getElementById('agregar-regimen').addEventListener('click', agregarRegimen);
    document.getElementById('ver-regimenes').addEventListener('click', () => abrirModal('regimenes'));

    // Reposo
    document.getElementById('agregar-reposo').addEventListener('click', agregarReposo);
    document.getElementById('ver-reposos').addEventListener('click', () => abrirModal('reposos'));

    // Kinesioterapia
    document.querySelectorAll('input[name="kinesioterapia-tipo"]')
        .forEach(cb => cb.addEventListener('change', validarKinesioterapia));
});

// ==========================
// FUNCIONES PARA RÉGIMEN
// ==========================
function agregarRegimen() {
    const tipo = document.getElementById('regimen-type').value.trim();
    const horario = document.getElementById('regimen-horario').value.trim();
    const frecuencia = document.getElementById('regimen-frecuencia').value.trim();

    if (!tipo) {
        alert('Seleccione el tipo de régimen.');
        return;
    }

    regímenes.push({ 
        tipo, 
        horario: horario || 'No especificado', 
        frecuencia: frecuencia || 'No especificado' 
    });

    limpiarCamposRegimen();
    actualizarBoton('regimenes');
}

function limpiarCamposRegimen() {
    document.getElementById('regimen-type').value = '';
    document.getElementById('regimen-horario').value = '';
    document.getElementById('regimen-frecuencia').value = '';
}

function actualizarBoton(tipo) {
    const btn = document.getElementById(`ver-${tipo}`);
    let tieneDatos = false;
    
    switch(tipo) {
        case 'medicamentos': tieneDatos = medicamentos.length > 0; break;
        case 'regimenes': tieneDatos = regímenes.length > 0; break;
        case 'reposos': tieneDatos = reposos.length > 0; break;
    }
    
    btn.style.display = tieneDatos ? 'inline-flex' : 'none';
}

// ==========================
// FUNCIONES PARA REPOSO
// ==========================
function agregarReposo() {
    const tipo = document.getElementById('reposo-tipo').value.trim();
    const horario = document.getElementById('reposo-horario').value.trim();
    const frecuencia = document.getElementById('reposo-frecuencia').value.trim();

    if (!tipo) {
        alert('Seleccione el tipo de reposo.');
        return;
    }

    reposos.push({ 
        tipo, 
        horario: horario || 'No especificada', 
        frecuencia: frecuencia || 'No especificadas' 
    });

    limpiarCamposReposo();
    actualizarBoton('reposos');
}

function limpiarCamposReposo() {
    document.getElementById('reposo-tipo').value = '';
    document.getElementById('reposo-horario').value = '';
    document.getElementById('reposo-frecuencia').value = '';
}

// ==========================
// FUNCIONES PARA MEDICAMENTOS
// ==========================
function agregarMedicamento() {
    const nombre = document.getElementById('medicamento-nombre').value.trim();
    const dosis = document.getElementById('medicamento-dosis').value.trim();
    const via = document.getElementById('medicamento-via').value;
    const frecuencia = document.getElementById('medicamento-frecuencia').value;

    if (!nombre || !dosis || !via || !frecuencia) {
        alert('Complete todos los campos del medicamento.');
        return;
    }

    medicamentos.push({ nombre, dosis, via, frecuencia });
    limpiarCamposMedicamento();
    actualizarBoton('medicamentos');
}

function limpiarCamposMedicamento() {
    document.getElementById('medicamento-nombre').value = '';
    document.getElementById('medicamento-dosis').value = '';
    document.getElementById('medicamento-via').value = '';
    document.getElementById('medicamento-frecuencia').value = '';
}

// ==========================
// FUNCIONES DE MODALES
// ==========================
function abrirModal(tipo) {
    renderModal(tipo);
    document.getElementById(`modal-${tipo}`).style.display = 'flex';
}

function cerrarModal(tipo) {
    document.getElementById(`modal-${tipo}`).style.display = 'none';
}

function renderModal(tipo) {
    let tbody, datos, columnas;
    
    switch(tipo) {
        case 'medicamentos':
            tbody = document.getElementById('modal-tabla-medicamentos');
            datos = medicamentos;
            columnas = ['nombre', 'dosis', 'via', 'frecuencia'];
            break;
        case 'regimenes':
            tbody = document.getElementById('modal-tabla-regimenes');
            datos = regímenes;
            columnas = ['tipo', 'horario', 'frecuencia'];
            break;
        case 'reposos':
            tbody = document.getElementById('modal-tabla-reposos');
            datos = reposos;
            columnas = ['tipo', 'horario', 'frecuencia'];
            break;
        default:
            return;
    }
    
    tbody.innerHTML = '';
    
    datos.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        // Crear celdas según el tipo de modal
        columnas.forEach(col => {
            const td = document.createElement('td');
            
            if (tipo === 'medicamentos' && col === 'via') {
                td.innerHTML = `<select onchange="editarItem('${tipo}', ${index}, '${col}', this.value)">
                    ${opcionesVia(item[col])}
                </select>`;
            } else if (tipo === 'medicamentos' && col === 'frecuencia') {
                td.innerHTML = `<select onchange="editarItem('${tipo}', ${index}, '${col}', this.value)">
                    ${opcionesFrecuencia(item[col])}
                </select>`;
            } else if ((tipo === 'regimenes' || tipo === 'reposos') && col === 'tipo') {
                // PARA RÉGIMEN Y REPOSO: Mostrar texto legible pero guardar el value
                const textoVisible = obtenerTextoVisible(tipo, item[col]);
                td.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="flex: 1;">${textoVisible}</span>
                        <button class="btn-icon edit" onclick="editarTipoModal('${tipo}', ${index})" 
                                title="Editar tipo" style="font-size: 0.8rem;">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                `;
            } else {
                td.innerHTML = `<input type="text" value="${item[col]}" 
                    onchange="editarItem('${tipo}', ${index}, '${col}', this.value)" 
                    style="width: 100%;">`;
            }
            
            tr.appendChild(td);
        });
        
        // Celda de acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.innerHTML = `
            <button class="btn btn-danger btn-small" onclick="eliminarItem('${tipo}', ${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
}

// Nueva función para obtener texto visible
function obtenerTextoVisible(tipo, valor) {
    if (tipo === 'regimenes') {
        const regimenMap = {
            'dieta_basal': 'Dieta basal',
            'dieta_absoluta': 'Dieta absoluta',
            'dieta_hiposodica': 'Dieta hiposódica',
            'dieta_normoproteica': 'Dieta normoproteica',
            'dieta_hiperproteica': 'Dieta hiperproteica',
            'dieta_diabetes': 'Dieta para diabetes',
            'dieta_sin_gluten': 'Exento de gluten',
            'dieta_sin_lactosa': 'Sin lactosa',
            'tolerancia_liquidos': 'Tolerancia a líquidos',
            'liquido_normal': 'Líquido normal',
            'dieta_semiliquida': 'Semilíquida',
            'dieta_semiblanda': 'Semiblanda',
            'otro': 'Otro'
        };
        return regimenMap[valor] || valor;
    } else if (tipo === 'reposos') {
        const reposoMap = {
            'absoluto': 'Absoluto',
            'relativo': 'Relativo',
            'relativo_asistido': 'Relativo asistido',
            'otro': 'Otro'
        };
        return reposoMap[valor] || valor;
    }
    return valor;
}

function editarItem(tipo, index, campo, valor) {
    switch(tipo) {
        case 'medicamentos': medicamentos[index][campo] = valor; break;
        case 'regimenes': regímenes[index][campo] = valor; break;
        case 'reposos': reposos[index][campo] = valor; break;
    }
}

function eliminarItem(tipo, index) {
    if (!confirm('¿Eliminar este elemento?')) return;
    
    switch(tipo) {
        case 'medicamentos': medicamentos.splice(index, 1); break;
        case 'regimenes': regímenes.splice(index, 1); break;
        case 'reposos': reposos.splice(index, 1); break;
    }
    
    renderModal(tipo);
    actualizarBoton(tipo);
    
    // Cerrar modal si no hay elementos
    let tieneElementos = false;
    switch(tipo) {
        case 'medicamentos': tieneElementos = medicamentos.length > 0; break;
        case 'regimenes': tieneElementos = regímenes.length > 0; break;
        case 'reposos': tieneElementos = reposos.length > 0; break;
    }
    
    if (!tieneElementos) {
        cerrarModal(tipo);
    }
}

// ==========================
// FUNCIONES PARA EDITAR TIPOS EN MODAL EMERGENTE
// ==========================

function editarTipoModal(tipo, index) {
    let selectHTML = '';
    let valorActual = '';
    
    if (tipo === 'regimenes') {
        valorActual = regímenes[index].tipo;
        selectHTML = `
            <select id="edit-tipo-select" style="width: 100%; padding: 8px;">
                <optgroup label="Dietas Especiales">
                    <option value="dieta_basal">Dieta basal</option>
                    <option value="dieta_absoluta">Dieta absoluta</option>
                    <option value="dieta_hiposodica">Dieta hiposódica</option>
                    <option value="dieta_normoproteica">Dieta normoproteica</option>
                    <option value="dieta_hiperproteica">Dieta hiperproteica</option>
                    <option value="dieta_diabetes">Dieta para diabetes</option>
                    <option value="dieta_sin_gluten">Exento de gluten</option>
                    <option value="dieta_sin_lactosa">Sin lactosa</option>
                </optgroup>
                <optgroup label="Líquidos">
                    <option value="tolerancia_liquidos">Tolerancia a líquidos</option>
                    <option value="liquido_normal">Líquido normal</option>
                </optgroup>
                <optgroup label="Semilíquidos">
                    <option value="dieta_semiliquida">Semilíquida</option>
                </optgroup>
                <optgroup label="Blandos">
                    <option value="dieta_semiblanda">Semiblanda</option>
                </optgroup>
                <option value="otro">Otro (especificar)</option>
            </select>
        `;
    } else if (tipo === 'reposos') {
        valorActual = reposos[index].tipo;
        selectHTML = `
            <select id="edit-tipo-select" style="width: 100%; padding: 8px;">
                <option value="absoluto">Absoluto</option>
                <option value="relativo">Relativo</option>
                <option value="relativo_asistido">Relativo asistido</option>
                <option value="otro">Otro (especificar)</option>
            </select>
        `;
    }
    
    // Crear modal simple
    const modalHTML = `
        <div id="edit-tipo-modal" style="
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 20px;
                border-radius: 8px;
                min-width: 300px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            ">
                <h4 style="margin-bottom: 15px;">Editar tipo</h4>
                ${selectHTML}
                <div style="margin-top: 20px; text-align: right;">
                    <button onclick="cancelarEditarTipo()" style="
                        padding: 8px 16px;
                        margin-right: 10px;
                        background: #e2e8f0;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Cancelar</button>
                    <button onclick="guardarEditarTipo('${tipo}', ${index})" style="
                        padding: 8px 16px;
                        background: var(--success-color);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Guardar</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al body
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
    
    // Seleccionar el valor actual
    const select = document.getElementById('edit-tipo-select');
    if (select) {
        select.value = valorActual;
    }
}

function guardarEditarTipo(tipo, index) {
    const select = document.getElementById('edit-tipo-select');
    if (!select) return;
    
    const nuevoValor = select.value;
    
    if (tipo === 'regimenes') {
        regímenes[index].tipo = nuevoValor;
    } else if (tipo === 'reposos') {
        reposos[index].tipo = nuevoValor;
    }
    
    // Remover modal
    const modal = document.getElementById('edit-tipo-modal');
    if (modal && modal.parentNode) {
        modal.parentNode.remove();
    }
    
    // Re-renderizar el modal principal
    renderModal(tipo);
}

function cancelarEditarTipo() {
    const modal = document.getElementById('edit-tipo-modal');
    if (modal && modal.parentNode) {
        modal.parentNode.remove();
    }
}

// ==========================
// SELECTS DINÁMICOS
// ==========================
function opcionesVia(sel) {
    const vias = [
        ['oral', 'Oral'],
        ['ev', 'Endovenosa'],
        ['im', 'Intramuscular'],
        ['sc', 'Subcutánea'],
        ['topica', 'Tópica'],
        ['inhalatoria', 'Inhalatoria'],
        ['rectal', 'Rectal'],
        ['otra', 'Otra']
    ];

    return vias.map(v =>
        `<option value="${v[0]}" ${v[0] === sel ? 'selected' : ''}>${v[1]}</option>`
    ).join('');
}

function opcionesFrecuencia(sel) {
    const frecs = [
        ['cada_6h', 'Cada 6 horas'],
        ['cada_8h', 'Cada 8 horas'],
        ['cada_12h', 'Cada 12 horas'],
        ['cada_24h', 'Cada 24 horas'],
        ['cada_48h', 'Cada 48 horas'],
        ['unica_dosis', 'Dosis única'],
        ['segun_necesidad', 'Según necesidad'],
        ['continuo', 'Infusión continua']
    ];

    return frecs.map(f =>
        `<option value="${f[0]}" ${f[0] === sel ? 'selected' : ''}>${f[1]}</option>`
    ).join('');
}

// ==========================
// KINESIOTERAPIA
// ==========================
function validarKinesioterapia() {
    const checkboxes = document.querySelectorAll('input[name="kinesioterapia-tipo"]');
    const ambas = document.querySelector('input[value="ambas"]');

    if (ambas.checked) {
        checkboxes.forEach(cb => {
            if (cb !== ambas) {
                cb.checked = false;
                cb.disabled = true;
            }
        });
    } else {
        checkboxes.forEach(cb => cb.disabled = false);
    }
}

// ==========================
// FORMULARIO GENERAL
// ==========================
function limpiarFormulario() {
    if (!confirm('¿Limpiar todas las indicaciones médicas?')) return;

    // Limpiar campos de entrada
    document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.type === 'checkbox') {
            el.checked = false;
            el.disabled = false;
        } else {
            el.value = '';
        }
    });

    // Limpiar arrays
    medicamentos = [];
    regímenes = [];
    reposos = [];

    // Ocultar botones de ver
    actualizarBoton('medicamentos');
    actualizarBoton('regimenes');
    actualizarBoton('reposos');

    // Cerrar modales si están abiertos
    cerrarModal('medicamentos');
    cerrarModal('regimenes');
    cerrarModal('reposos');
}

function obtenerDatosFormulario() {
    console.log('Obteniendo datos de indicaciones...');
    
    // Kinesioterapia
    const kineCheckboxes = document.querySelectorAll('input[name="kinesioterapia-tipo"]:checked');
    const kineTipos = Array.from(kineCheckboxes).map(cb => cb.value);
    
    return {
        regimen: {
            regímenes: regímenes,
            total: regímenes.length
        },
        reposo: {
            reposos: reposos,
            total: reposos.length
        },
        farmacoterapia: {
            medicamentos: medicamentos,
            total: medicamentos.length
        },
        kinesioterapia: {
            tipos: kineTipos,
            total: kineTipos.length
        },
        timestamp: new Date().toISOString()
    };
}

// ==========================
// COMUNICACIÓN CON SISTEMA PRINCIPAL
// ==========================
const MODULO_ID = 'indicaciones';

function enviarDatosANavegacion(datos) {
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'DATOS_GUARDADOS',
                datos: datos,
                modulo: MODULO_ID,
                timestamp: new Date().toISOString()
            }, '*');
            console.log('✅ Datos enviados a navegación');
        }
    } catch (error) {
        console.error('❌ Error enviando datos:', error);
    }
}

// Escuchar mensajes del sistema de navegación
window.addEventListener('message', function(event) {
    if (event.data && event.data.type) {
        console.log(`📨 Mensaje recibido:`, event.data.type);
        
        switch(event.data.type) {
            case 'OBTENER_DATOS':
                enviarDatosANavegacion(obtenerDatosFormulario());
                break;
                
            case 'CARGAR_DATOS':
                if (event.data.datos && event.data.modulo === MODULO_ID) {
                    cargarDatosFormulario(event.data.datos);
                }
                break;
                
            case 'LIMPIAR_FORMULARIO':
                limpiarFormulario();
                break;
        }
    }
});

function cargarDatosFormulario(datos) {
    console.log('Cargando datos en formulario:', datos);
    
    // Cargar regímenes
    if (datos.regimen && Array.isArray(datos.regimen.regímenes)) {
        regímenes = datos.regimen.regímenes;
        actualizarBoton('regimenes');
    }
    
    // Cargar reposos
    if (datos.reposo && Array.isArray(datos.reposo.reposos)) {
        reposos = datos.reposo.reposos;
        actualizarBoton('reposos');
    }
    
    // Cargar medicamentos
    if (datos.farmacoterapia && Array.isArray(datos.farmacoterapia.medicamentos)) {
        medicamentos = datos.farmacoterapia.medicamentos;
        actualizarBoton('medicamentos');
    }
    
    // Cargar kinesioterapia
    if (datos.kinesioterapia && Array.isArray(datos.kinesioterapia.tipos)) {
        document.querySelectorAll('input[name="kinesioterapia-tipo"]')
            .forEach(cb => {
                cb.checked = datos.kinesioterapia.tipos.includes(cb.value);
            });
        validarKinesioterapia();
    }
}

// ==========================
// NOTIFICACIÓN DE ALTURA
// ==========================
function notificarCambioAltura() {
    try {
        const altura = document.body.scrollHeight;
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'ALTURA_CAMBIADA',
                altura: altura,
                modulo: MODULO_ID
            }, '*');
        }
    } catch (error) {
        // Ignorar errores
    }
}

// Configurar observadores de cambios
function configurarObservadoresComunicacion() {
    // Observar cambios en el DOM
    const observer = new MutationObserver(function() {
        notificarCambioAltura();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });
    
    // Observar cambios en inputs
    document.addEventListener('input', notificarCambioAltura);
    document.addEventListener('change', notificarCambioAltura);
    
    // Notificar altura inicial
    setTimeout(notificarCambioAltura, 500);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    configurarObservadoresComunicacion();
});

// ==========================
// EXPORTAR FUNCIONES GLOBALES
// ==========================
window.IndicacionesMedicas = {
    obtenerDatosFormulario,
    limpiarFormulario,
    cargarDatosFormulario
};

window.obtenerDatosFormulario = obtenerDatosFormulario;
window.limpiarFormulario = limpiarFormulario;
window.cargarDatosFormulario = cargarDatosFormulario;
window.cerrarModal = cerrarModal;
window.editarTipoModal = editarTipoModal;
window.guardarEditarTipo = guardarEditarTipo;
window.cancelarEditarTipo = cancelarEditarTipo;