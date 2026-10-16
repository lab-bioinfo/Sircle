// ===========================================
// FUNCIONALIDAD MÓDULO IAAS
// ===========================================

// Función para actualizar el color del select según la opción seleccionada
function updateTriageColor() {
    const select = document.getElementById('triage-category');
    const selectedValue = select.value;
    
    // Remover todas las clases de color
    select.classList.remove('triage-c1', 'triage-c2', 'triage-c3', 'triage-c4', 'triage-c5');
    
    // Agregar la clase correspondiente
    if (selectedValue) {
        select.classList.add(`triage-${selectedValue}`);
    }
}

// Función para actualizar opciones seleccionadas en selección múltiple
function updateSelectedOptions(containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const selectedOptions = Array.from(container.querySelectorAll('.selected'))
        .map(option => option.getAttribute('data-value'));
    
    document.getElementById(hiddenInputId).value = selectedOptions.join(',');
}

// ===========================================
// MANEJADORES DE EVENTOS
// ===========================================

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar color del triage
    updateTriageColor();
    
    // Escuchar cambios en el select de triage
    document.getElementById('triage-category').addEventListener('change', updateTriageColor);
    
    // Manejar campos condicionales de precauciones IAAS
    document.querySelectorAll('input[name="requires-precautions"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const precautionsField = document.getElementById('precautions-fields');
            if (this.value === 'si') {
                precautionsField.classList.add('show');
            } else {
                precautionsField.classList.remove('show');
                // Limpiar campos
                document.getElementById('precautions').value = '';
                document.getElementById('transmission-agent').value = '';
                document.getElementById('precaution-days').value = '';
                // Deseleccionar precauciones
                document.querySelectorAll('#precautions-select .multi-select-option').forEach(option => {
                    option.classList.remove('selected');
                });
            }
        });
    });
    
    // Manejar selección múltiple para precauciones IAAS
    document.querySelectorAll('#precautions-select .multi-select-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateSelectedOptions('precautions-select', 'precautions');
        });
    });
    
    // Botón de limpiar
    document.getElementById('clear-btn').addEventListener('click', function() {
        if (confirm('¿Limpiar todos los campos del módulo IAAS?')) {
            // Resetear triage
            const triageSelect = document.getElementById('triage-category');
            triageSelect.value = '';
            updateTriageColor();
            
            // Resetear radios
            document.querySelector('input[name="requires-precautions"][value="no"]').checked = true;
            
            // Ocultar campos condicionales
            document.getElementById('precautions-fields').classList.remove('show');
            
            // Limpiar otros selects
            document.getElementById('transmission-agent').value = '';
            document.getElementById('precaution-days').value = '';
            
            // Deseleccionar precauciones
            document.querySelectorAll('#precautions-select .multi-select-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Limpiar campo oculto
            document.getElementById('precautions').value = '';
            
            alert('Módulo IAAS limpiado.');
        }
    });
    
    // Botón de prueba
    document.getElementById('test-btn').addEventListener('click', function() {
        // Validar categoría de triage
        const triage = document.getElementById('triage-category').value;
        if (!triage) {
            alert('Debe seleccionar una categoría de triage');
            return;
        }
        
        // Mostrar datos recopilados
        const data = {
            triage: triage,
            requiresPrecautions: document.querySelector('input[name="requires-precautions"]:checked').value,
            precautions: document.getElementById('precautions').value,
            transmissionAgent: document.getElementById('transmission-agent').value,
            precautionDays: document.getElementById('precaution-days').value
        };
        
        console.log('Datos del módulo IAAS:', data);
        alert('Datos del módulo IAAS:\n' + 
              'Triage: ' + triage.toUpperCase() + '\n' +
              'Precauciones: ' + (data.requiresPrecautions === 'si' ? 'Sí' : 'No') + '\n' +
              'Ver consola para más detalles.');
    });
});

// ===========================================
// FUNCIONES DE UTILIDAD
// ===========================================

// Función para obtener los datos del formulario
function getFormData() {
    return {
        triage: document.getElementById('triage-category').value,
        requiresPrecautions: document.querySelector('input[name="requires-precautions"]:checked').value,
        precautions: document.getElementById('precautions').value,
        transmissionAgent: document.getElementById('transmission-agent').value,
        precautionDays: document.getElementById('precaution-days').value
    };
}

// Función para validar el formulario
function validateForm() {
    const triage = document.getElementById('triage-category').value;
    if (!triage) {
        alert('Debe seleccionar una categoría de triage');
        return false;
    }
    return true;
}

// Función para resetear el formulario
function resetForm() {
    // Resetear triage
    const triageSelect = document.getElementById('triage-category');
    triageSelect.value = '';
    updateTriageColor();
    
    // Resetear radios
    document.querySelector('input[name="requires-precautions"][value="no"]').checked = true;
    
    // Ocultar campos condicionales
    document.getElementById('precautions-fields').classList.remove('show');
    
    // Limpiar otros campos
    document.getElementById('transmission-agent').value = '';
    document.getElementById('precaution-days').value = '';
    
    // Deseleccionar precauciones
    document.querySelectorAll('#precautions-select .multi-select-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Limpiar campo oculto
    document.getElementById('precautions').value = '';
}

// Esta función debe existir y devolver un objeto con los datos
function obtenerDatosFormulario() {
    return {
        // Aquí todos los datos del módulo
        triage: document.getElementById('triage-category').value,
        requiresPrecautions: document.querySelector('input[name="requires-precautions"]:checked')?.value,
        precautions: document.getElementById('precautions').value,
        transmissionAgent: document.getElementById('transmission-agent').value,
        precautionDays: document.getElementById('precaution-days').value
    };
}

// Agregar al final de IAAS.js
function cargarDatosFormulario(datos) {
    if (!datos) return;
    
    // Restaurar triage
    if (datos.triage) {
        const select = document.getElementById('triage-category');
        select.value = datos.triage;
        updateTriageColor();
    }
    
    // Restaurar precauciones
    if (datos.requiresPrecautions) {
        const radio = document.querySelector(`input[name="requires-precautions"][value="${datos.requiresPrecautions}"]`);
        if (radio) {
            radio.checked = true;
            
            // Disparar evento para mostrar/ocultar campos
            const event = new Event('change');
            radio.dispatchEvent(event);
            
            // Restaurar otros campos después de que se muestren
            setTimeout(() => {
                if (datos.requiresPrecautions === 'si') {
                    if (datos.precautions) {
                        // Restaurar selección múltiple
                        const precautionsArray = datos.precautions.split(',');
                        document.querySelectorAll('#precautions-select .multi-select-option').forEach(option => {
                            if (precautionsArray.includes(option.getAttribute('data-value'))) {
                                option.classList.add('selected');
                            }
                        });
                        document.getElementById('precautions').value = datos.precautions;
                    }
                    
                    if (datos.transmissionAgent) {
                        document.getElementById('transmission-agent').value = datos.transmissionAgent;
                    }
                    
                    if (datos.precautionDays) {
                        document.getElementById('precaution-days').value = datos.precautionDays;
                    }
                }
            }, 100);
        }
    }
}

// Exportar la función
window.cargarDatosFormulario = cargarDatosFormulario;

// Y debe estar exportada así:
window.obtenerDatosFormulario = obtenerDatosFormulario;

// Al final del archivo, después de todas las funciones:
window.obtenerDatosFormulario = obtenerDatosFormulario;
window.limpiarFormulario = limpiarFormulario;

// Si tienes otras funciones específicas del módulo, también puedes exportarlas
window.ModuloIAAS = {
    obtenerDatos: obtenerDatosFormulario,
    validar: validarFormulario,
    limpiar: limpiarFormulario
};

