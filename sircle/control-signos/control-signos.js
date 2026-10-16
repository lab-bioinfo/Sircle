// ===========================================
// MÓDULO CONTROL DE SIGNOS - DINÁMICO
// ===========================================

let opcionesSignos = {};
let medicionesCount = 1;
let colActualGlasgow = null;
let colActualDolor = null;

// Almacena los datos de glasgow y dolor por columna para poder exportarlos
// Clave: número de columna, valor: objeto con glasgow y dolor
const datosGlasgow = {};
const datosDolor   = {};

// NUEVO: control del "debounce" para la búsqueda de fármacos
// (evita mandar una petición al servidor por cada letra escrita)
let debounceFarmacoTimer = null;

document.addEventListener('input', function(e) {
    if (!e.target.classList.contains('input-autocomplete-farmaco')) return;

    const input = e.target;
    const colNum = input.dataset.col;
    const datalist = document.getElementById(`lista_farmacos_${colNum}`);
    const termino = input.value.trim();

    clearTimeout(debounceFarmacoTimer);

    if (termino.length < 2) {
        datalist.innerHTML = '';
        return;
    }

    debounceFarmacoTimer = setTimeout(async () => {
        try {
            const resp = await fetch(`http://172.22.251.49:5000/api/farmacos?buscar=${encodeURIComponent(termino)}`);
            const data = await resp.json();
            datalist.innerHTML = (data.farmacos || [])
                .map(f => `<option value="${f.nombre}${f.presentacion ? ' - ' + f.presentacion : ''}">`)
                .join('');
        } catch (err) {
            console.warn('No se pudo buscar fármacos:', err);
        }
    }, 250); // espera 250ms después de que dejas de escribir
});

// ========== CARGA DE DATOS ==========
fetch('../listas/control-signos.json')
    .then(response => response.json())
    .then(data => {
        opcionesSignos = data;
        inicializarTabla();
        renderizarCamposDolor();
        console.log('✅ Listas de control de signos cargadas');
    })
    .catch(err => console.error('Error:', err));

function inicializarTabla() {
    const tbody = document.getElementById('vital-body');
    tbody.innerHTML = '';

    opcionesSignos.variables_vitales.forEach(variable => {
        const tr = document.createElement('tr');
        tr.dataset.varId = variable.id;
        tr.innerHTML = `<td>${variable.nombre}</td><td class="col-1">${generarInputHTML(variable, 1)}</td>`;
        tbody.appendChild(tr);
    });

    vincularEventosPAM(1);
    document.getElementById('btn-add-col').onclick = agregarColumna;
}

function generarInputHTML(variable, colNum) {
    switch(variable.tipo) {
        case 'date':   return `<input type="date" class="input-col" data-col="${colNum}" data-var="${variable.id}">`;
        case 'time':   return `<input type="time" class="input-col" data-col="${colNum}" data-var="${variable.id}">`;
        case 'number': {
            const readonly  = variable.readonly ? 'readonly' : '';
            const step      = variable.step || '1';
            const className = variable.id === 'pam' ? 'pam' : (variable.id === 'pas' ? 'pas' : (variable.id === 'pad' ? 'pad' : ''));
            return `<input type="number" step="${step}" class="input-col ${className}" data-col="${colNum}" data-var="${variable.id}" ${readonly}>`;
        }
        case 'select': {
    // NUEVO: BIC Fármaco usa autocompletar contra MySQL en vez
    // de un <select> fijo, porque tiene 1000+ opciones.
    if (variable.id === 'bic_farmaco') {
        return `<input type="text" class="input-col input-autocomplete-farmaco"
                    data-col="${colNum}" data-var="${variable.id}"
                    list="lista_farmacos_${colNum}" autocomplete="off"
                    placeholder="Escriba para buscar...">
                <datalist id="lista_farmacos_${colNum}"></datalist>`;
    }
    const opciones = opcionesSignos[variable.id] || [];
    return `<select class="input-col" data-col="${colNum}" data-var="${variable.id}">
                ${opciones.map(opt => `<option value="${opt.value}">${opt.display}</option>`).join('')}
            </select>`;
}
        case 'button':
            if (variable.id === 'glasgow') return `<button class="btn-calc" onclick="abrirGlasgow(${colNum})">Calcular</button><span class="glasgow-resultado" id="glasgow-res-${colNum}"></span>`;
            if (variable.id === 'dolor')   return `<button class="btn-calc" onclick="abrirDolor(${colNum})">Valorar</button><span class="dolor-resultado" id="dolor-res-${colNum}"></span>`;
            return '';
        default: return `<input type="text" class="input-col" data-col="${colNum}" data-var="${variable.id}">`;
    }
}

// ========== LÓGICA DE COLUMNAS ==========

function agregarColumna() {
    medicionesCount++;
    const headerRow = document.getElementById('header-row');
    const th = document.createElement('th');
    th.textContent = `Medición ${medicionesCount}`;
    headerRow.appendChild(th);

    const rows = document.querySelectorAll('#vital-body tr');
    rows.forEach(row => {
        const varId    = row.dataset.varId;
        const variable = opcionesSignos.variables_vitales.find(v => v.id === varId);
        const td       = document.createElement('td');
        td.className   = `col-${medicionesCount}`;
        td.innerHTML   = generarInputHTML(variable, medicionesCount);
        row.appendChild(td);
    });

    vincularEventosPAM(medicionesCount);
}

// ========== CÁLCULOS Y MODALES ==========

function vincularEventosPAM(colNum) {
    // Busca dentro de TODAS las columnas, no solo la primera
    const allPas = document.querySelectorAll(`.pas[data-col="${colNum}"]`);
    const allPad = document.querySelectorAll(`.pad[data-col="${colNum}"]`);
    const allPam = document.querySelectorAll(`.pam[data-col="${colNum}"]`);

    if (allPas.length && allPad.length && allPam.length) {
        const calcular = () => {
            const pas = parseFloat(allPas[0].value);
            const pad = parseFloat(allPad[0].value);
            if (!isNaN(pas) && !isNaN(pad)) {
                allPam[0].value = ((pas + (2 * pad)) / 3).toFixed(1);
            }
        };
        allPas[0].oninput = calcular;
        allPad[0].oninput = calcular;
    }
}

function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (show) modal.classList.remove('hidden');
    else      modal.classList.add('hidden');
}

function abrirGlasgow(colNum) {
    colActualGlasgow = colNum;
    // Precargar si ya había datos
    const prev = datosGlasgow[colNum] || {};
    ['ocular','verbal','motora'].forEach(id => {
        const el = document.getElementById(id);
        if (el && prev[id]) el.value = prev[id];
    });
    toggleModal('glasgow-modal', true);
}

function calcularGlasgow() {
    const e = parseInt(document.getElementById('ocular').value);
    const v = parseInt(document.getElementById('verbal').value);
    const m = parseInt(document.getElementById('motora').value);
    const total = e + v + m;

    // Guardar para exportación
    datosGlasgow[colActualGlasgow] = {
        ocular: e, verbal: v, motor: m, total,
        clasificacion: total <= 8 ? 'Grave' : total <= 12 ? 'Moderado' : 'Leve'
    };

    const span = document.getElementById(`glasgow-res-${colActualGlasgow}`);
    if (span) span.textContent = `${total} pts`;

    toggleModal('glasgow-modal', false);
}

function renderizarCamposDolor() {
    const container = document.getElementById('dolor-inputs-container');
    if (!container) return;
    container.innerHTML = opcionesSignos.dolor_campos.map(campo => {
        if (campo.tipo === 'textarea') {
            return `<textarea name="${campo.id}" placeholder="${campo.nombre}"></textarea>`;
        }
        return `<input type="${campo.tipo}" name="${campo.id}" placeholder="${campo.nombre}" ${campo.min !== undefined ? `min="${campo.min}" max="${campo.max}"` : ''}>`;
    }).join('');
}

function abrirDolor(colNum) {
    colActualDolor = colNum;
    // Precargar si ya había datos
    const prev = datosDolor[colNum] || {};
    Object.entries(prev).forEach(([key, val]) => {
        const el = document.querySelector(`#dolor-modal [name="${key}"]`);
        if (el) el.value = val;
    });
    toggleModal('dolor-modal', true);
}

function guardarDolor() {
    const datos = {};
    document.querySelectorAll('#dolor-modal input, #dolor-modal textarea').forEach(el => {
        if (el.name) datos[el.name] = el.value;
    });
    datosDolor[colActualDolor] = datos;

    const intensity = datos['intensidad'] || '';
    const span = document.getElementById(`dolor-res-${colActualDolor}`);
    if (span) span.textContent = intensity ? `ENA: ${intensity}/10` : 'Valorado';

    toggleModal('dolor-modal', false);
}

// ========== OBTENER DATOS PARA EXPORTACIÓN TSV / TXT / SQL ==========
//
// Estructura devuelta:
// {
//   mediciones: [
//     {
//       col: 1,
//       fecha, hora, fc, fr, t_axilar, sato2, fio2,
//       pas, pad, pam, llene_capilar,
//       glasgow: { ocular, verbal, motor, total, clasificacion },
//       glasgow_total,          // string "15 pts" para TSV plano
//       dolor: { intensidad, ubicacion, irradiacion, ... },
//       dolor_intensidad,       // string para TSV plano
//       diuresis,
//       bic_farmaco, bic_flujo, bic_resuspendido, presentacion_solucion
//     },
//     ...
//   ]
// }
//
// Nota: los campos glasgow_total y dolor_intensidad son atajos planos
// pensados para columnas SQL simples. La estructura completa queda
// en glasgow{} y dolor{} para cuando se quiera normalizar en SQL.

function obtenerDatosFormulario() {
    const mediciones = [];

    for (let col = 1; col <= medicionesCount; col++) {
        const medicion = { col };

        // Leer todos los inputs/selects de esa columna
        document.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
            const varId = el.dataset.var;
            if (!varId) return;
            medicion[varId] = el.value || '';
        });

        // Glasgow estructurado
        if (datosGlasgow[col]) {
            medicion.glasgow        = datosGlasgow[col];
            medicion.glasgow_total  = `${datosGlasgow[col].total} pts`;
        } else {
            medicion.glasgow_total  = '';
        }

        // Dolor estructurado
        if (datosDolor[col]) {
            medicion.dolor           = datosDolor[col];
            medicion.dolor_intensidad = datosDolor[col].intensidad || '';
            // Alias para compatibilidad con cib-export.js
            medicion.ubicacion        = datosDolor[col].ubicacion  || '';
        } else {
            medicion.dolor_intensidad = '';
            medicion.ubicacion        = '';
        }

        // Alias para cib-export.js (busca m.fc, m.fr, m.temperatura, etc.)
        medicion.temperatura  = medicion.t_axilar || '';
        medicion.bic_flujo    = medicion.bic_flujo || '';
        medicion.bic_dilucion = medicion.bic_resuspendido   || '';

        mediciones.push(medicion);
    }

    return { mediciones, timestamp: new Date().toISOString() };
}

// Exportar al sistema de navegación
window.obtenerDatosFormulario = obtenerDatosFormulario;

window.ModuloControlSignos = {
    obtenerDatos: obtenerDatosFormulario,
    agregarMedicion: agregarColumna
};
