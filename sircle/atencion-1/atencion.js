// ===========================================
// MÓDULO ATENCIÓN DE ENFERMERÍA
// ===========================================

let opcionesAtencion = {};

// ============ CARGA DE LISTAS Y AUTOCOMPLETE ============

/**
 * Carga las opciones desde el JSON y puebla los datalists para la búsqueda
 */
function inicializarListasAtencion() {
  fetch('../listas/atencion1.json')
    .then(response => {
      if (!response.ok) throw new Error('Error al cargar atencion1.json');
      return response.json();
    })
    .then(data => {
      opcionesAtencion = data;
      crearDatalists();
      vincularEventosAutocomplete();
      console.log('✅ Listas de atención cargadas y buscadores vinculados');
    })
    .catch(err => console.error('Error:', err));
}

/**
 * Genera dinámicamente el contenido de los <datalist> del HTML
 */
function crearDatalists() {
  const mapeoListas = {
    'csv_horario': 'csv_horario_opciones',
    'posiciones_camilla_list': 'posiciones_camilla_list_opciones',
    'tipo_dispositivo_oxigeno': 'tipo_dispositivo_oxigeno_opciones'
  };

  for (const [keyJson, idDatalist] of Object.entries(mapeoListas)) {
    const datalist = document.getElementById(idDatalist);
    const listaOpciones = opcionesAtencion[keyJson];
    
    if (datalist && listaOpciones) {
      datalist.innerHTML = listaOpciones
        .map(opt => `<option value="${opt.display}" data-value="${opt.value}">`)
        .join('');
    }
  }
}

/**
 * Sincroniza lo que el usuario escribe con el ID técnico (input hidden)
 */
function vincularEventosAutocomplete() {
  document.querySelectorAll('.input-autocomplete').forEach(input => {
    input.addEventListener('input', function() {
      const listId = this.getAttribute('list');
      const targetId = this.getAttribute('data-target');
      const options = document.querySelectorAll(`#${listId} option`);
      const hiddenInput = document.getElementById(targetId);
      
      let foundValue = "";
      options.forEach(opt => {
        if (opt.value === this.value) {
          foundValue = opt.getAttribute('data-value');
        }
      });
      
      if (hiddenInput) {
        hiddenInput.value = foundValue;
      }
    });
  });
}

// ============ CARGA DINÁMICA DEL MÓDULO LPP ============

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar listas JSON
  inicializarListasAtencion();

  // Cargar módulo LPP
  const lppContainer = document.getElementById('lpp-container');
  if (!lppContainer) return;

  fetch('lpp.html')
    .then(response => {
      if (!response.ok) throw new Error('No se pudo cargar el módulo LPP');
      return response.text();
    })
    .then(html => {
      lppContainer.innerHTML = html;

      const script = document.createElement('script');
      script.src = 'lpp.js';
      script.onload = function() {
        console.log('Script LPP cargado correctamente');
        if (typeof window.inicializarLPP === 'function') {
          window.inicializarLPP();
        }
      };
      script.onerror = function() {
        console.error('Error al cargar el script LPP');
        lppContainer.innerHTML += '<p style="color:#d32f2f; padding:10px;">Error al cargar el módulo LPP</p>';
      };
      document.body.appendChild(script);
    })
    .catch(error => {
      console.error('Error:', error);
      lppContainer.innerHTML = '<p style="color:#d32f2f; padding:10px;">Error al cargar el módulo LPP</p>';
    });
});

// ============================================================
// OBTENER DATOS PARA EXPORTACIÓN
// ============================================================

function obtenerDatosFormulario() {
  const getRadio = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  };

  const getId = (id) => document.getElementById(id)?.value || '';

  // ── 1. Campos de atención (Leídos desde los inputs hidden y estándar) ──
  const datos = {
    csv_horario:             getId('csv_horario'),
    monitoreo_continuo:      getRadio('monitoreo_continuo'),
    cama_camilla:            getRadio('cama_camilla'),
    posicion_camilla:        getId('posicion_camilla'),
    fio2:                    getId('fio2'),
    tipo_dispositivo:        getId('tipo_dispositivo'),
    proteccion_piel_o2:      getRadio('proteccion_piel_o2'),
    aspiracion_secreciones:  getRadio('aspiracion_secreciones'),
    agua_humidificador:      getRadio('agua_humidificador'),
    rotacion_dispositivo:    getRadio('rotacion_dispositivo'),
    proteccion_piel_aseo:    getRadio('proteccion_piel_aseo'),
    resp_cnaf:               getId('resp_cnaf'),
    resp_vmni:               getId('resp_vmni'),
    resp_vmi:                getId('resp_vmi'),
  };

  // ── 2. Datos LPP ──────
  const lppArray = [];
  if (Array.isArray(window.valoraciones)) {
    window.valoraciones.forEach(v => {
      if (v.puntajeBradenLargo == null && v.puntajeBradenNoche == null) return;
      lppArray.push({ ...v });
    });
  }

  datos.datos_lpp = lppArray;
  datos.timestamp = new Date().toISOString();

  return datos;
}

// ============================================================
// LIMPIAR FORMULARIO
// ============================================================

function limpiarFormulario() {
  // Resetear inputs hidden y estándares
  ['csv_horario', 'posicion_camilla', 'tipo_dispositivo', 'fio2', 'resp_cnaf', 'resp_vmni', 'resp_vmi'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Resetear inputs de texto visibles del buscador
  ['csv_horario_input', 'posicion_camilla_input', 'tipo_dispositivo_input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Resetear radios al valor por defecto (no)
  [
    'monitoreo_continuo', 'cama_camilla', 'proteccion_piel_o2',
    'aspiracion_secreciones', 'agua_humidificador',
    'rotacion_dispositivo', 'proteccion_piel_aseo'
  ].forEach(name => {
    const radioNo = document.querySelector(`input[name="${name}"][value="no"]`) || 
                    document.querySelector(`input[name="${name}"][value="camilla"]`);
    if (radioNo) radioNo.checked = true;
  });

  // Limpiar LPP
  if (typeof window.resetLPP === 'function') {
    window.resetLPP();
  }
}

// Exportar al sistema de navegación
window.obtenerDatosFormulario = obtenerDatosFormulario;
window.limpiarFormulario      = limpiarFormulario;