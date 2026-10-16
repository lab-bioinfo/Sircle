// ====================
// cib-estado.js
// Estado global compartido entre todos los módulos
// Debe cargarse PRIMERO en el HTML
// ====================

const MODULES = [
    {
        id: 'ingreso',
        name: 'Ingreso del Paciente',
        path: 'ingreso/index.html',
        icon: 'fa-user-injured',
        requiredFields: []
    },
    {
        id: 'iaas',
        name: 'IAAS',
        path: 'IAAS/index.html',
        icon: 'fa-shield-virus',
        requiredFields: []
    },
    {
        id: 'elementos',
        name: 'Elementos Invasivos',
        path: 'elementos-invasivos/index.html',
        icon: 'fa-procedures',
        requiredFields: []
    },
    {
        id: 'indicaciones',
        name: 'Indicaciones Médicas',
        path: 'indicaciones-medicas/index.html',
        icon: 'fa-file-medical-alt',
        requiredFields: []
    },
    {
        id: 'examenes',
        name: 'Exámenes',
        path: 'examenes/index.html',
        icon: 'fa-vial',
        requiredFields: []
    },
    {
        id: 'control-signos',
        name: 'Control de Signos',
        path: 'control-signos/index.html',
        icon: 'fas fa-clipboard-list',
        requiredFields: []
    },
    {
        id: 'balance',
        name: 'Balance Hidrico',
        path: 'balance/balance.html',
        icon: 'fas fa-clipboard-list',
        requiredFields: []
    },
    {
        id: 'examen-fisico',
        name: 'Examen Físico',
        path: 'examen-fisico/index.html',
        icon: 'fas fa-clipboard-list',
        requiredFields: []
    },
    {
        id: 'plan-enfermeria',
        name: 'Plan de Enfermeria',
        path: 'plan-enfermeria/index.html',
        icon: 'fas fa-clipboard-list',
        requiredFields: []
    },
    {
        id: 'atencion-1',
        name: 'Atencion',
        path: 'atencion-1/index.html',
        icon: 'fa-procedures',
        requiredFields: []
    },
    {
        id: 'prec-iaas',
        name: 'Prevencion',
        path: 'prec-iaas/index.html',
        icon: 'fa-procedures',
        requiredFields: []
    },
    {
        id: 'evolucion',
        name: 'Evolucion',
        path: 'evolucion/index.html',
        icon: 'fa-procedures',
        requiredFields: []
    },
    {
        id: 'hhha',
        name: 'Indicadores HHHA',
        path: 'hhha/index.html',
        icon: 'fa-procedures',
        requiredFields: []
    },
    
    
];

// Variables de estado — accesibles desde todos los archivos js
let currentModuleIndex = 0;
let datosCompletos = {};
let codigoSecuencia = 1;
let tsvData = [];
let isPythonReady = false;

// ====================
// FUNCIONES DE UTILIDAD PARA FECHAS
// Están aquí porque las usan tanto cib-storage como cib-export
// ====================

function separarFechaHora(fechaHoraString) {
    if (!fechaHoraString) return { fecha: '', hora: '' };

    try {
        if (fechaHoraString.includes('T')) {
            const [fecha, hora] = fechaHoraString.split('T');
            return { fecha, hora };
        }
        if (fechaHoraString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return { fecha: fechaHoraString, hora: '' };
        }
        if (fechaHoraString.match(/^\d{2}:\d{2}$/)) {
            return { fecha: '', hora: fechaHoraString };
        }
        const fechaObj = new Date(fechaHoraString);
        if (!isNaN(fechaObj.getTime())) {
            return {
                fecha: fechaObj.toISOString().split('T')[0],
                hora: fechaObj.toTimeString().substring(0, 5)
            };
        }
        return { fecha: fechaHoraString, hora: '' };
    } catch (error) {
        console.warn('Error al separar fecha/hora:', error);
        return { fecha: fechaHoraString, hora: '' };
    }
}

function formatearFechaEspañol(fechaString) {
    if (!fechaString) return '';
    try {
        if (fechaString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = fechaString.split('-');
            return `${day}/${month}/${year}`;
        }
        return fechaString;
    } catch (error) {
        return fechaString;
    }
}

// ====================
// NOTIFICACIONES
// Está aquí porque la usan varios archivos
// ====================

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' :
                           tipo === 'error'   ? 'exclamation-circle' :
                           tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    notificacion.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        padding: 15px 20px; border-radius: 8px;
        background: ${tipo === 'success' ? '#28a745' :
                     tipo === 'error'   ? '#dc3545' :
                     tipo === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999; display: flex; align-items: center;
        gap: 10px; animation: slideIn 0.3s ease; max-width: 400px;
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// Estilos de animación para notificaciones
if (!document.querySelector('#notificacion-styles')) {
    const style = document.createElement('style');
    style.id = 'notificacion-styles';
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
    document.head.appendChild(style);
}
