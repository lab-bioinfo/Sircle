// ===========================================
// BRIDGE PARA COMUNICACIÓN CON PYTHON
// ===========================================

// Configuración de Python WebView
const PYTHON_CONFIG = {
    endpoint: 'http://172.22.251.49:5000/api',
    timeout: 10000,
    retryAttempts: 3
};

// Clase para manejar comunicación con Python
class PythonBridge {
    constructor() {//el this. es pythonbrige.
        this.isConnected = false;//estado desconectado
        this.queue = [];//los datos que no se envian de inmediato se almacenan aca
        this.init();//llama a init para conectar
    }
    
    async init() {
        try {
            // Intentar conectar con Python
            await this.testConnection();
            this.isConnected = true;//si responde lo cambia a true
            console.log('✅ Conexión con Python establecida');
            
            // Procesar cola pendiente
            this.processQueue();
        } catch (error) {
            console.log('⚠️ Python no disponible, usando modo offline');//si no responde y funciona en modo offline
            this.isConnected = false;
        }
    }
    
    async testConnection() {
        try {
            //Intenta hacer petición al endpoint /health de Python
            const response = await fetch(`${PYTHON_CONFIG.endpoint}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(2000)
            });
            
            if (!response.ok) throw new Error('Python no responde');//si la respuesta no es exitosa 
            return await response.json();//si es exitosa
        } catch (error) {
             //Si hay cualquier error (timeout, red, etc.), lanza error
            throw new Error('No se pudo conectar con Python');
        }
    }
    
    async almacenarTSV(datos) {
        const payload = {//crea objeto payload
            codigo: datos.codigo || `SIRCLE${Date.now().toString().slice(-4)}`,//identificador unico
            datos: datos.datos || {},//los datos a guardar tsv
            timestamp: new Date().toISOString(),
            tipo: 'ingreso_paciente'
        };
        
        if (this.isConnected) {//decide donde guardar
            return await this.sendToPython('/almacenar_tsv', payload);//si hay conexion a python y es el endopoint en este
        } else {
            // Guardar en localStorage hasta que Python esté disponible
            return this.saveToLocalQueue(payload);
        }
    }
    
    async obtenerTSV() {//cuando se quiere descargar el archivo ve si los saca de servidor o navegador si esta offline
        if (this.isConnected) {
            return await this.sendToPython('/obtener_tsv', {});
        } else {
            // Obtener de localStorage
            return this.getFromLocalStorage();
        }
    }
    

    
    async sendToPython(endpoint, data) {
        //inetnta 3 veces
        for (let attempt = 1; attempt <= PYTHON_CONFIG.retryAttempts; attempt++) {
            try {
                //Envía la petición HTTP POST al servidor Python
                const response = await fetch(`${PYTHON_CONFIG.endpoint}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    signal: AbortSignal.timeout(PYTHON_CONFIG.timeout)
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const result = await response.json();
                console.log(`✅ Datos enviados a Python: ${endpoint}`, result);
                return result;
                
            } catch (error) {
                //  Si hay error en el intento actual
                console.log(`⚠️ Intento ${attempt} fallado para ${endpoint}:`, error);
                
                // Si ya fue el último intento, lanza error final
                if (attempt === PYTHON_CONFIG.retryAttempts) {
                    throw new Error(`No se pudo conectar con Python: ${error.message}`);
                }
                
                // Si no fue el último intento, espera antes de reintentar
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    saveToLocalQueue(data) {//funcion se usa mas arriba 
        try {
            // Obtener cola actual u obtiene la vacia
            const queue = JSON.parse(localStorage.getItem('python_queue') || '[]');
            
            // Agregar nuevo dato a la cola
            queue.push({
                ...data,
                intentos: 0,
                fecha_pendiente: new Date().toISOString()
            });
            
            // Guardar cola en localstorage
            localStorage.setItem('python_queue', JSON.stringify(queue));
            
            console.log('📝 Datos guardados en cola local:', queue.length, 'pendientes');
            
            return {//confirmacion exitosa
                success: true,
                message: 'Datos guardados en cola local',
                queue_length: queue.length
            };
        } catch (error) {//si hay error al guardar registra y lanza error
            console.error('Error guardando en cola local:', error);
            throw error;
        }
    }
    
    async processQueue() {
        if (!this.isConnected) return;//si no hay conexion no ahce nada
        
        try {//obtiene datos pendientes de localstorage
            const queue = JSON.parse(localStorage.getItem('python_queue') || '[]');
            if (queue.length === 0) return;//si no hay pendientes termina
            
            console.log(`🔄 Procesando ${queue.length} datos pendientes...`);
            
            const resultados = [];//guardar exitos y fallos
            const errores = [];
            
            for (const item of queue) {//va elemento por elemento
                try {
                    // Enviar a Python
                    const result = await this.almacenarTSV(item);
                    resultados.push({//si tiene exito lo marca como enviado true
                        ...item,
                        enviado: true,
                        fecha_envio: new Date().toISOString()
                    });
                    
                    console.log(`✅ Pendiente procesado: ${item.codigo}`);
                    
                } catch (error) {//si falla incrementa el contador
                    errores.push({
                        ...item,
                        error: error.message,
                        intentos: (item.intentos || 0) + 1
                    });
                    
                    console.log(`❌ Error procesando pendiente: ${item.codigo}`, error);
                }
            }
            
            // Guardar errores para reintentar más tarde
            if (errores.length > 0) {
                localStorage.setItem('python_queue', JSON.stringify(errores));
                console.log(`${errores.length} errores guardados para reintentar`);
            } else {//si no hubo falla limpia cola
                localStorage.removeItem('python_queue');
            }
            
            return {//resumen proceso
                success: true,
                procesados: resultados.length,
                errores: errores.length
            };
            
        } catch (error) {
            console.error('Error procesando cola:', error);
        }
    }
    
    getFromLocalStorage() {
        try {
              //intenta obtener datos TSV guardados en localStorage
            const data = JSON.parse(localStorage.getItem('cib_tsv_data') || '[]');
            return {//retorna los datos
                success: true,
                data: data,
                count: data.length,
                source: 'localStorage'
            };
        } catch (error) {//si error retorna estructura error
            return {
                success: false,
                error: error.message,
                data: []//array vacio por que no hay datos
            };
        }
    }
}


/** para cambiar el estado de ingreso del paciente en la base de datos MySQL a "finalizado".
 * Notifica al servidor Python/MySQL que el ingreso del paciente actual se ha finalizado.
 * @param {string} [codigoSesion] - Código de sesión único del paciente.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
async function finalizarIngresoEnBackend(codigoSesion) {
    // Si no nos pasan el código por parámetro, lo buscamos en el localStorage
    const sesion = codigoSesion || 
                   localStorage.getItem('cib_codigo_sesion') || 
                   (JSON.parse(localStorage.getItem('cib_estado') || '{}')).codigo_sesion;

    if (!sesion) {
        console.warn('⚠️ No se encontró un código de sesión válido para finalizar.');
        return { success: false, message: 'No se encontró código de sesión.' };
    }

    try {
        // Asegúrate de que API_URL apunte a tu servidor (ej. http://192.168.1.50:5000/api)
        const url = typeof API_URL !== 'undefined' ? `${API_URL}/finalizar_ingreso` : 'http://172.22.251.49:5000/api/finalizar_ingreso';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                codigo_sesion: sesion
            })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Estado en MySQL actualizado a "finalizado":', result);
            return result;
        } else {
            console.error('❌ El servidor respondió con error:', result.message);
            return result;
        }
    } catch (error) {
        console.error('❌ Error de conexión al intentar finalizar ingreso:', error);
        return { success: false, message: error.message };
    }
}

// Inicializar bridge global
//crea nueva instancia de la clase pythonbrige
//Haciéndola disponible globalmente en toda la aplicación
window.pythonBridge = new PythonBridge();
