// ===========================================
// MÓDULO DE EXÁMENES E INTERCONSULTAS - DINÁMICO
// ===========================================

let opcionesExamenes = {};
const THRESHOLD = 7;

document.addEventListener('DOMContentLoaded', function() {
    fetch('../listas/examenes.json')
        .then(response => response.json())
        .then(data => {
            opcionesExamenes = data;
            inicializarModulo();
            console.log('✅ Módulo Exámenes cargado con JSON');
        })
        .catch(err => console.error('Error al cargar examenes.json:', err));
});

function inicializarModulo() {
    // Vincular botones de secciones principales
    document.getElementById('agregar-lab').addEventListener('click', () => agregarFila('lab'));
    document.getElementById('agregar-img').addEventListener('click', () => agregarFila('img'));
    document.getElementById('agregar-interconsulta').addEventListener('click', () => agregarFila('int'));

    // Vincular botones de controles seriados
    document.getElementById('agregar-control-hgt').addEventListener('click', () => agregarFilaControl('HGT'));
    document.getElementById('agregar-control-insulina').addEventListener('click', () => agregarFilaControl('Insulina + via'));
    document.getElementById('agregar-control-bic-insulina').addEventListener('click', () => agregarFilaControl('BIC Insulina'));
    document.getElementById('agregar-control-sg').addEventListener('click', () => agregarFilaControl('SG%'));

    // Agregar filas iniciales vacías para que el módulo no se vea pelado
    agregarFila('lab');
    agregarFila('img');
    agregarFila('int');
}

function agregarFila(tipo) {
    const tbody = document.getElementById(`${tipo === 'lab' ? 'laboratorio' : tipo === 'img' ? 'imagenologia' : 'interconsultas'}-body`);
    const tr = document.createElement('tr');
    const rowId = `row_${tipo}_${Date.now()}`;
    const apiKey = tipo === 'lab' ? 'examenes_laboratorio' : tipo === 'img' ? 'examenes_imagen' : 'interconsultas';
    const opciones = opcionesExamenes[apiKey] || [];

    // Celda 1: Selector o Autocomplete
    let html = `<td>${generarInputLista(rowId, opciones, tipo === 'lab')}</td>`;

    // Celda 2: Código (Solo para Laboratorio)
    if (tipo === 'lab') {
        html += `<td><input type="text" class="codigo-input" id="codigo_${rowId}" readonly placeholder="..."></td>`;
    }

    // Celda de Acciones (Eliminar)
    html += `<td><button type="button" class="btn-delete" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button></td>`;

    tr.innerHTML = html;
    tbody.appendChild(tr);

    // Configurar lógica de selección
    configurarEventosFila(rowId, opciones, tipo === 'lab');
}

function generarInputLista(rowId, opciones, esLab) {
    if (opciones.length >= THRESHOLD) {
        return `
            <input type="text" class="search-input" list="list_${rowId}" id="input_${rowId}" placeholder="Escribe para buscar...">
            <input type="hidden" id="hidden_${rowId}">
            <datalist id="list_${rowId}">${opciones.map(o => `<option value="${o.display}">`).join('')}</datalist>`;
    } else {
        return `
            <select id="select_${rowId}">
                <option value="">Seleccione...</option>
                ${opciones.map(o => `<option value="${esLab ? o.value : o.display}">${o.display}</option>`).join('')}
            </select>`;
    }
}

function configurarEventosFila(rowId, opciones, esLab) {
    const input = document.getElementById(`input_${rowId}`);
    const select = document.getElementById(`select_${rowId}`);
    const hidden = document.getElementById(`hidden_${rowId}`);
    const codeDisplay = document.getElementById(`codigo_${rowId}`);

    if (input) {
        input.addEventListener('input', function() {
            const match = opciones.find(o => o.display === this.value);
            if (match) {
                if (hidden) hidden.value = match.display;
                if (esLab && codeDisplay) codeDisplay.value = match.value;
            } else {
                if (hidden) hidden.value = "";
                if (esLab && codeDisplay) codeDisplay.value = "";
            }
        });
    } else if (select) {
        select.addEventListener('change', function() {
            if (esLab && codeDisplay) codeDisplay.value = this.value;
        });
    }
}

function agregarFilaControl(tipoNombre) {
    const tbody = document.getElementById('controles-body');
    const tr = document.createElement('tr');
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().slice(0, 5);
    const rowId = `control_${Date.now()}`;

    const unidades = opcionesExamenes.unidades_control || [];

    tr.innerHTML = `
        <td><strong>${tipoNombre}</strong><input type="hidden" name="control_tipo" value="${tipoNombre}"></td>
        <td><input type="number" step="0.1" class="valor-input" placeholder="0.0"></td>
        <td>
            ${unidades.length >= THRESHOLD ? `
                <input type="text" class="search-input" list="list_u_${rowId}" id="u_input_${rowId}">
                <datalist id="list_u_${rowId}">${unidades.map(u => `<option value="${u.display}">`).join('')}</datalist>
            ` : `
                <select class="unidad-select">
                    ${unidades.map(u => `<option value="${u.value}">${u.display}</option>`).join('')}
                </select>
            `}
        </td>
        <td><input type="date" class="fecha-input" value="${fecha}"></td>
        <td><input type="time" class="hora-input" value="${hora}"></td>
        <td><button type="button" class="btn-delete" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
    tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== EXPORTACIÓN DE DATOS ==========
function obtenerDatosFormulario() {
    const extraerNormal = (tbodyId, esLab) => {
        return Array.from(document.querySelectorAll(`#${tbodyId} tr`)).map(tr => {
            const display = tr.querySelector('.search-input')?.value || tr.querySelector('select')?.options[tr.querySelector('select').selectedIndex]?.text;
            if (!display || display.includes("Seleccione")) return null;
            return {
                examen: display,
                codigo: esLab ? tr.querySelector('.codigo-input')?.value : null
            };
        }).filter(x => x !== null);
    };

    const extraerControles = () => {
        return Array.from(document.querySelectorAll('#controles-body tr')).map(tr => {
            const valor = tr.querySelector('.valor-input')?.value;
            if (!valor) return null;
            return {
                tipo: tr.querySelector('input[name="control_tipo"]')?.value,
                valor: valor,
                unidad: tr.querySelector('.search-input')?.value || tr.querySelector('select')?.value,
                fecha: tr.querySelector('.fecha-input')?.value,
                hora: tr.querySelector('.hora-input')?.value
            };
        }).filter(c => c !== null);
    };

    return {
        laboratorio: extraerNormal('laboratorio-body', true),
        imagenologia: extraerNormal('imagenologia-body', false),
        interconsultas: extraerNormal('interconsultas-body', false),
        controlesSeriados: extraerControles(),
        timestamp: new Date().toISOString()
    };
}

window.obtenerDatosFormulario = obtenerDatosFormulario;