// ===========================================
// MÓDULO INGRESO - DINÁMICO Y AUTOCOMPLETE (CORREGIDO)
// ===========================================

let opcionesIngreso = {};

// ========== CARGA DE DATOS Y RENDERIZADO ==========
document.addEventListener('DOMContentLoaded', function() {
    fetch('../listas/ingreso.json')
        .then(response => response.json())
        .then(data => {
            opcionesIngreso = data;
            
            // Renderizar listas según el umbral de 7 opciones
            renderizarLista('health-insurance', 'prevision', 'container-prevision');
            renderizarLista('origin', 'procedencia', 'container-procedencia');
            renderizarLista('admission-diagnosis', 'diagnostico_ingreso', 'container-diagnostico');
            renderizarLista('dialysis-center', 'centro_dialisis', 'container-dialisis-centro');

            // Multi-selects
            poblarMultiSelect('morbid-history-select', data.antecedentes_morbidos);
            poblarMultiSelect('allergies-select', data.alergias);

            // ACTIVAR RADIOS Y EVENTOS MANUALES
            configurarRadiosCondicionales();
            updateDateTime();
            
            console.log('✅ Módulo Ingreso inicializado con radios condicionales');
        })
        .catch(err => console.error('Error cargando ingreso.json:', err));
});

/**
 * NUEVA FUNCIÓN: Maneja la visibilidad de Familiar y Alergias al marcar "Sí"
 */
function configurarRadiosCondicionales() {
    // 1. Lógica para Acompañamiento / Familiar Responsable
    const radiosComp = document.getElementsByName('companionship');
    const fieldComp = document.getElementById('responsible-field');
    
    radiosComp.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si') {
                fieldComp.classList.add('show');
                fieldComp.querySelectorAll('input, select').forEach(el => el.required = true);
            } else {
                fieldComp.classList.remove('show');
                fieldComp.querySelectorAll('input, select').forEach(el => el.required = false);
            }
        });
    });

    // 2. Lógica para Alergias (Radio inicial)
    const radiosAllergy = document.getElementsByName('allergies');
    const fieldAllergy = document.getElementById('allergies-field');
    
    radiosAllergy.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si') {
                fieldAllergy.classList.add('show');
            } else {
                fieldAllergy.classList.remove('show');
                // Limpiar selecciones si marca 'no'
                fieldAllergy.querySelectorAll('.multi-select-option.selected').forEach(opt => opt.classList.remove('selected'));
                document.getElementById('allergies-list').value = '';
                document.getElementById('allergies-other-field').classList.remove('show');
            }
        });
    });
}

/**
 * Renderiza un select o un input-autocomplete basado en la cantidad de opciones.
 */
function renderizarLista(elementId, apiKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const opciones = opcionesIngreso[apiKey] || [];
    const threshold = 7;

    const label = container.querySelector('label');
    container.innerHTML = '';
    container.appendChild(label);

    if (opciones.length >= threshold) {
        // MODO AUTOCOMPLETE
        const input = document.createElement('input');
        input.type = 'text';
        input.id = elementId + '_input';
        input.className = 'input-autocomplete';
        input.placeholder = 'Escribe para buscar...';
        input.setAttribute('list', elementId + '_datalist');

        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = elementId;
        hidden.name = elementId;

        const datalist = document.createElement('datalist');
        datalist.id = elementId + '_datalist';

        opciones.forEach(opt => {
            if (opt.value) {
                const option = document.createElement('option');
                option.value = opt.display;
                datalist.appendChild(option);
            }
        });

        container.appendChild(input);
        container.appendChild(hidden);
        container.appendChild(datalist);

        configurarAutocomplete(input, hidden, opciones);
    } else {
        // MODO SELECT TRADICIONAL
        const select = document.createElement('select');
        select.id = elementId;
        select.name = elementId;
        select.required = true;

        opciones.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.display;
            select.appendChild(option);
        });

        container.appendChild(select);
        
        if (elementId === 'admission-diagnosis') {
            select.addEventListener('change', function() {
                document.getElementById('diagnosis-other-field')?.classList.toggle('show', this.value === 'otro');
            });
        }
    }
}

function configurarAutocomplete(input, hidden, opciones) {
    input.addEventListener('input', function() {
        const val = this.value;
        const encontrada = opciones.find(o => o.display === val);
        if (encontrada) {
            hidden.value = encontrada.value;
            if (hidden.id === 'admission-diagnosis') {
                document.getElementById('diagnosis-other-field')?.classList.toggle('show', encontrada.value === 'otro');
            }
        } else {
            hidden.value = '';
        }
    });

    input.addEventListener('blur', function() {
        setTimeout(() => {
            if (!opciones.some(o => o.display === this.value)) {
                this.value = '';
                hidden.value = '';
            }
        }, 150);
    });
}

function poblarMultiSelect(id, opciones) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    opciones.forEach(opt => {
        if (opt.value === "") return;
        const div = document.createElement('div');
        div.className = 'multi-select-option';
        div.dataset.value = opt.value;
        div.textContent = opt.display;
        div.addEventListener('click', function() {
            this.classList.toggle('selected');
            actualizarMultiSelectHidden(id);
        });
        container.appendChild(div);
    });
}

function actualizarMultiSelectHidden(containerId) {
    const container = document.getElementById(containerId);
    const hiddenId = containerId === 'morbid-history-select' ? 'morbid-history' : 'allergies-list';
    const hidden = document.getElementById(hiddenId);
    
    const seleccionados = Array.from(container.querySelectorAll('.selected'))
        .map(el => el.getAttribute('data-value'));
    
    hidden.value = seleccionados.join(',');
    
    if (containerId === 'morbid-history-select') {
        document.getElementById('morbid-other-field').classList.toggle('show', seleccionados.includes('otro'));
    } else if (containerId === 'allergies-select') {
        document.getElementById('allergies-other-field').classList.toggle('show', seleccionados.includes('otro'));
    }
}

// ========== FUNCIONES DE DATOS (MANTENIDAS) ==========

function obtenerDatosFormulario() {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';

    return {
        patientName:      getVal('patient-name'),
        patientLastname:  getVal('patient-lastname'),
        patientAge:       getVal('patient-age'),
        patientRUT:       getVal('patient-rut'),
        admissionDate:    getVal('ingreso-fecha'),
        birthDate:        getVal('birth-date'),
        accountNumber:    getVal('account-number'),
        healthInsurance:  getVal('health-insurance'),
        origin:           getVal('origin'),
        companionship:    getRadio('companionship'),
        responsibleFamily: getVal('familiar-responsable'),
        parentesco:       getVal('parentesco'),
        contactPhone:     getVal('contact-phone'),
        admissionDiagnosis: getVal('admission-diagnosis'),
        diagnosisOther:     getVal('diagnosis-other'),
        morbidHistory:      getVal('morbid-history'),
        morbidOther:        getVal('morbid-other'),
        allergies:          getRadio('allergies'),
        allergiesList:      getVal('allergies-list'),
        allergiesOther:     getVal('allergies-other'),
        noPuncture:         getRadio('no-puncture'),
        noBloodPressure:    getRadio('no-bp'),
        bpExtremidad:       getVal('bp-extremidad'),
        fav:                getRadio('fav'),
        dialysisDays:       getVal('dialysis-days'),
        dialysisCenter:     getVal('dialysis-center'),
        timestamp:          new Date().toISOString(),
        formType:           'ingreso_paciente'
    };
}

function limpiarFormulario() {
    document.getElementById('patient-form').reset();
    document.querySelectorAll('.multi-select-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.conditional-field').forEach(el => el.classList.remove('show'));
    updateDateTime();
}

function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('es-CL');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
    
    
}

// Calcular edad
document.getElementById('birth-date').addEventListener('change', function() {
    const birth = new Date(this.value);
    const age = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
    document.getElementById('patient-age').value = age >= 0 ? age : 0;
});

// Formato RUT
document.getElementById('patient-rut').addEventListener('input', function(e) {
    let v = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (v.length < 2) return;
    e.target.value = v.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + '-' + v.slice(-1);
});

// Exportar al sistema global
window.obtenerDatosFormulario = obtenerDatosFormulario;
window.limpiarFormulario = limpiarFormulario;