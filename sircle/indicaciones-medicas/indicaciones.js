// ===========================================
// MÓDULO INDICACIONES MÉDICAS - DINÁMICO Y COMPLETO
// ===========================================

let contadorBloques = 1;
const bloquesData = {};
let opcionesIndicaciones = {};

// ========== CARGA DE DATOS DESDE JSON ==========
fetch('../listas/indicaciones.json')
    .then(response => response.json())
    .then(data => {
        opcionesIndicaciones = data;
        inicializarModulo();
        console.log('✅ Listas de indicaciones cargadas correctamente');
    })
    .catch(error => {
        console.error('❌ Error cargando indicaciones.json:', error);
        // Fallback preventivo para evitar errores de renderizado
        opcionesIndicaciones = { medicamento_unidad: [], kinesioterapia_tipo: [] };
        inicializarModulo();
    });

// ========== FUNCIONES DE FECHA Y HORARIOS ==========

function obtenerFechaHoraActual() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-ES');
    const hora = ahora.toLocaleTimeString('es-ES');
    return `${fecha} - ${hora}`;
}

function obtenerIntervaloHoras(frecuencia) {
    const map = {
        'cada_6h': 6, 'cada_8h': 8, 'cada_12h': 12, 'cada_24h': 24, 'cada_48h': 48
    };
    return map[frecuencia] || null;
}

function generarHorariosDesde(horaInicioStr, frecuencia) {
    const intervaloHoras = obtenerIntervaloHoras(frecuencia);
    if (!intervaloHoras) return []; 

    function horaAMinutos(horaStr) {
        const [horas, minutos] = horaStr.split(':').map(Number);
        return horas * 60 + minutos;
    }
    function minutosAHora(minutos) {
        const horas = Math.floor(minutos / 60) % 24;
        const mins = minutos % 60;
        return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    let inicioMinutos = horaAMinutos(horaInicioStr);
    const limite8PM = 20 * 60;
    const limite8AM = 8 * 60;
    let limiteMinutos, esDiaSiguiente;

    if (inicioMinutos >= limite8PM) {
        limiteMinutos = limite8AM;
        esDiaSiguiente = true;
    } else {
        limiteMinutos = limite8PM;
        esDiaSiguiente = false;
    }

    const horarios = [];
    let minutosActual = inicioMinutos;
    let contador = 0;
    while (true) {
        let horaActual = minutosAHora(minutosActual);
        horarios.push(horaActual);
        minutosActual += intervaloHoras * 60;
        contador++;
        if (esDiaSiguiente) {
            if (minutosActual > (limiteMinutos + 24 * 60)) break;
        } else {
            if (minutosActual > limiteMinutos) break;
        }
        if (contador > 50) break;
    }
    return horarios;
}

// ========== LÓGICA DE RENDERIZADO DINÁMICO ==========

function generarHTMLLista(elementId, apiKey, bloqueNum, placeholder = "Seleccione...") {
    const opciones = opcionesIndicaciones[apiKey] || [];
    const threshold = 7;

    if (opciones.length >= threshold) {
        // MODO AUTOCOMPLETE
        return `
            <input type="text" class="input-autocomplete ${elementId}-input" 
                placeholder="Escribe para buscar..." 
                list="list-${elementId}-${bloqueNum}" 
                data-target="${elementId}-${bloqueNum}">
            <input type="hidden" class="${elementId}-select" id="${elementId}-${bloqueNum}" data-bloque="${bloqueNum}">
            <datalist id="list-${elementId}-${bloqueNum}">
                ${opciones.map(opt => opt.value ? `<option value="${opt.display}" data-value="${opt.value}">` : '').join('')}
            </datalist>`;
    } else {
        // MODO SELECT NORMAL
        return `
            <select class="${elementId}-select" data-bloque="${bloqueNum}">
                <option value="">${placeholder}</option>
                ${opciones.map(opt => `<option value="${opt.value}">${opt.display}</option>`).join('')}
            </select>`;
    }
}

function generarBloqueHTML(numeroBloque) {
    const fechaTexto = `Día ${numeroBloque} - ${obtenerFechaHoraActual()}`;
    return `
    <div class="bloque-dia" data-bloque="${numeroBloque}">
        <div class="fecha-bloque">
            <div class="fecha-contenedor">
                <i class="fas fa-calendar-alt"></i>
                <span class="fecha-texto">${fechaTexto}</span>
            </div>
        </div>
        <div class="four-columns-grid">
            <div class="column">
                <div class="column-header"><h3><i class="fas fa-utensils"></i> Régimen</h3></div>
                <div class="form-group">
                    <label class="required">Tipo de Régimen</label>
                    ${generarHTMLLista('regimen', 'regimen_tipo', numeroBloque, 'Seleccione tipo...')}
                </div>
                <div class="form-actions-inline">
                    <button type="button" class="btn btn-secondary btn-small agregar-regimen" data-bloque="${numeroBloque}"><i class="fas fa-plus"></i> Agregar</button>
                    <button type="button" class="btn btn-primary btn-small ver-regimenes" data-bloque="${numeroBloque}" style="display:none;"><i class="fas fa-list"></i> Ver</button>
                </div>
            </div>

            <div class="column">
                <div class="column-header"><h3><i class="fas fa-bed"></i> Reposo</h3></div>
                <div class="form-group">
                    <label class="required">Tipo de Reposo</label>
                    ${generarHTMLLista('reposo', 'reposo_tipo', numeroBloque, 'Seleccione tipo...')}
                </div>
                <div class="form-actions-inline">
                    <button type="button" class="btn btn-secondary btn-small agregar-reposo" data-bloque="${numeroBloque}"><i class="fas fa-plus"></i> Agregar</button>
                    <button type="button" class="btn btn-primary btn-small ver-reposos" data-bloque="${numeroBloque}" style="display:none;"><i class="fas fa-list"></i> Ver</button>
                </div>
            </div>

            <div class="column">
                <div class="column-header"><h3><i class="fas fa-pills"></i> Farmacoterapia</h3></div>
                <div class="form-group">
                    <label class="required">Medicamento</label>
                    <input type="text" class="med-nombre" data-bloque="${numeroBloque}">
                </div>
                <div class="form-group">
                    <label class="required">Dosis</label>
                    <div class="dosis-group">
                        <input type="number" step="0.01" class="med-dosis" placeholder="0.00" data-bloque="${numeroBloque}">
                        <select class="med-unidad" data-bloque="${numeroBloque}">
                            ${opcionesIndicaciones.medicamento_unidad.map(opt => `<option value="${opt.value}">${opt.display}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="required">Vía</label>
                    ${generarHTMLLista('med-via', 'medicamento_via', numeroBloque)}
                </div>
                <div class="form-group">
                    <label class="required">Frecuencia</label>
                    ${generarHTMLLista('med-frecuencia', 'medicamento_frecuencia', numeroBloque)}
                </div>
                <div class="form-group">
                    <label class="required">Hora inicio</label>
                    <input type="time" class="med-hora-inicio" data-bloque="${numeroBloque}" value="08:00">
                </div>
                <div class="form-actions-inline">
                    <button type="button" class="btn btn-secondary btn-small agregar-medicamento" data-bloque="${numeroBloque}"><i class="fas fa-plus"></i> Agregar</button>
                    <button type="button" class="btn btn-primary btn-small ver-medicamentos" data-bloque="${numeroBloque}" style="display:none;"><i class="fas fa-list"></i> Ver</button>
                </div>
                <div id="medicamentos-lista-${numeroBloque}" class="medicamentos-lista"></div>
            </div>

            <div class="column">
                <div class="column-header"><h3><i class="fas fa-hands-helping"></i> Kinesioterapia</h3></div>
                <div class="form-group">
                    <label class="required">Tipo de Terapia</label>
                    <div class="checkbox-group">
                        ${opcionesIndicaciones.kinesioterapia_tipo.map(opt => `
                            <label class="checkbox-card">
                                <input type="checkbox" class="kine-tipo" value="${opt.value}" data-bloque="${numeroBloque}"> ${opt.display}
                            </label>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ========== GESTIÓN DE MEDICAMENTOS ==========

function renderizarListaMedicamentos(bloqueId) {
    const contenedor = document.getElementById(`medicamentos-lista-${bloqueId}`);
    if (!contenedor) return;
    const medicamentos = bloquesData[bloqueId]?.medicamentos || [];
    if (medicamentos.length === 0) {
        contenedor.innerHTML = '<small style="color:gray;">Sin medicamentos agregados</small>';
        return;
    }
    
    let html = '';
    medicamentos.forEach((med, idx) => {
        const admin = med.administraciones || [];
        const viaDisplay = (opcionesIndicaciones.medicamento_via.find(o => o.value === med.via))?.display || med.via;
        const freqDisplay = (opcionesIndicaciones.medicamento_frecuencia.find(o => o.value === med.frecuencia))?.display || med.frecuencia;

        html += `<div class="med-item" data-med-idx="${idx}" style="border:1px solid #ddd; margin-top:8px; padding:6px; border-radius:6px; background:#fff;">
            <div><strong>${med.nombre}</strong> - ${med.dosis} ${med.unidad} - ${viaDisplay} - ${freqDisplay}</div>
            <div class="horarios-checks" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:5px;">`;
        admin.forEach((item, i) => {
            const checkedAttr = item.administrado ? 'checked' : '';
            html += `<label style="display:flex; align-items:center; gap:4px; font-size:12px;">
                        <input type="checkbox" class="check-horario" data-bloque="${bloqueId}" data-med-idx="${idx}" data-horario-idx="${i}" ${checkedAttr}>
                        ${item.hora}
                    </label>`;
        });
        html += `</div><button class="btn-eliminar-medicamento" data-bloque="${bloqueId}" data-med-idx="${idx}" style="margin-top:5px; background:#ef4444; color:white; border:none; border-radius:4px; padding:2px 6px; font-size:11px;">Eliminar</button>
        </div>`;
    });
    contenedor.innerHTML = html;

    // Listeners para checks de administración
    contenedor.querySelectorAll('.check-horario').forEach(cb => {
        cb.addEventListener('change', () => {
            const b = parseInt(cb.dataset.bloque);
            const m = parseInt(cb.dataset.medIdx);
            const h = parseInt(cb.dataset.horarioIdx);
            if (bloquesData[b]?.medicamentos[m]) {
                bloquesData[b].medicamentos[m].administraciones[h].administrado = cb.checked;
            }
        });
    });

    // Listeners para eliminar
    contenedor.querySelectorAll('.btn-eliminar-medicamento').forEach(btn => {
        btn.onclick = () => {
            const b = parseInt(btn.dataset.bloque);
            const m = parseInt(btn.dataset.medIdx);
            if (confirm('¿Eliminar este medicamento?')) {
                bloquesData[b].medicamentos.splice(m, 1);
                renderizarListaMedicamentos(b);
                actualizarBotonVer(b);
            }
        };
    });
}

function agregarMedicamento(bloqueId) {
    const div = document.querySelector(`.bloque-dia[data-bloque="${bloqueId}"]`);
    const data = {
        nombre: div.querySelector('.med-nombre').value.trim(),
        dosis: div.querySelector('.med-dosis').value.trim(),
        unidad: div.querySelector('.med-unidad').value,
        via: div.querySelector('.med-via-select').value,
        frecuencia: div.querySelector('.med-frecuencia-select').value,
        horaInicio: div.querySelector('.med-hora-inicio').value
    };

    if (!data.nombre || !data.dosis || !data.via || !data.frecuencia) {
        alert('Complete todos los campos del medicamento');
        return;
    }

    const horarios = generarHorariosDesde(data.horaInicio, data.frecuencia);
    data.administraciones = horarios.map(h => ({ hora: h, administrado: false }));
    
    bloquesData[bloqueId].medicamentos.push(data);
    
    // Resetear campos
    div.querySelector('.med-nombre').value = '';
    div.querySelector('.med-dosis').value = '';
    div.querySelectorAll('.input-autocomplete').forEach(i => i.value = '');
    div.querySelectorAll('input[type="hidden"]').forEach(i => i.value = '');
    div.querySelector('.med-hora-inicio').value = '08:00';
    
    renderizarListaMedicamentos(bloqueId);
    actualizarBotonVer(bloqueId);
}

// ========== MODALES Y EDICIÓN ==========

let modalBloqueActual = null;
let modalTipoActual = null;

function abrirModal(tipo, bloqueId) {
    modalBloqueActual = bloqueId;
    modalTipoActual = tipo;
    renderModal(tipo, bloqueId);
    document.getElementById(`modal-${tipo}`).style.display = 'flex';
}

function cerrarModalGlobal(tipo) {
    document.getElementById(`modal-${tipo}`).style.display = 'none';
}

function renderModal(tipo, bloqueId) {
    const datos = bloquesData[bloqueId];
    const tbody = document.getElementById(`modal-tabla-${tipo}`);
    tbody.innerHTML = '';

    if (tipo === 'medicamentos') {
        datos.medicamentos.forEach((item, idx) => {
            const tr = document.createElement('tr');
            
            // Renderizar celdas editables
            const campos = ['nombre', 'dosis', 'unidad', 'via', 'frecuencia', 'horaInicio'];
            campos.forEach(campo => {
                const td = document.createElement('td');
                if (['via', 'frecuencia', 'unidad'].includes(campo)) {
                    const select = document.createElement('select');
                    const apiKey = campo === 'via' ? 'medicamento_via' : (campo === 'frecuencia' ? 'medicamento_frecuencia' : 'medicamento_unidad');
                    select.innerHTML = opcionesIndicaciones[apiKey].map(o => `<option value="${o.value}" ${item[campo]===o.value?'selected':''}>${o.display}</option>`).join('');
                    select.onchange = () => { 
                        item[campo] = select.value; 
                        if (['via', 'frecuencia'].includes(campo)) regenerarHorariosYRefrescarModal(item, bloqueId);
                    };
                    td.appendChild(select);
                } else if (campo === 'horaInicio') {
                    const input = document.createElement('input');
                    input.type = 'time'; input.value = item[campo];
                    input.onchange = (e) => { item[campo] = e.target.value; regenerarHorariosYRefrescarModal(item, bloqueId); };
                    td.appendChild(input);
                } else {
                    const input = document.createElement('input');
                    input.type = campo === 'dosis' ? 'number' : 'text';
                    input.value = item[campo];
                    input.onchange = (e) => { item[campo] = e.target.value; renderizarListaMedicamentos(bloqueId); };
                    td.appendChild(input);
                }
                tr.appendChild(td);
            });

            // Horarios con checks
            const tdH = document.createElement('td');
            tdH.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:5px;">` +
                item.administraciones.map((h, hi) => `<label style="font-size:11px;"><input type="checkbox" ${h.administrado?'checked':''} onchange="bloquesData[${bloqueId}].medicamentos[${idx}].administraciones[${hi}].administrado=this.checked; renderizarListaMedicamentos(${bloqueId})"> ${h.hora}</label>`).join('') + `</div>`;
            tr.appendChild(tdH);

            const tdA = document.createElement('td');
            tdA.innerHTML = `<button class="btn btn-danger btn-small" onclick="eliminarItemModal('medicamentos', ${idx})"><i class="fas fa-trash"></i></button>`;
            tr.appendChild(tdA);
            tbody.appendChild(tr);
        });
    } else {
        // Regímenes y Reposos
        datos[tipo].forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><input type="text" value="${item.tipo}" onchange="bloquesData[${bloqueId}].${tipo}[${idx}].tipo=this.value"></td>
                            <td><button class="btn btn-danger btn-small" onclick="eliminarItemModal('${tipo}', ${idx})"><i class="fas fa-trash"></i></button></td>`;
            tbody.appendChild(tr);
        });
    }
}

function regenerarHorariosYRefrescarModal(med, bloqueId) {
    const nuevos = generarHorariosDesde(med.horaInicio, med.frecuencia);
    const old = med.administraciones || [];
    med.administraciones = nuevos.map(h => ({ hora: h, administrado: old.find(o => o.hora === h)?.administrado || false }));
    renderizarListaMedicamentos(bloqueId);
    renderModal('medicamentos', bloqueId);
}

// ========== FUNCIONES DE BLOQUE Y DUPLICACIÓN ==========

function agregarRegimen(bloqueId) {
    const val = document.getElementById(`regimen-${bloqueId}`)?.value || document.querySelector(`.regimen-select[data-bloque="${bloqueId}"]`)?.value;
    if (!val) return;
    bloquesData[bloqueId].regimenes.push({ tipo: val });
    actualizarBotonVer(bloqueId);
}

function agregarReposo(bloqueId) {
    const val = document.getElementById(`reposo-${bloqueId}`)?.value || document.querySelector(`.reposo-select[data-bloque="${bloqueId}"]`)?.value;
    if (!val) return;
    bloquesData[bloqueId].reposos.push({ tipo: val });
    actualizarBotonVer(bloqueId);
}

function actualizarBotonVer(bloqueId) {
    const div = document.querySelector(`.bloque-dia[data-bloque="${bloqueId}"]`);
    if (!div) return;
    div.querySelector('.ver-regimenes').style.display = bloquesData[bloqueId].regimenes.length ? 'inline-flex' : 'none';
    div.querySelector('.ver-reposos').style.display = bloquesData[bloqueId].reposos.length ? 'inline-flex' : 'none';
    div.querySelector('.ver-medicamentos').style.display = bloquesData[bloqueId].medicamentos.length ? 'inline-flex' : 'none';
}

function duplicarTodo() {
    const bloques = document.querySelectorAll('.bloque-dia');
    const ultimoNum = parseInt(bloques[bloques.length - 1].dataset.bloque);
    const nuevoNum = ultimoNum + 1;
    
    const container = document.getElementById('bloques-container');
    const temp = document.createElement('div');
    temp.innerHTML = generarBloqueHTML(nuevoNum);
    container.appendChild(temp.firstElementChild);

    const origen = bloquesData[ultimoNum];
    bloquesData[nuevoNum] = {
        regimenes: JSON.parse(JSON.stringify(origen.regimenes)),
        reposos: JSON.parse(JSON.stringify(origen.reposos)),
        medicamentos: origen.medicamentos.map(m => ({ ...m, administraciones: m.administraciones.map(a => ({...a, administrado: false})) }))
    };

    contadorBloques = nuevoNum;
    inicializarBloque(container.lastElementChild, nuevoNum);
    container.lastElementChild.scrollIntoView({ behavior: 'smooth' });
}

// ========== AUTOCOMPLETE Y VINCULACIÓN ==========

function vincularAutocomplete(bloqueDiv) {
    bloqueDiv.querySelectorAll('.input-autocomplete').forEach(input => {
        const targetId = input.dataset.target;
        const hidden = document.getElementById(targetId);
        const apiKey = input.classList.contains('regimen-input') ? 'regimen_tipo' : 
                       input.classList.contains('reposo-input') ? 'reposo_tipo' :
                       input.classList.contains('med-via-input') ? 'medicamento_via' : 'medicamento_frecuencia';
        const opciones = opcionesIndicaciones[apiKey];

        input.oninput = () => {
            const match = opciones.find(o => o.display === input.value);
            hidden.value = match ? match.value : '';
        };

        input.onblur = () => {
            setTimeout(() => {
                if (!opciones.some(o => o.display === input.value)) {
                    input.value = ''; hidden.value = '';
                }
            }, 150);
        };
    });
}

function inicializarBloque(bloqueDiv, num) {
    if (!bloquesData[num]) bloquesData[num] = { regimenes: [], reposos: [], medicamentos: [] };
    
    bloqueDiv.querySelector('.agregar-regimen').onclick = () => agregarRegimen(num);
    bloqueDiv.querySelector('.agregar-reposo').onclick = () => agregarReposo(num);
    bloqueDiv.querySelector('.agregar-medicamento').onclick = () => agregarMedicamento(num);
    
    bloqueDiv.querySelector('.ver-regimenes').onclick = () => abrirModal('regimenes', num);
    bloqueDiv.querySelector('.ver-reposos').onclick = () => abrirModal('reposos', num);
    bloqueDiv.querySelector('.ver-medicamentos').onclick = () => abrirModal('medicamentos', num);

    vincularAutocomplete(bloqueDiv);
    renderizarListaMedicamentos(num);
    actualizarBotonVer(num);
}

// ========== EXPORTACIÓN DE DATOS ==========

function obtenerDatosFormulario() {
    const datos = { timestamp: new Date().toISOString(), bloques: [] };
    document.querySelectorAll('.bloque-dia').forEach(div => {
        const num = parseInt(div.dataset.bloque);
        datos.bloques.push({
            numero: num,
            fechaHora: div.querySelector('.fecha-texto').textContent,
            regimenes: bloquesData[num].regimenes,
            reposos: bloquesData[num].reposos,
            medicamentos: bloquesData[num].medicamentos,
            kinesioterapia: Array.from(div.querySelectorAll('.kine-tipo:checked')).map(cb => cb.value)
        });
    });
    return datos;
}

function cargarDatosFormulario(externos) {
    if (!externos?.bloques) return;
    const container = document.getElementById('bloques-container');
    container.innerHTML = '';
    externos.bloques.forEach((b, i) => {
        const n = i + 1;
        const temp = document.createElement('div');
        temp.innerHTML = generarBloqueHTML(n);
        container.appendChild(temp.firstElementChild);
        bloquesData[n] = { regimenes: b.regimenes, reposos: b.reposos, medicamentos: b.medicamentos };
        inicializarBloque(container.lastElementChild, n);
        container.lastElementChild.querySelector('.fecha-texto').textContent = b.fechaHora;
        b.kinesioterapia?.forEach(v => {
            const cb = container.lastElementChild.querySelector(`.kine-tipo[value="${v}"]`);
            if (cb) cb.checked = true;
        });
    });
    contadorBloques = externos.bloques.length;
}

function inicializarModulo() {
    const container = document.getElementById('bloques-container');
    container.innerHTML = generarBloqueHTML(1);
    inicializarBloque(container.firstElementChild, 1);
    // document.getElementById('duplicar-todo').onclick = duplicarTodo;
    console.log('minifix test')
}

window.obtenerDatosFormulario = obtenerDatosFormulario;
window.cargarDatosFormulario = cargarDatosFormulario;
window.eliminarItemModal = (t, i) => {
    if (confirm('¿Eliminar elemento?')) {
        bloquesData[modalBloqueActual][t].splice(i, 1);
        renderizarListaMedicamentos(modalBloqueActual);
        renderModal(t, modalBloqueActual);
        actualizarBotonVer(modalBloqueActual);
    }
};
