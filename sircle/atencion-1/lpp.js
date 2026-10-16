// Variables globales
let valoracionActual = null;
let valoraciones = [];
let valoracionIdCounter = 1;

// Datos para el sistema 
const categoriasBraden = [
    {
        id: 'percepcion',
        nombre: 'Percepción sensorial',
        descripcion: 'Capacidad de respuesta a estímulos dolorosos',
        opciones: [
            {valor: 1, texto: '1. Limitado completamente'},
            {valor: 2, texto: '2. Muy limitado'},
            {valor: 3, texto: '3. Limitado levemente'},
            {valor: 4, texto: '4. Sin impedimiento'}
        ]
    },
    {
        id: 'humedad',
        nombre: 'Humedad',
        descripcion: 'Grado de humedad en la piel',
        opciones: [
            {valor: 1, texto: '1. Constantemente húmeda'},
            {valor: 2, texto: '2. Muy húmeda'},
            {valor: 3, texto: '3. Ocasionalmente húmeda'},
            {valor: 4, texto: '4. Raramente húmeda'}
        ]
    },
    {
        id: 'actividad',
        nombre: 'Actividad',
        descripcion: 'Grado de actividad física',
        opciones: [
            {valor: 1, texto: '1. Confinado a la cama'},
            {valor: 2, texto: '2. Confinado a la silla'},
            {valor: 3, texto: '3. Ocasionalmente camina'},
            {valor: 4, texto: '4. Camina frecuentemente'}
        ]
    },
    {
        id: 'movilidad',
        nombre: 'Movilidad',
        descripcion: 'Control de posición corporal',
        opciones: [
            {valor: 1, texto: '1. Completamente inmóvil'},
            {valor: 2, texto: '2. Muy limitada'},
            {valor: 3, texto: '3. Levemente limitada'},
            {valor: 4, texto: '4. Sin limitaciones'}
        ]
    },
    {
        id: 'nutricion',
        nombre: 'Nutrición',
        descripcion: 'Patrón de ingesta alimentaria',
        opciones: [
            {valor: 1, texto: '1. Completamente inadecuada'},
            {valor: 2, texto: '2. Probablemente inadecuada'},
            {valor: 3, texto: '3. Adecuada'},
            {valor: 4, texto: '4. Excelente'}
        ]
    },
    {
        id: 'friccion',
        nombre: 'Fricción y roce',
        descripcion: 'Roce de piel con sábanas',
        opciones: [
            {valor: 1, texto: '1. Presente'},
            {valor: 2, texto: '2. Potencialmente presente'},
            {valor: 3, texto: '3. Ausente'}
        ]
    }
];

const gradosLPP = [
    {valor: 1, texto: "Grado I: Eritema no blanqueable en piel intacta"},
    {valor: 2, texto: "Grado II: Pérdida parcial de grosor de piel"},
    {valor: 3, texto: "Grado III: Pérdida total del grosor de la piel"},
    {valor: 4, texto: "Grado IV: Pérdida total con daño de estructuras"},
    {valor: 5, texto: "No clasificable"}
];

const medidasPreventivas = {
    bajo: [
        "Aseo e hidratación con lociones en el cuerpo por lo menos una vez al día",
        "Utilizar jabón de pH neutro",
        "Usar colonias o lociones sin alcohol",
        "Mantener piel seca, especialmente en zona de pliegues",
        "Uso de sábanas sin arrugas",
        "Control exceso de humedad por incontinencia",
        "Realizar cambios de ropa cama según necesidad"
    ],
    moderado: [
        "Cambio de posición cada 2 horas",
        "Uso de colchón anti-escara y posicionadores",
        "Examinar diariamente: Prominencias óseas, zonas de exposición a humedad",
        "Evaluar zonas en contacto con dispositivos terapéuticos",
        "Uso de protectores cutáneos y espumas hidrofílicas",
        "Gestión de evaluación nutricional",
        "Indicará prescripción dietética acorde a necesidades"
    ],
    alto: [
        "Cambio de posición cada 2 horas (estricto)", 
        "Colchón anti-escaras de alta especialidad", 
        "Evaluación cada 4 horas de zonas de riesgo", 
        "Uso de apósitos profilácticos", 
        "Valoración por nutricionista en primeras 24 horas", 
        "Suplementación nutricional hiperproteica", 
        "Registro fotográfico de zonas de riesgo"
    ]
};

const puntosAnatomicos = [
    {id: 1,  nombre: "Talones",              x: 4,  y: 21},
    {id: 2,  nombre: "Sacro",                x: 49, y: 20},
    {id: 3,  nombre: "Codos",                x: 61, y: 21},
    {id: 4,  nombre: "Omóplato",             x: 76, y: 20},
    {id: 5,  nombre: "Cabeza",               x: 91, y: 23},
    {id: 6,  nombre: "Maléolo",              x: 10, y: 55},
    {id: 7,  nombre: "Cóndilos",             x: 27, y: 55},
    {id: 8,  nombre: "Trocánter",            x: 49, y: 55},
    {id: 9,  nombre: "Costillas 1",          x: 67, y: 56},
    {id: 10, nombre: "Costillas 2",          x: 73, y: 53},
    {id: 11, nombre: "Acromión",             x: 89, y: 58},
    {id: 12, nombre: "Dedos",                x: 4,  y: 85},
    {id: 13, nombre: "Rodillas",             x: 30, y: 85},
    {id: 14, nombre: "Genitales (hombres)",  x: 47, y: 85},
    {id: 15, nombre: "Mamas 1 (mujeres)",    x: 69, y: 86},
    {id: 16, nombre: "Mamas 2 (mujeres)",    x: 75, y: 86},
    {id: 17, nombre: "Acromión",             x: 89, y: 85},
];

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function inicializarLPP() {
    console.log('Inicializando sistema LPP...');
    
    const valoracionesContainer = document.getElementById('valoraciones-container');
    const btnAgregar            = document.getElementById('btn-agregar-valoracion');
    
    if (!valoracionesContainer || !btnAgregar) {
        console.log('Elementos LPP no encontrados, reintentando...');
        setTimeout(inicializarLPP, 100);
        return;
    }
    
    generarOpcionesBradenCompacto();
    agregarValoracion();
    
    console.log('Sistema LPP inicializado correctamente');
}

function agregarValoracion() {
    console.log('Agregando nueva valoración...');
    const container = document.getElementById('valoraciones-container');
    const id        = valoracionIdCounter++;

    const valoracionHTML = `
        <div class="valoracion-container" data-id="${id}">
            
            <div class="valoracion-header">
                <h2>VALORACIÓN RIESGO LPP - ${new Date().toLocaleDateString('es-ES')}</h2>
                <div class="fecha-auto">${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
            
            <table class="valoracion-tabla">
                <thead>
                    <tr>
                        <th>VARIABLE</th>
                        <th>LARGO</th>
                        <th>NOCHE</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="columna-variable">Puntaje Braden</td>
                        <td class="columna-largo">
                            <input type="number" id="puntaje-braden-largo-${id}" class="input-tabla" min="6" max="23" readonly>
                            <div class="botones-tabla">
                                <button class="btn-calcular-tabla" onclick="abrirModalBraden(${id}, 'largo')">Calcular</button>
                                <button class="btn-medidas-tabla" id="btn-medidas-largo-${id}" style="display:none" onclick="mostrarMedidas(${id}, 'largo')">Medidas</button>
                            </div>
                        </td>
                        <td class="columna-noche">
                            <input type="number" id="puntaje-braden-noche-${id}" class="input-tabla" min="6" max="23" readonly>
                            <div class="botones-tabla">
                                <button class="btn-calcular-tabla" onclick="abrirModalBraden(${id}, 'noche')">Calcular</button>
                                <button class="btn-medidas-tabla" id="btn-medidas-noche-${id}" style="display:none" onclick="mostrarMedidas(${id}, 'noche')">Medidas</button>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="columna-variable">Riesgo</td>
                        <td class="columna-largo">
                            <div id="riesgo-largo-${id}" class="riesgo-indicator-tabla" style="display:none"></div>
                        </td>
                        <td class="columna-noche">
                            <div id="riesgo-noche-${id}" class="riesgo-indicator-tabla" style="display:none"></div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="columna-variable">Presencia UPP</td>
                        <td class="columna-largo">
                            <div class="radio-group-tabla">
                                <label><input type="radio" name="upp-largo-${id}" value="si" onchange="toggleGradoLPP(${id}, 'largo')"> Sí</label>
                                <label><input type="radio" name="upp-largo-${id}" value="no" checked onchange="toggleGradoLPP(${id}, 'largo')"> No</label>
                            </div>
                        </td>
                        <td class="columna-noche">
                            <div class="radio-group-tabla">
                                <label><input type="radio" name="upp-noche-${id}" value="si" onchange="toggleGradoLPP(${id}, 'noche')"> Sí</label>
                                <label><input type="radio" name="upp-noche-${id}" value="no" checked onchange="toggleGradoLPP(${id}, 'noche')"> No</label>
                            </div>
                        </td>
                    </tr>
                    
                    <tr id="grado-lpp-row-${id}" style="display:none">
                        <td class="columna-variable">Grado LPP</td>
                        <td class="columna-largo">
                            <select id="grado-lpp-largo-${id}" class="select-tabla" onchange="actualizarValoracion(${id}, 'gradoLppLargo', this.value)" disabled>
                                <option value="">Seleccionar</option>
                                ${gradosLPP.map(g => `<option value="${g.valor}">${g.texto}</option>`).join('')}
                            </select>
                        </td>
                        <td class="columna-noche">
                            <select id="grado-lpp-noche-${id}" class="select-tabla" onchange="actualizarValoracion(${id}, 'gradoLppNoche', this.value)" disabled>
                                <option value="">Seleccionar</option>
                                ${gradosLPP.map(g => `<option value="${g.valor}">${g.texto}</option>`).join('')}
                            </select>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="columna-variable">Reevaluación c/6h</td>
                        <td class="columna-largo">
                            <div class="radio-group-tabla">
                                <label><input type="radio" name="reevaluacion-largo-${id}" value="si" onchange="toggleReevaluacion(${id}, 'largo')"> Sí</label>
                                <label><input type="radio" name="reevaluacion-largo-${id}" value="no" checked onchange="toggleReevaluacion(${id}, 'largo')"> No</label>
                            </div>
                        </td>
                        <td class="columna-noche">
                            <div class="radio-group-tabla">
                                <label><input type="radio" name="reevaluacion-noche-${id}" value="si" onchange="toggleReevaluacion(${id}, 'noche')"> Sí</label>
                                <label><input type="radio" name="reevaluacion-noche-${id}" value="no" checked onchange="toggleReevaluacion(${id}, 'noche')"> No</label>
                            </div>
                        </td>
                    </tr>
                    
                    <tr id="reevaluacion-row-${id}" style="display:none">
                        <td class="columna-variable">Puntaje Reevaluación</td>
                        <td class="columna-largo">
                            <input type="text" id="puntaje-reevaluacion-largo-${id}" class="input-tabla" readonly>
                            <button id="btn-calc-reev-largo-${id}" class="btn-calcular-tabla" style="margin-top:5px" onclick="abrirModalBraden(${id}, 'largo', true)" disabled>Calcular</button>
                        </td>
                        <td class="columna-noche">
                            <input type="text" id="puntaje-reevaluacion-noche-${id}" class="input-tabla" readonly>
                            <button id="btn-calc-reev-noche-${id}" class="btn-calcular-tabla" style="margin-top:5px" onclick="abrirModalBraden(${id}, 'noche', true)" disabled>Calcular</button>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="columna-variable">¿Hay LPP?</td>
                        <td class="columna-largo">
                            <div class="radio-group-tabla">
                                <label><input type="radio" name="lpp-largo-${id}" value="si" onchange="toggleLPP(${id}, 'largo')"> Sí</label>
                                <label><input type="radio" name="lpp-largo-${id}" value="no" checked onchange="toggleLPP(${id}, 'largo')"> No</label>
                            </div>
                        </td>
                        <td class="columna-noche">
                            <div class="radio-group-tabla">
                                <label><input type="radio" name="lpp-noche-${id}" value="si" onchange="toggleLPP(${id}, 'noche')"> Sí</label>
                                <label><input type="radio" name="lpp-noche-${id}" value="no" checked onchange="toggleLPP(${id}, 'noche')"> No</label>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div id="mapas-container-${id}" class="grupo-mapas" style="display:none"></div>
            
            <div class="datos-admin">
                <div class="form-group">
                    <label>Fecha Notificación</label>
                    <input type="date" id="fecha-notificacion-${id}" value="${new Date().toISOString().split('T')[0]}"
                           onchange="actualizarValoracion(${id}, 'fechaNotificacion', this.value)">
                </div>
                <div class="form-group">
                    <label>Responsable</label>
                    <input type="text" id="responsable-${id}" placeholder="Nombre del responsable"
                           onchange="actualizarValoracion(${id}, 'responsable', this.value)">
                </div>
            </div>

        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', valoracionHTML);
    
    valoraciones.push({
        id,
        puntajeBradenLargo: null, riesgoLargo: null, uppLargo: 'no', gradoLppLargo: null,
        reevaluacionLargo: 'no', puntajeReevaluacionLargo: null, lppLargo: 'no',
        ubicacionesLargo: [], observacionesLargo: '',
        puntajeBradenNoche: null, riesgoNoche: null, uppNoche: 'no', gradoLppNoche: null,
        reevaluacionNoche: 'no', puntajeReevaluacionNoche: null, lppNoche: 'no',
        ubicacionesNoche: [], observacionesNoche: '',
        fechaNotificacion: new Date().toISOString().split('T')[0],
        responsable: '',
        fechaCreacion: new Date().toISOString()
    });
}

function eliminarValoracion(id) {
    if (confirm('¿Eliminar esta valoración?')) {
        document.querySelector(`[data-id="${id}"]`)?.remove();
        valoraciones = valoraciones.filter(v => v.id !== id);
    }
}

// LOGICA DE BLOQUEO PARA GRADO LPP
function toggleGradoLPP(id, turno) {
    const row    = document.getElementById(`grado-lpp-row-${id}`);
    const select = document.getElementById(`grado-lpp-${turno}-${id}`);
    const esSi   = document.querySelector(`input[name="upp-${turno}-${id}"]:checked`)?.value === 'si';
    
    if (select) {
        select.disabled = !esSi;
        if (!esSi) {
            select.value = "";
            actualizarValoracion(id, turno === 'largo' ? 'gradoLppLargo' : 'gradoLppNoche', null);
        }
    }

    const tieneUPP_Largo = document.querySelector(`input[name="upp-largo-${id}"]:checked`)?.value === 'si';
    const tieneUPP_Noche = document.querySelector(`input[name="upp-noche-${id}"]:checked`)?.value === 'si';
    if (row) row.style.display = (tieneUPP_Largo || tieneUPP_Noche) ? 'table-row' : 'none';
}

// LOGICA DE BLOQUEO PARA REEVALUACION
function toggleReevaluacion(id, turno) {
    const row         = document.getElementById(`reevaluacion-row-${id}`);
    const btnCalcular = document.getElementById(`btn-calc-reev-${turno}-${id}`);
    const esSi        = document.querySelector(`input[name="reevaluacion-${turno}-${id}"]:checked`)?.value === 'si';
    
    if (btnCalcular) {
        btnCalcular.disabled = !esSi;
    }

    const necesita_Largo  = document.querySelector(`input[name="reevaluacion-largo-${id}"]:checked`)?.value === 'si';
    const necesita_Noche  = document.querySelector(`input[name="reevaluacion-noche-${id}"]:checked`)?.value === 'si';
    if (row) row.style.display = (necesita_Largo || necesita_Noche) ? 'table-row' : 'none';
}

// LOGICA PARA ¿HAY LPP? (OCULTA MAPAS)
function toggleLPP(id, turno) {
    const tieneLPP  = document.querySelector(`input[name="lpp-${turno}-${id}"]:checked`).value === 'si';
    const valoracion= valoraciones.find(v => v.id === id);
    if (valoracion) {
        const turnoKey = turno.charAt(0).toUpperCase() + turno.slice(1);
        valoracion[`lpp${turnoKey}`] = tieneLPP ? 'si' : 'no';
        if (!tieneLPP) {
            valoracion[`ubicaciones${turnoKey}`] = [];
            valoracion[`gradoLpp${turnoKey}`]    = null;
            const select = document.getElementById(`grado-lpp-${turno}-${id}`);
            if (select) select.value = '';
        }
        actualizarMapas(id);
    }
}

function actualizarMapas(id) {
    const valoracion     = valoraciones.find(v => v.id === id);
    const mapasContainer = document.getElementById(`mapas-container-${id}`);
    if (!valoracion || !mapasContainer) return;

    const tieneLPP_Largo = valoracion.lppLargo === 'si';
    const tieneLPP_Noche = valoracion.lppNoche === 'si';

    if (tieneLPP_Largo || tieneLPP_Noche) {
        mapasContainer.style.display = 'grid';
        mapasContainer.innerHTML     = '';
        if (tieneLPP_Largo) {
            mapasContainer.innerHTML += crearMapaHTML(id, 'largo');
            generarPuntosAnatomicos(id, 'largo');
        }
        if (tieneLPP_Noche) {
            mapasContainer.innerHTML += crearMapaHTML(id, 'noche');
            generarPuntosAnatomicos(id, 'noche');
        }
    } else {
        mapasContainer.style.display = 'none';
        mapasContainer.innerHTML     = '';
    }
}

function crearMapaHTML(id, turno) {
    const turnoCapitalizado = turno.charAt(0).toUpperCase() + turno.slice(1);
    return `
        <div class="mapa-section">
            <h3>Ubicación LPP - ${turnoCapitalizado}</h3>
            <div class="mapa-container">
                <div class="cuerpo-imagen" id="cuerpo-imagen-${turno}-${id}"></div>
                <div class="ubicaciones-seleccionadas">
                    <div style="font-size:11px; color:#666; margin-bottom:4px;">Seleccionadas:</div>
                    <div class="ubicaciones-lista" id="ubicaciones-lista-${turno}-${id}"></div>
                    <textarea id="observaciones-${turno}-${id}" 
                              placeholder="Obs. ${turnoCapitalizado}..."
                              rows="2"
                              onchange="actualizarValoracion(${id}, 'observaciones${turnoCapitalizado}', this.value)"></textarea>
                </div>
            </div>
        </div>
    `;
}

function generarOpcionesBradenCompacto() {
    const container = document.getElementById('braden-compacto');
    if (!container) return;
    container.innerHTML = categoriasBraden.map(cat => `
        <div class="braden-categoria-compacta">
            <label for="select-${cat.id}">
                ${cat.nombre}
                <small style="color:#666; font-weight:normal;"> - ${cat.descripcion}</small>
            </label>
            <select id="select-${cat.id}" onchange="actualizarPuntajeBraden()">
                <option value="">Seleccionar...</option>
                ${cat.opciones.map(op => `<option value="${op.valor}">${op.texto}</option>`).join('')}
            </select>
        </div>
    `).join('');
}

function abrirModalBraden(id, turno, esReevaluacion = false) {
    valoracionActual = {id, turno, esReevaluacion};
    categoriasBraden.forEach(cat => {
        const select = document.getElementById(`select-${cat.id}`);
        if (select) select.value = '';
    });
    document.getElementById('total-braden').textContent       = '0';
    document.getElementById('clasificacion-riesgo').innerHTML = '';
    const modal = document.getElementById('modal-braden');
    if (modal) modal.style.display = 'block';
}

function actualizarPuntajeBraden() {
    let total             = 0;
    let categoriasCompletas = 0;
    categoriasBraden.forEach(cat => {
        const select = document.getElementById(`select-${cat.id}`);
        if (select && select.value) {
            total += parseInt(select.value);
            categoriasCompletas++;
        }
    });
    const totalElement = document.getElementById('total-braden');
    if (totalElement) totalElement.textContent = total;
    const clasificacionElement = document.getElementById('clasificacion-riesgo');
    if (clasificacionElement) {
        if (categoriasCompletas === 6) {
            const clasificacion = clasificarRiesgoBraden(total);
            clasificacionElement.innerHTML =
                `<div class="riesgo-indicator-tabla ${clasificacion.clase}">${clasificacion.texto}</div>`;
        } else {
            clasificacionElement.innerHTML = '';
        }
    }
}

function clasificarRiesgoBraden(puntaje) {
    if (puntaje <= 12) return {texto: 'ALTO RIESGO',     clase: 'riesgo-alto',     tipo: 'alto'};
    if (puntaje <= 14) return {texto: 'MODERADO RIESGO', clase: 'riesgo-moderado', tipo: 'moderado'};
    return                    {texto: 'BAJO RIESGO',     clase: 'riesgo-bajo',     tipo: 'bajo'};
}

function confirmarBraden() {
    if (!valoracionActual) return;
    const totalElement = document.getElementById('total-braden');
    if (!totalElement) return;
    const total = parseInt(totalElement.textContent);
    if (total === 0) { alert('Por favor complete todas las categorías del Braden'); return; }

    let todasCompletas = true;
    categoriasBraden.forEach(cat => {
        const select = document.getElementById(`select-${cat.id}`);
        if (!select || !select.value) todasCompletas = false;
    });
    if (!todasCompletas) { alert('Por favor seleccione una opción en cada categoría'); return; }

    const {id, turno, esReevaluacion} = valoracionActual;
    const campoId = esReevaluacion
        ? `puntaje-reevaluacion-${turno}-${id}`
        : `puntaje-braden-${turno}-${id}`;
    const campo = document.getElementById(campoId);

    if (campo) {
        const clasificacion = clasificarRiesgoBraden(total);
        if (esReevaluacion) {
            campo.value = `${total}: ${clasificacion.texto}`;
        } else {
            campo.value = total;
        }
        if (!esReevaluacion) {
            const riesgoElement = document.getElementById(`riesgo-${turno}-${id}`);
            if (riesgoElement) {
                riesgoElement.textContent = clasificacion.texto;
                riesgoElement.className   = `riesgo-indicator-tabla ${clasificacion.clase}`;
                riesgoElement.style.display = 'inline-block';
            }
            const btnMedidas = document.getElementById(`btn-medidas-${turno}-${id}`);
            if (btnMedidas) {
                btnMedidas.style.display = 'inline-block';
                btnMedidas.setAttribute('data-riesgo', clasificacion.tipo);
            }
        }
        const turnoKey = turno.charAt(0).toUpperCase() + turno.slice(1);
        actualizarValoracion(
            id,
            esReevaluacion ? `puntajeReevaluacion${turnoKey}` : `puntajeBraden${turnoKey}`,
            total
        );
        if (!esReevaluacion) {
            actualizarValoracion(id, `riesgo${turnoKey}`, clasificacion.texto);
        }
    }
    cerrarModal('modal-braden');
}

function generarPuntosAnatomicos(id, turno) {
    const contenedor = document.getElementById(`cuerpo-imagen-${turno}-${id}`);
    if (!contenedor) return;
    contenedor.innerHTML = '';
    puntosAnatomicos.forEach(punto => {
        const div       = document.createElement('div');
        div.className   = 'punto-click';
        div.style.left  = `${punto.x}%`;
        div.style.top   = `${punto.y}%`;
        div.title       = punto.nombre;
        div.onclick     = () => seleccionarPunto(id, turno, punto.id, punto.nombre);
        contenedor.appendChild(div);
    });
}

function seleccionarPunto(id, turno, puntoId, nombre) {
    const valoracion = valoraciones.find(v => v.id === id);
    if (!valoracion) return;
    const turnoKey   = turno.charAt(0).toUpperCase() + turno.slice(1);
    const ubicaciones= valoracion[`ubicaciones${turnoKey}`];
    const index      = ubicaciones.findIndex(u => u.id === puntoId);
    if (index === -1) ubicaciones.push({id: puntoId, nombre});
    else              ubicaciones.splice(index, 1);

    const puntos     = document.querySelectorAll(`#cuerpo-imagen-${turno}-${id} .punto-click`);
    const puntoIndex = puntosAnatomicos.findIndex(p => p.id === puntoId);
    if (puntoIndex !== -1) puntos[puntoIndex].classList.toggle('seleccionado');

    actualizarUbicacionesLista(id, turno);
}

function actualizarUbicacionesLista(id, turno) {
    const valoracion = valoraciones.find(v => v.id === id);
    const lista      = document.getElementById(`ubicaciones-lista-${turno}-${id}`);
    if (!valoracion || !lista) return;
    const turnoKey   = turno.charAt(0).toUpperCase() + turno.slice(1);
    const ubicaciones= valoracion[`ubicaciones${turnoKey}`];
    lista.innerHTML  = ubicaciones.map(u => `
        <div class="ubicacion-tag">
            ${u.nombre}
            <span class="eliminar" onclick="removerUbicacion(${id}, '${turno}', ${u.id})">×</span>
        </div>
    `).join('');
}

function removerUbicacion(id, turno, puntoId) {
    const valoracion = valoraciones.find(v => v.id === id);
    if (!valoracion) return;
    const turnoKey   = turno.charAt(0).toUpperCase() + turno.slice(1);
    const ubicaciones= valoracion[`ubicaciones${turnoKey}`];
    const index      = ubicaciones.findIndex(u => u.id === puntoId);
    if (index !== -1) {
        ubicaciones.splice(index, 1);
        const puntos     = document.querySelectorAll(`#cuerpo-imagen-${turno}-${id} .punto-click`);
        const puntoIndex = puntosAnatomicos.findIndex(p => p.id === puntoId);
        if (puntoIndex !== -1) puntos[puntoIndex].classList.remove('seleccionado');
        actualizarUbicacionesLista(id, turno);
    }
}

function mostrarMedidas(id, turno) {
    const valoracion = valoraciones.find(v => v.id === id);
    if (!valoracion) return;
    const turnoKey   = turno.charAt(0).toUpperCase() + turno.slice(1);
    const puntaje    = valoracion[`puntajeBraden${turnoKey}`];
    if (!puntaje) { alert('Calcule primero el puntaje Braden'); return; }

    const clasificacion = clasificarRiesgoBraden(puntaje);
    const contenedor    = document.getElementById('contenedor-medidas');
    const titulo        = document.getElementById('titulo-medidas');
    if (contenedor && titulo) {
        titulo.textContent  = `Medidas - ${clasificacion.texto}`;
        contenedor.innerHTML= `
            <div class="medidas-categoria medidas-${clasificacion.tipo}">
                <h3>${clasificacion.texto}</h3>
                <ul>
                    ${medidasPreventivas[clasificacion.tipo].map(m => `<li>${m}</li>`).join('')}
                </ul>
            </div>
        `;
        const modal = document.getElementById('modal-medidas');
        if (modal) modal.style.display = 'block';
    }
}

function actualizarValoracion(id, campo, valor) {
    const valoracion = valoraciones.find(v => v.id === id);
    if (valoracion) valoracion[campo] = valor;
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

function resetLPP() {
    valoraciones       = [];
    valoracionIdCounter= 1;
    const container    = document.getElementById('valoraciones-container');
    if (container) container.innerHTML = '';
    agregarValoracion();
    console.log('🧹 LPP reseteado');
}

// HACER FUNCIONES DISPONIBLES GLOBALMENTE
window.agregarValoracion          = agregarValoracion;
window.eliminarValoracion         = eliminarValoracion;
window.toggleGradoLPP             = toggleGradoLPP;
window.toggleReevaluacion         = toggleReevaluacion;
window.toggleLPP                  = toggleLPP;
window.actualizarMapas            = actualizarMapas;
window.crearMapaHTML              = crearMapaHTML;
window.generarOpcionesBradenCompacto = generarOpcionesBradenCompacto;
window.abrirModalBraden           = abrirModalBraden;
window.actualizarPuntajeBraden    = actualizarPuntajeBraden;
window.clasificarRiesgoBraden     = clasificarRiesgoBraden;
window.confirmarBraden            = confirmarBraden;
window.generarPuntosAnatomicos    = generarPuntosAnatomicos;
window.seleccionarPunto           = seleccionarPunto;
window.actualizarUbicacionesLista = actualizarUbicacionesLista;
window.removerUbicacion           = removerUbicacion;
window.mostrarMedidas             = mostrarMedidas;
window.actualizarValoracion       = actualizarValoracion;
window.cerrarModal                = cerrarModal;
window.inicializarLPP             = inicializarLPP;
window.resetLPP                   = resetLPP;
window.valoraciones               = valoraciones;

console.log('Script LPP cargado completamente');