# CIB - Archivos JS separados

## Estructura de archivos

```
js/
├── cib-estado.js       (1) Estado global, fechas, notificaciones
├── cib-storage.js      (2) Captura, guarda y restaura datos del iframe
├── cib-export.js       (3) MAPA_COLUMNAS, TSV, TXT, Python bridge
└── cib-navegacion.js   (4) Interfaz, módulos, modal
```

## Orden de carga en el HTML principal

Agregar al final del <body>, EN ESTE ORDEN:

```html
<script src="ver/cib-estado.js"></script>
<script src="ver/cib-storage.js"></script>
<script src="ver/cib-export.js"></script>
<script src="ver/cib-navegacion.js"></script>
```

Reemplaza la línea anterior:
```html
<!-- ANTES -->
<script src="navegacion.js"></script>

<!-- AHORA -->
<script src="js/cib-estado.js"></script>
<script src="js/cib-storage.js"></script>
<script src="js/cib-export.js"></script>
<script src="js/cib-navegacion.js"></script>
```

---

## Cómo agregar data-campo en los módulos

En cada módulo HTML (por ejemplo ingreso/index.html), agrega
data-campo y data-modulo a cada input:

```html
<!-- ANTES -->
<input type="text" id="patient-name" name="patientName">

<!-- AHORA -->
<input type="text" id="patient-name"
       name="patientName"
       data-campo="nombre"
       data-modulo="ingreso">
```

El nombre en data-campo debe coincidir EXACTAMENTE con la clave
que usa el MAPA_COLUMNAS en cib-export.js.

Por ejemplo, si en MAPA_COLUMNAS tienes:
    'nombre': { fuente: 'ingreso', extraer: (datos) => datos.nombre || ... }

El input debe tener data-campo="nombre"

Mientras un módulo no tenga data-campo, el sistema sigue funcionando
con name= como antes. Puedes migrar módulo por módulo.

---

## Qué hace cada archivo

### cib-estado.js
- Define MODULES (lista de módulos)
- Variables globales: currentModuleIndex, datosCompletos, codigoSecuencia, tsvData, isPythonReady
- Funciones de fechas: separarFechaHora(), formatearFechaEspañol()
- Notificaciones: mostrarNotificacion()

### cib-storage.js
- capturarDatosIframe(): lee data-campo primero, luego name= como respaldo
- guardarDatosModuloActual(): guarda en datosCompletos antes de cambiar módulo
- cargarDatosEnModulo(): restaura datos al volver a un módulo
- restaurarIAAS(), restaurarElementos(): casos especiales
- forzarEventosEnModulo(): dispara eventos change para campos condicionales
- limpiarModuloActual(), nuevoPaciente()
- cargarEstado(), guardarEstado(): persistencia en localStorage

### cib-export.js
- MAPA_COLUMNAS: define cada columna del TSV y cómo extraerla
- generarFilaTSV(), obtenerEncabezadosTSV()
- almacenarTSV(), descargarTSV(), descargarTXT()
- Funciones de formato TXT por módulo (_txtIngreso, _txtIAAS, etc.)
- inicializarPythonBridge(), enviarAPython()

### cib-navegacion.js
- Inicialización del sistema (DOMContentLoaded)
- configurarEventos(): conecta botones e iframe
- cargarModulo(), cambiarModulo()
- mostrarVistaPrevia(), cerrarModal(), generarResumenModulos()
- actualizarInterfaz(), actualizarEstadoModulo(), ajustarAlturaIframe()
- window.CIBNavegacion (API pública)
