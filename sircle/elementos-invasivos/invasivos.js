// ===========================================
// MÓDULO DE ELEMENTOS INVASIVOS - MÚLTIPLES DÍAS CON FECHA/HORA
// ===========================================

let contadorBloques = 1;  // el bloque inicial es el 1

// Función para obtener fecha y hora formateada
function obtenerFechaHoraActual() {
    const ahora = new Date();
    const opcionesFecha = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const fecha = ahora.toLocaleDateString('es-ES', opcionesFecha);
    const hora = ahora.toLocaleTimeString('es-ES', opcionesHora);
    return `${fecha} - ${hora}`;
}

// Actualizar la fecha mostrada en un bloque específico
function actualizarFechaBloque(bloque, numeroBloque) {
    const fechaSpan = bloque.querySelector('.fecha-texto');
    if (fechaSpan) {
        fechaSpan.textContent = `Día ${numeroBloque} - ${obtenerFechaHoraActual()}`;
    }
}

// Inicialización
function inicializarModulo() {
    console.log('Módulo de Elementos Invasivos (múltiples días) cargado');
    
    // Actualizar fecha del primer bloque con la fecha/hora actual
    const primerBloque = document.querySelector('tbody.bloque-dia[data-bloque="1"]');
    if (primerBloque) {
        actualizarFechaBloque(primerBloque, 1);
    }
    
    // Configurar eventos de instalación en todas las filas existentes
    configurarListenersInstalacion();
    
    // Botón duplicar
    const btnDuplicar = document.getElementById('duplicar-todos');
    if (btnDuplicar) btnDuplicar.addEventListener('click', duplicarTodos);
    
    // Botones de limpiar/guardar
    if (document.getElementById('limpiar-elementos')) {
        document.getElementById('limpiar-elementos').addEventListener('click', () => limpiarTodo(true));
    }
    if (document.getElementById('guardar-elementos')) {
        document.getElementById('guardar-elementos').addEventListener('click', guardarElementos);
    }
    
    // Listener para campos "otro"
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('calibre-select') || e.target.classList.contains('ubicacion-select')) {
            if (e.target.value === 'otro' || e.target.value === 'otra') {
                mostrarCampoAlternativo(e.target);
            } else {
                ocultarCampoAlternativo(e.target);
            }
        }
    });
}

// Configurar eventos de cambio en selects de instalación
function configurarListenersInstalacion() {
    document.querySelectorAll('.instalado-select').forEach(select => {
        select.removeEventListener('change', manejarCambioInstalacion);
        select.addEventListener('change', manejarCambioInstalacion);
    });
}

function manejarCambioInstalacion(e) {
    const select = e.target;
    const fila = select.closest('.elemento-row');
    const instalado = select.value === 'si';
    
    const campos = fila.querySelectorAll('input, select:not(.instalado-select)');
    campos.forEach(campo => {
        campo.disabled = !instalado;
        if (!instalado) {
            if (campo.tagName === 'SELECT') campo.selectedIndex = 0;
            else campo.value = '';
        }
    });
    
    if (instalado) fila.classList.add('active');
    else fila.classList.remove('active');
}

function mostrarCampoAlternativo(select) {
    const td = select.closest('td');
    const tipo = select.classList.contains('calibre-select') ? 'calibre' : 'ubicacion';
    if (!td.querySelector(`.alternativo-${tipo}`)) {
        const inputAlt = document.createElement('input');
        inputAlt.type = 'text';
        inputAlt.className = `alternativo-${tipo}`;
        inputAlt.placeholder = 'Especifique...';
        inputAlt.style.marginTop = '5px';
        inputAlt.style.width = '100%';
        inputAlt.style.padding = '0.3rem';
        select.parentNode.appendChild(inputAlt);
    }
}

function ocultarCampoAlternativo(select) {
    const td = select.closest('td');
    const tipo = select.classList.contains('calibre-select') ? 'calibre' : 'ubicacion';
    const alt = td.querySelector(`.alternativo-${tipo}`);
    if (alt) alt.remove();
}

// ===========================================
// DUPLICAR TODO EL ÚLTIMO BLOQUE (DÍA)
// ===========================================
function duplicarTodos() {
    const tabla = document.querySelector('.invasive-table');
    const bloques = document.querySelectorAll('tbody.bloque-dia');
    if (bloques.length === 0) return;
    
    const ultimoBloque = bloques[bloques.length - 1];
    const nuevoIndice = bloques.length + 1;
    
    const nuevoBloque = ultimoBloque.cloneNode(true);
    nuevoBloque.classList.add('bloque-dia');
    nuevoBloque.setAttribute('data-bloque', nuevoIndice);
    
    actualizarFechaBloque(nuevoBloque, nuevoIndice);
    
    const inputsSelects = nuevoBloque.querySelectorAll('input, select');
    inputsSelects.forEach(campo => {
        if (campo.name) {
            campo.name = campo.name.replace(/_(bloque\d+)$/, '') + `_bloque${nuevoIndice}`;
        }
    });
    
    const filasElemento = nuevoBloque.querySelectorAll('.elemento-row');
    filasElemento.forEach(fila => {
        const selectInst = fila.querySelector('.instalado-select');
        if (selectInst) selectInst.value = 'no';
        const otrosCampos = fila.querySelectorAll('input, select:not(.instalado-select)');
        otrosCampos.forEach(c => {
            c.disabled = true;
            if (c.tagName === 'SELECT') c.selectedIndex = 0;
            else c.value = '';
        });
        fila.classList.remove('active');
        fila.querySelectorAll('[class^="alternativo-"]').forEach(el => el.remove());
    });
    
    tabla.appendChild(nuevoBloque);
    contadorBloques = nuevoIndice;
    configurarListenersInstalacion();
    nuevoBloque.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===========================================
// OBTENER DATOS DE TODOS LOS BLOQUES
// ===========================================
function obtenerDatosFormulario() {
    const bloques = document.querySelectorAll('tbody.bloque-dia');
    const datos = {
        timestamp: new Date().toISOString(),
        bloques: []
    };
    
    bloques.forEach((bloque, idx) => {
        const fechaSpan = bloque.querySelector('.fecha-texto');
        const fechaTexto = fechaSpan ? fechaSpan.textContent : `Día ${idx+1}`;
        const filasElemento = bloque.querySelectorAll('.elemento-row');
        const elementosInstalados = [];
        
        filasElemento.forEach(fila => {
            const instaladoSelect = fila.querySelector('.instalado-select');
            const instalado = instaladoSelect?.value === 'si';
            if (instalado) {
                const nombre = fila.querySelector('.elemento-nombre strong')?.textContent || '';
                elementosInstalados.push({
                    elemento: nombre,
                    instalado: true,
                    dias: fila.querySelector('.dias-input')?.value || '',
                    calibre: obtenerValorSelectConAlternativo(fila, 'calibre'),
                    ubicacion: obtenerValorSelectConAlternativo(fila, 'ubicacion'),
                    diametro: fila.querySelector('.diametro-input')?.value || '',
                    codigo: fila.querySelector('.codigo-input')?.value || '',
                    responsable: fila.querySelector('.responsable-input')?.value || ''
                });
            }
        });
        
        datos.bloques.push({
            numero: idx+1,
            fechaHora: fechaTexto,
            elementosInstalados: elementosInstalados,
            totalInstalados: elementosInstalados.length
        });
    });
    
    return datos;
}

function obtenerValorSelectConAlternativo(fila, tipo) {
    const select = fila.querySelector(`.${tipo}-select`);
    const alt = fila.querySelector(`.alternativo-${tipo}`);
    if (select.value === 'otro' || select.value === 'otra') {
        return alt ? alt.value : '';
    } else {
        return select.options[select.selectedIndex]?.text || '';
    }
}

// ===========================================
// GUARDAR (MOSTRAR RESUMEN)
// ===========================================
function guardarElementos() {
    const datos = obtenerDatosFormulario();
    const totalBloques = datos.bloques.length;
    let totalInstalados = 0;
    let resumen = `RESUMEN: ${totalBloques} día(s) registrado(s)\n\n`;
    
    datos.bloques.forEach(bloque => {
        resumen += `${bloque.fechaHora}: ${bloque.totalInstalados} elementos instalados\n`;
        totalInstalados += bloque.totalInstalados;
    });
    resumen += `\nTotal global de elementos instalados: ${totalInstalados}`;
    
    console.log('Datos completos exportados:', datos);
    alert(resumen);
}

// ===========================================
// LIMPIAR TODO (CORREGIDO)
// Se añade el parámetro 'confirmar' para evitar alertas durante la carga de datos
// ===========================================
function limpiarTodo(confirmar = true) {
    if (confirmar && !confirm('¿Limpiar todos los valores de TODOS los días? (No se eliminarán bloques)')) return;

    document.querySelectorAll('.elemento-row').forEach(fila => {
        const selectInst = fila.querySelector('.instalado-select');
        if (selectInst) {
            selectInst.value = 'no';
            selectInst.dispatchEvent(new Event('change'));
        }
        fila.querySelectorAll('[class^="alternativo-"]').forEach(el => el.remove());
    });

    if (confirmar) alert('Todos los valores han sido limpiados.');
}

// ===========================================
// CARGAR DATOS EXTERNOS (CORREGIDO)
// Llama a limpiarTodo(false) para no interrumpir al usuario con el cuadro de confirmación
// ===========================================
function cargarDatosFormulario(datosExternos) {
    if (!datosExternos || !datosExternos.bloques) return;
    
    const tabla = document.querySelector('.invasive-table');
    const bloques = document.querySelectorAll('tbody.bloque-dia');
    
    // Mantener solo el primer bloque
    for (let i = 1; i < bloques.length; i++) {
        bloques[i].remove();
    }
    
    contadorBloques = 1;
    limpiarTodo(false); // <--- Limpieza silenciosa para restaurar datos
    
    if (datosExternos.bloques[0]) {
        const primerBloque = document.querySelector('tbody.bloque-dia[data-bloque="1"]');
        if (primerBloque) {
            const fechaSpan = primerBloque.querySelector('.fecha-texto');
            if (fechaSpan && datosExternos.bloques[0].fechaHora) {
                fechaSpan.textContent = datosExternos.bloques[0].fechaHora;
            }
            cargarBloqueEnExistente(primerBloque, datosExternos.bloques[0]);
        }
    }
    
    for (let i = 1; i < datosExternos.bloques.length; i++) {
        duplicarTodos();
        const nuevoBloque = document.querySelector(`tbody.bloque-dia:last-child`);
        if (nuevoBloque && datosExternos.bloques[i]) {
            const fechaSpan = nuevoBloque.querySelector('.fecha-texto');
            if (fechaSpan && datosExternos.bloques[i].fechaHora) {
                fechaSpan.textContent = datosExternos.bloques[i].fechaHora;
            }
            cargarBloqueEnExistente(nuevoBloque, datosExternos.bloques[i]);
        }
    }
}

function cargarBloqueEnExistente(bloque, datosBloque) {
    const elementosInstalados = datosBloque.elementosInstalados || [];
    const filas = bloque.querySelectorAll('.elemento-row');
    
    elementosInstalados.forEach((dato, idx) => {
        if (idx < filas.length) {
            const fila = filas[idx];
            const selectInst = fila.querySelector('.instalado-select');
            if (selectInst) {
                selectInst.value = 'si';
                selectInst.dispatchEvent(new Event('change'));
                setTimeout(() => {
                    if (dato.dias) fila.querySelector('.dias-input').value = dato.dias;
                    if (dato.calibre) cargarSelectOAlternativo(fila, 'calibre', dato.calibre);
                    if (dato.ubicacion) cargarSelectOAlternativo(fila, 'ubicacion', dato.ubicacion);
                    if (dato.diametro) {
                        const diam = fila.querySelector('.diametro-input');
                        if (diam) diam.value = dato.diametro;
                    }
                    if (dato.codigo) fila.querySelector('.codigo-input').value = dato.codigo;
                    if (dato.responsable) fila.querySelector('.responsable-input').value = dato.responsable;
                }, 100);
            }
        }
    });
}

function cargarSelectOAlternativo(fila, tipo, valorTexto) {
    const select = fila.querySelector(`.${tipo}-select`);
    if (!select) return;
    let encontrado = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text === valorTexto) {
            select.value = select.options[i].value;
            encontrado = true;
            break;
        }
    }
    if (!encontrado) {
        select.value = (tipo === 'calibre' ? 'otro' : 'otra');
        select.dispatchEvent(new Event('change'));
        setTimeout(() => {
            const alt = fila.querySelector(`.alternativo-${tipo}`);
            if (alt) alt.value = valorTexto;
        }, 50);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarModulo);

// Exportar funciones para uso externo
window.ModuloElementosInvasivos = {
    obtenerDatos: obtenerDatosFormulario,
    limpiar: limpiarTodo,
    duplicar: duplicarTodos,
    cargarDatos: cargarDatosFormulario
};