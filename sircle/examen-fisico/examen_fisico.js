// ===========================================
// MÓDULO EXAMEN FÍSICO - MÚLTIPLES DÍAS
// ===========================================

// Objeto para almacenar las opciones cargadas desde PHP
let opcionesExamen = {};
let todasLasOpciones = [];

// Contador de bloques (se actualizará automáticamente)
let contadorBloques = 1;

// ========== FUNCIONES DE FECHA ==========
function obtenerFechaHoraActual() {
    const ahora = new Date();
    const opcionesFecha = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const fecha = ahora.toLocaleDateString('es-ES', opcionesFecha);
    const hora = ahora.toLocaleTimeString('es-ES', opcionesHora);
    return `${fecha} - ${hora}`;
}

function actualizarFechaBloque(bloque, numeroBloque) {
    const fechaSpan = bloque.querySelector('.fecha-texto');
    if (fechaSpan) {
        fechaSpan.textContent = `Día ${numeroBloque} - ${obtenerFechaHoraActual()}`;
    }
}

// ========== INICIALIZACIÓN Y CARGA DE OPCIONES ==========
fetch('../listas/opciones_examen_fisico.json')
    .then(response => response.json())
    .then(data => {
        opcionesExamen = data;
        prepararOpcionesParaBusqueda();
        crearDatalists();
        inicializarEventosAutocomplete();
        inicializarEventosToggle();
        
        // Actualizar fecha del primer bloque
        const primerBloque = document.querySelector('tbody.bloque-dia[data-bloque="1"]');
        if (primerBloque) {
            actualizarFechaBloque(primerBloque, 1);
        }
        
        // Configurar botón duplicar
        const btnDuplicar = document.getElementById('duplicar-examen');
        if (btnDuplicar) btnDuplicar.addEventListener('click', duplicarTodos);
        
        console.log('Módulo Examen Físico listo');
    })
    .catch(error => {
        console.error('Error cargando opciones:', error);
        alert('Error al cargar las opciones. Recarga la página.');
    });

function prepararOpcionesParaBusqueda() {
    todasLasOpciones = [];
    for (const [tipo, opcionesArray] of Object.entries(opcionesExamen)) {
        opcionesArray.forEach(opcion => {
            if (opcion.value && opcion.display) {
                const textoLimpio = opcion.display.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                todasLasOpciones.push({
                    tipo: tipo,
                    value: opcion.value,
                    display: opcion.display,
                    textoLimpio: textoLimpio
                });
            }
        });
    }
}

function crearDatalists() {
    const datalistGlobal = document.getElementById('opciones-global');
    if (datalistGlobal) datalistGlobal.innerHTML = '';
    
    for (const [tipo, opcionesArray] of Object.entries(opcionesExamen)) {
        const datalistId = `${tipo}_opciones`;
        const datalist = document.getElementById(datalistId);
        if (datalist) {
            datalist.innerHTML = '';
            opcionesArray.forEach(opcion => {
                if (opcion.value) {
                    const option = document.createElement('option');
                    option.value = opcion.display.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                    option.dataset.value = opcion.value;
                    option.dataset.tipo = tipo;
                    datalist.appendChild(option);
                    
                    if (datalistGlobal) {
                        const optionGlobal = document.createElement('option');
                        optionGlobal.value = option.value;
                        optionGlobal.dataset.value = opcion.value;
                        optionGlobal.dataset.tipo = tipo;
                        datalistGlobal.appendChild(optionGlobal);
                    }
                }
            });
        }
    }
}

// ========== EVENTOS DE AUTOCOMPLETE Y TOGGLE ==========
function inicializarEventosAutocomplete() {
    document.querySelectorAll('.input-autocomplete').forEach(input => {
        configurarEventosInputAutocomplete(input);
    });
}

function configurarEventosInputAutocomplete(input) {
    input.removeEventListener('input', manejarInputAutocomplete);
    input.removeEventListener('blur', manejarBlurAutocomplete);
    input.removeEventListener('keydown', manejarKeydownAutocomplete);
    
    input.addEventListener('input', manejarInputAutocomplete);
    input.addEventListener('blur', manejarBlurAutocomplete);
    input.addEventListener('keydown', manejarKeydownAutocomplete);
}

function manejarInputAutocomplete(e) {
    const input = e.target;
    const valorIngresado = input.value;
    const targetId = input.getAttribute('data-target');
    const targetInput = document.getElementById(targetId);
    const tipo = input.getAttribute('list').replace('_opciones', '');
    
    if (!targetInput) return;
    
    const opcionesTipo = opcionesExamen[tipo] || [];
    const opcionEncontrada = opcionesTipo.find(opcion => 
        opcion.display.replace(/&lt;/g, '<').replace(/&gt;/g, '>') === valorIngresado
    );
    
    if (opcionEncontrada) {
        targetInput.value = opcionEncontrada.value;
        if (input.classList.contains('toggle')) {
            input.dispatchEvent(new Event('change'));
        }
    } else {
        targetInput.value = '';
        if (input.classList.contains('toggle') && valorIngresado === '') {
            const targetSelector = input.getAttribute('data-target-toggle');
            if (targetSelector) {
                const targetField = input.parentElement.querySelector(targetSelector);
                if (targetField) {
                    targetField.classList.add('oculto');
                    targetField.value = '';
                }
            }
        }
    }
}

function manejarBlurAutocomplete(e) {
    const input = e.target;
    setTimeout(() => {
        const valorIngresado = input.value;
        const targetId = input.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        const tipo = input.getAttribute('list').replace('_opciones', '');
        
        if (!valorIngresado && targetInput) targetInput.value = '';
        
        if (valorIngresado && targetInput && targetInput.value === '') {
            const opcionesTipo = opcionesExamen[tipo] || [];
            const existe = opcionesTipo.some(opcion => 
                opcion.display.replace(/&lt;/g, '<').replace(/&gt;/g, '>') === valorIngresado
            );
            if (!existe) {
                input.value = '';
                if (input.classList.contains('toggle')) {
                    const targetSelector = input.getAttribute('data-target-toggle');
                    if (targetSelector) {
                        const targetField = input.parentElement.querySelector(targetSelector);
                        if (targetField) {
                            targetField.classList.add('oculto');
                            targetField.value = '';
                        }
                    }
                }
            }
        }
    }, 100);
}

function manejarKeydownAutocomplete(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const input = e.target;
        const valor = input.value.toLowerCase();
        if (!valor) return;
        const tipo = input.getAttribute('list').replace('_opciones', '');
        const opcionesTipo = opcionesExamen[tipo] || [];
        const opcionEncontrada = opcionesTipo.find(opcion => 
            opcion.display.replace(/&lt;/g, '<').replace(/&gt;/g, '>').toLowerCase().includes(valor)
        );
        if (opcionEncontrada) {
            input.value = opcionEncontrada.display.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            const targetId = input.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) targetInput.value = opcionEncontrada.value;
            input.dispatchEvent(new Event('input'));
        }
    }
}

function inicializarEventosToggle() {
    document.querySelectorAll(".input-autocomplete.toggle").forEach(input => {
        input.removeEventListener('change', manejarChangeToggle);
        input.addEventListener('change', manejarChangeToggle);
        
        // Disparar change inicial si ya tiene valor
        const targetId = input.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        if (targetInput && targetInput.value) {
            input.dispatchEvent(new Event('change'));
        }
    });
}

function manejarChangeToggle(e) {
    const input = e.target;
    const targetSelector = input.getAttribute('data-target-toggle');
    const showValue = input.getAttribute('data-show-value');
    const hideValue = input.getAttribute('data-hide-value');
    if (!targetSelector) return;
    
    const target = input.parentElement.querySelector(targetSelector);
    if (!target) return;
    
    const targetId = input.getAttribute('data-target');
    const targetInput = document.getElementById(targetId);
    if (!targetInput) return;
    
    const valorSeleccionado = targetInput.value;
    let mostrar = false;
    
    if (showValue !== undefined && showValue !== null) {
        mostrar = valorSeleccionado === showValue;
    }
    if (hideValue !== undefined && hideValue !== null) {
        mostrar = (valorSeleccionado !== hideValue && valorSeleccionado !== "");
    }
    
    if (mostrar) {
        target.classList.remove("oculto");
        target.focus();
    } else {
        target.classList.add("oculto");
        target.value = "";
    }
}

// ========== DUPLICAR BLOQUES ==========
function duplicarTodos() {
    const tabla = document.querySelector('.examen-fisico');
    const bloques = document.querySelectorAll('tbody.bloque-dia');
    if (bloques.length === 0) return;
    
    const ultimoBloque = bloques[bloques.length - 1];
    const nuevoIndice = bloques.length + 1;
    const nuevoBloque = ultimoBloque.cloneNode(true);
    
    // Actualizar atributos del bloque
    nuevoBloque.classList.add('bloque-dia');
    nuevoBloque.setAttribute('data-bloque', nuevoIndice);
    
    // Actualizar fecha
    actualizarFechaBloque(nuevoBloque, nuevoIndice);
    
    // Renombrar todos los inputs, selects, textareas dentro del bloque
    const campos = nuevoBloque.querySelectorAll('input, select, textarea');
    campos.forEach(campo => {
        if (campo.name) {
            campo.name = campo.name.replace(/_(bloque\d+)$/, '') + `_bloque${nuevoIndice}`;
        }
        if (campo.id) {
            campo.id = campo.id.replace(/_(bloque\d+)$/, '') + `_bloque${nuevoIndice}`;
        }
        // Limpiar valores
        if (campo.tagName === 'SELECT') {
            campo.selectedIndex = 0;
        } else if (campo.type === 'time') {
            campo.value = '';
        } else if (campo.type === 'text' || campo.tagName === 'TEXTAREA') {
            campo.value = '';
        }
        // No limpiar hidden porque se llenan con el autocomplete
    });
    
    // Resetear toggles (ocultar campos condicionales)
    nuevoBloque.querySelectorAll('.input-autocomplete.toggle').forEach(input => {
        const targetSelector = input.getAttribute('data-target-toggle');
        if (targetSelector) {
            const target = input.parentElement.querySelector(targetSelector);
            if (target) target.classList.add('oculto');
        }
        // Limpiar el input visible y el hidden asociado
        const targetId = input.getAttribute('data-target');
        if (targetId) {
            const hidden = nuevoBloque.querySelector(`#${targetId}`);
            if (hidden) hidden.value = '';
        }
        input.value = '';
    });
    
    // Reconfigurar eventos en el nuevo bloque
    nuevoBloque.querySelectorAll('.input-autocomplete').forEach(input => {
        configurarEventosInputAutocomplete(input);
    });
    nuevoBloque.querySelectorAll(".input-autocomplete.toggle").forEach(input => {
        input.addEventListener('change', manejarChangeToggle);
    });
    
    // Insertar el nuevo bloque
    tabla.appendChild(nuevoBloque);
    
    // Desplazar hacia el nuevo bloque
    nuevoBloque.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log(`Nuevo bloque día ${nuevoIndice} creado`);
}

// ========== OBTENER DATOS DE TODOS LOS BLOQUES ==========
function obtenerDatosExamenFisico() {
    const bloques = document.querySelectorAll('tbody.bloque-dia');
    const datos = {
        timestamp: new Date().toISOString(),
        bloques: []
    };
    
    bloques.forEach((bloque, idx) => {
        const fechaSpan = bloque.querySelector('.fecha-texto');
        const fechaHora = fechaSpan ? fechaSpan.textContent : `Día ${idx+1}`;
        const campos = {};
        
        // Recorrer todos los inputs, selects y textareas (excluyendo fecha y títulos)
        bloque.querySelectorAll('input, select, textarea').forEach(campo => {
            if (campo.name) {
                campos[campo.name] = campo.value;
            }
        });
        
        datos.bloques.push({
            numero: idx+1,
            fechaHora: fechaHora,
            campos: campos
        });
    });
    
    return datos;
}

// ========== CARGAR DATOS EXTERNOS ==========
function cargarDatosExamenFisico(datosExternos) {
    if (!datosExternos || !datosExternos.bloques) return;
    
    // Eliminar bloques adicionales, dejar solo el primero
    const tabla = document.querySelector('.examen-fisico');
    const bloques = document.querySelectorAll('tbody.bloque-dia');
    for (let i = 1; i < bloques.length; i++) {
        bloques[i].remove();
    }
    
    // Limpiar el primer bloque
    const primerBloque = document.querySelector('tbody.bloque-dia[data-bloque="1"]');
    if (primerBloque) {
        limpiarBloque(primerBloque);
        if (datosExternos.bloques[0]) {
            cargarCamposEnBloque(primerBloque, datosExternos.bloques[0].campos);
            const fechaSpan = primerBloque.querySelector('.fecha-texto');
            if (fechaSpan && datosExternos.bloques[0].fechaHora) {
                fechaSpan.textContent = datosExternos.bloques[0].fechaHora;
            }
        }
    }
    
    // Crear y cargar bloques adicionales
    for (let i = 1; i < datosExternos.bloques.length; i++) {
        duplicarTodos(); // crea bloque vacío
        const nuevoBloque = document.querySelector(`tbody.bloque-dia:last-child`);
        if (nuevoBloque && datosExternos.bloques[i]) {
            cargarCamposEnBloque(nuevoBloque, datosExternos.bloques[i].campos);
            const fechaSpan = nuevoBloque.querySelector('.fecha-texto');
            if (fechaSpan && datosExternos.bloques[i].fechaHora) {
                fechaSpan.textContent = datosExternos.bloques[i].fechaHora;
            } else if (fechaSpan) {
                // Si no hay fecha guardada, mantener la actual (la que puso duplicar)
            }
        }
    }
}

function limpiarBloque(bloque) {
    bloque.querySelectorAll('input, select, textarea').forEach(campo => {
        if (campo.type === 'checkbox' || campo.type === 'radio') {
            campo.checked = false;
        } else if (campo.tagName === 'SELECT') {
            campo.selectedIndex = 0;
        } else {
            campo.value = '';
        }
    });
    // Ocultar campos toggle
    bloque.querySelectorAll('.input-autocomplete.toggle').forEach(input => {
        const targetSelector = input.getAttribute('data-target-toggle');
        if (targetSelector) {
            const target = input.parentElement.querySelector(targetSelector);
            if (target) target.classList.add('oculto');
        }
        input.value = '';
        const targetId = input.getAttribute('data-target');
        if (targetId) {
            const hidden = bloque.querySelector(`#${targetId}`);
            if (hidden) hidden.value = '';
        }
    });
}

function cargarCamposEnBloque(bloque, campos) {
    for (const [nombre, valor] of Object.entries(campos)) {
        const campo = bloque.querySelector(`[name="${nombre}"]`);
        if (campo) {
            campo.value = valor;
            // Si es input autocomplete, buscar el display correspondiente
            if (campo.classList && campo.classList.contains('input-autocomplete')) {
                const targetId = campo.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                if (targetInput && targetInput.value === valor) {
                    const tipo = campo.getAttribute('list').replace('_opciones', '');
                    const opcionesTipo = opcionesExamen[tipo] || [];
                    const opcion = opcionesTipo.find(op => op.value === valor);
                    if (opcion) {
                        campo.value = opcion.display.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                        if (campo.classList.contains('toggle')) {
                            campo.dispatchEvent(new Event('input'));
                            campo.dispatchEvent(new Event('change'));
                        }
                    }
                }
            }
        }
    }
    // Disparar toggles después de cargar
    bloque.querySelectorAll('.input-autocomplete.toggle').forEach(input => {
        input.dispatchEvent(new Event('change'));
    });
}

// ========== EXPORTAR FUNCIONES PARA USO EXTERNO ==========
window.ModuloExamenFisico = {
    obtenerDatos: obtenerDatosExamenFisico,
    cargarDatos: cargarDatosExamenFisico,
    duplicar: duplicarTodos
};

window.obtenerDatosFormulario = obtenerDatosExamenFisico;
window.cargarDatosFormulario = cargarDatosExamenFisico;

// Inicialización adicional cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // El fetch ya se encarga de la inicialización principal
});
