"""
Backend Server - Python
Recibe y almacena datos 
"""

from flask import Flask, request, jsonify, send_file #Framework web mínimo para crear API
from flask_cors import CORS#Permite conexiones desde navegador web
import pandas as pd #para manipular los datos
import sqlite3 #de momento, luego cambiar a mysql
from datetime import datetime
import os # habilita funcionalidades para gestionar archivos, directorios (carpetas), rutas, y acceder a variables de entorno
import json
import bcrypt              # para verificar contraseñas con hash
import mysql.connector     # para conectarse a MySQL

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configuración
# Estos archivos viven en una carpeta HERMANA del proyecto (un
# nivel arriba), fuera de lo que Live Server sirve, para que no
# provoque recargas de página al escribir en ellos.
CARPETA_PROYECTO = os.path.dirname(os.path.abspath(__file__))
CARPETA_DATOS = os.path.join(CARPETA_PROYECTO, '..', 'sircle_backend_data')
os.makedirs(CARPETA_DATOS, exist_ok=True)

DATABASE_FILE = os.path.join(CARPETA_DATOS, 'cib_database.db')
TSV_FOLDER = os.path.join(CARPETA_DATOS, 'tsv_files')
LOG_FILE = os.path.join(CARPETA_DATOS, 'cib_log.txt')

# Datos de conexión a MySQL.
# Cambia la contraseña por la que le pusiste a 'sircle_app'
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'genodata',
    'password': 'bioinfo',
    'database': 'sircle_db'
}

def get_mysql_connection():
    """
    Crea y retorna una conexión a la base de datos MySQL usando la configuración global.
    """
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None

# Crear carpetas si no existen
os.makedirs(TSV_FOLDER, exist_ok=True)

def init_database():
    """Inicializar base de datos SQLite (solo lo que aún no migramos a MySQL)"""
    conn = sqlite3.connect(DATABASE_FILE)#conn de conexion
    cursor = conn.cursor() #puntero/controlador para ejecutar comandos SQL
    
    # Tabla de ingresos (legacy, usada por /api/almacenar_tsv y /api/obtener_tsv,
    # que todavía no migramos -- no confundir con la tabla "ingresos" de MySQL)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ingresos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        codigo TEXT UNIQUE NOT NULL, 
        timestamp DATETIME NOT NULL,
        datos TEXT NOT NULL,
        modulo_ingreso TEXT,
        modulo_iaas TEXT,
        modulo_indicaciones TEXT,
        modulo_examenes TEXT,
        modulo_elementos TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Tabla de logs (se mantiene en SQLite por ahora)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        accion TEXT NOT NULL,
        detalles TEXT,
        ip_address TEXT
    )
    ''')
    conn.commit()
    conn.close()

def log_action(accion, detalles=None):#regitra todo lo que pasa
    """Registrar acción en log"""
    timestamp = datetime.now().isoformat()
    ip_address = request.remote_addr if request else 'localhost'
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        log_entry = f"{timestamp} - {accion} - {detalles or ''} - IP: {ip_address}\n"
        f.write(log_entry)
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO logs (timestamp, accion, detalles, ip_address) VALUES (?, ?, ?, ?)',
        (timestamp, accion, detalles, ip_address)
    )
    conn.commit()
    conn.close()

# ============================================================
# Helpers generales
# ============================================================

def limpiar_numero(valor):
    """Convierte '' o None a None. MySQL rechaza '' en columnas numéricas."""
    if valor is None or valor == '':
        return None
    return valor


def obtener_usuario_id_por_username(cursor, username):
    """Busca el id de un usuario por su username. Devuelve None si no existe."""
    if not username:
        return None
    cursor.execute('SELECT id FROM usuarios WHERE username = %s', (username,))
    fila = cursor.fetchone()
    return fila['id'] if fila else None


def obtener_ingreso_id_por_sesion(cursor, codigo_sesion):
    """Busca el id de un ingreso ya existente a partir del codigo_sesion."""
    cursor.execute('SELECT id FROM ingresos WHERE codigo_sesion = %s', (codigo_sesion,))
    fila = cursor.fetchone()
    return fila['id'] if fila else None


def obtener_tipo_modulo_id(cursor, codigo_modulo):
    """Busca el id de un tipo de módulo a partir de su código."""
    cursor.execute('SELECT id FROM tipo_modulo WHERE codigo = %s', (codigo_modulo,))
    fila = cursor.fetchone()
    return fila['id'] if fila else None


# ============================================================
# Módulo "ingreso" -> pacientes + ingresos
# ============================================================

def obtener_o_crear_paciente(cursor, rut, nombre, apellido, fecha_nacimiento, usuario_id):
    cursor.execute('SELECT id FROM pacientes WHERE rut = %s', (rut,))
    fila = cursor.fetchone()
    if fila:
        return fila['id']

    cursor.execute('''
        INSERT INTO pacientes (rut, nombre, apellido, fecha_nacimiento, created_by)
        VALUES (%s, %s, %s, %s, %s)
    ''', (rut, nombre, apellido, fecha_nacimiento or None, usuario_id))
    return cursor.lastrowid


def obtener_o_crear_ingreso(cursor, codigo_sesion, paciente_id, usuario_id):
    cursor.execute('SELECT id FROM ingresos WHERE codigo_sesion = %s', (codigo_sesion,))
    fila = cursor.fetchone()
    if fila:
        return fila['id']

    cursor.execute('''
        INSERT INTO ingresos (paciente_id, profesional_id, codigo, codigo_sesion, fecha_ingreso, created_by)
        VALUES (%s, %s, %s, %s, NOW(), %s)
    ''', (paciente_id, usuario_id, 'TEMP', codigo_sesion, usuario_id))

    nuevo_id = cursor.lastrowid
    codigo_oficial = f"SIRCLE{nuevo_id:04d}"
    cursor.execute('UPDATE ingresos SET codigo = %s WHERE id = %s', (codigo_oficial, nuevo_id))
    return nuevo_id


def procesar_modulo_ingreso(cursor, codigo_sesion, datos, usuario_id):
    """Crea o reutiliza el paciente (por RUT) y el ingreso (por codigo_sesion)."""
    rut = datos.get('patientRUT')
    if not rut:
        return

    paciente_id = obtener_o_crear_paciente(
        cursor,
        rut=rut,
        nombre=datos.get('patientName', ''),
        apellido=datos.get('patientLastname', ''),
        fecha_nacimiento=datos.get('birthDate') or None,
        usuario_id=usuario_id
    )
    obtener_o_crear_ingreso(cursor, codigo_sesion, paciente_id, usuario_id)


# ============================================================
# Módulos que se quedan como JSON en modulos_sesion
# ============================================================

def guardar_modulo_en_mysql(cursor, codigo_sesion, modulo_id, datos, usuario_id):
    """Guarda (o actualiza) el contenido de un módulo como JSON, ligado al ingreso actual."""
    ingreso_id = obtener_ingreso_id_por_sesion(cursor, codigo_sesion)
    if not ingreso_id:
        raise ValueError(
            f"No existe un ingreso para codigo_sesion={codigo_sesion}. "
            f"¿Se guardó primero el módulo 'ingreso' con un RUT válido?"
        )

    tipo_modulo_id = obtener_tipo_modulo_id(cursor, modulo_id)
    if not tipo_modulo_id:
        raise ValueError(f"El módulo '{modulo_id}' no existe en la tabla tipo_modulo.")

    datos_json = json.dumps(datos, ensure_ascii=False)

    cursor.execute('''
        INSERT INTO modulos_sesion (ingreso_id, tipo_modulo_id, datos, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            datos = VALUES(datos),
            updated_by = VALUES(updated_by)
    ''', (ingreso_id, tipo_modulo_id, datos_json, usuario_id, usuario_id))


# ============================================================
# Módulo "control-signos" -> signos_vitales
# ============================================================

def guardar_control_signos(cursor, ingreso_id, datos, usuario_id):
    mediciones = datos.get('mediciones', [])

    for m in mediciones:
        # glasgow_total llega como texto "15 pts" -> extraer solo el número
        glasgow_total = None
        glasgow_total_raw = m.get('glasgow_total', '')
        if glasgow_total_raw:
            try:
                glasgow_total = int(glasgow_total_raw.split()[0])
            except (ValueError, IndexError):
                glasgow_total = None

        dolor_intensidad = None
        dolor_intensidad_raw = m.get('dolor_intensidad', '')
        if dolor_intensidad_raw not in (None, ''):
            try:
                dolor_intensidad = int(dolor_intensidad_raw)
            except ValueError:
                dolor_intensidad = None

        cursor.execute('''
            INSERT INTO signos_vitales (
                ingreso_id, numero_medicion, fecha, hora,
                fc, fr, temperatura, sato2, fio2, pas, pad, pam,
                llene_capilar, diuresis,
                glasgow_total, glasgow_detalle,
                dolor_intensidad, dolor_detalle,
                bic_farmaco, bic_flujo, bic_dilucion, presentacion_solucion,
                created_by, updated_by
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s, %s, %s,
                %s, %s
            )
            ON DUPLICATE KEY UPDATE
                fecha = VALUES(fecha), hora = VALUES(hora),
                fc = VALUES(fc), fr = VALUES(fr), temperatura = VALUES(temperatura),
                sato2 = VALUES(sato2), fio2 = VALUES(fio2), pas = VALUES(pas),
                pad = VALUES(pad), pam = VALUES(pam),
                llene_capilar = VALUES(llene_capilar), diuresis = VALUES(diuresis),
                glasgow_total = VALUES(glasgow_total), glasgow_detalle = VALUES(glasgow_detalle),
                dolor_intensidad = VALUES(dolor_intensidad), dolor_detalle = VALUES(dolor_detalle),
                bic_farmaco = VALUES(bic_farmaco), bic_flujo = VALUES(bic_flujo),
                bic_dilucion = VALUES(bic_dilucion), presentacion_solucion = VALUES(presentacion_solucion),
                updated_by = VALUES(updated_by)
        ''', (
            ingreso_id, m.get('col'), limpiar_numero(m.get('fecha')), limpiar_numero(m.get('hora')),
            limpiar_numero(m.get('fc')), limpiar_numero(m.get('fr')), limpiar_numero(m.get('temperatura')),
            limpiar_numero(m.get('sato2')), limpiar_numero(m.get('fio2')), limpiar_numero(m.get('pas')),
            limpiar_numero(m.get('pad')), limpiar_numero(m.get('pam')),
            m.get('llene_capilar') or None, limpiar_numero(m.get('diuresis')),
            glasgow_total, json.dumps(m.get('glasgow')) if m.get('glasgow') else None,
            dolor_intensidad, json.dumps(m.get('dolor')) if m.get('dolor') else None,
            m.get('bic_farmaco') or None, m.get('bic_flujo') or None,
            m.get('bic_dilucion') or None, m.get('presentacion_solucion') or None,
            usuario_id, usuario_id
        ))


# ============================================================
# Módulo "balance" -> balance_hidrico
# ============================================================

def guardar_balance(cursor, ingreso_id, datos, usuario_id):
    ing = datos.get('ingresos', {})
    egr = datos.get('egresos', {})
    tot = datos.get('totales', {})
    elim = datos.get('eliminacion', {})
    fecha_hoy = datetime.now().date()

    cursor.execute('''
        INSERT INTO balance_hidrico (
            ingreso_id, fecha,
            ing_alimentacion_dia, ing_alimentacion_noche,
            ing_hidratacion_dia, ing_hidratacion_noche,
            ing_suero_dia, ing_suero_noche,
            ing_transfusion_dia, ing_transfusion_noche,
            ing_tratamiento_dia, ing_tratamiento_noche,
            ing_otros_dia, ing_otros_noche,
            egr_orina_dia, egr_orina_noche,
            egr_deposiciones_dia, egr_deposiciones_noche,
            egr_gastrico_dia, egr_gastrico_noche,
            egr_drenaje_dia, egr_drenaje_noche,
            egr_diuresis_dia, egr_diuresis_noche,
            egr_perdidas_dia, egr_perdidas_noche,
            egr_otros_dia, egr_otros_noche,
            tot_ingreso_dia, tot_ingreso_noche,
            tot_egreso_dia, tot_egreso_noche,
            tot_balance_dia, tot_balance_noche, tot_balance_24h,
            elim_orina, elim_vomitos, elim_deposiciones, elim_otros,
            created_by, updated_by
        ) VALUES (
            %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s
        )
        ON DUPLICATE KEY UPDATE
            ing_alimentacion_dia = VALUES(ing_alimentacion_dia), ing_alimentacion_noche = VALUES(ing_alimentacion_noche),
            ing_hidratacion_dia = VALUES(ing_hidratacion_dia), ing_hidratacion_noche = VALUES(ing_hidratacion_noche),
            ing_suero_dia = VALUES(ing_suero_dia), ing_suero_noche = VALUES(ing_suero_noche),
            ing_transfusion_dia = VALUES(ing_transfusion_dia), ing_transfusion_noche = VALUES(ing_transfusion_noche),
            ing_tratamiento_dia = VALUES(ing_tratamiento_dia), ing_tratamiento_noche = VALUES(ing_tratamiento_noche),
            ing_otros_dia = VALUES(ing_otros_dia), ing_otros_noche = VALUES(ing_otros_noche),
            egr_orina_dia = VALUES(egr_orina_dia), egr_orina_noche = VALUES(egr_orina_noche),
            egr_deposiciones_dia = VALUES(egr_deposiciones_dia), egr_deposiciones_noche = VALUES(egr_deposiciones_noche),
            egr_gastrico_dia = VALUES(egr_gastrico_dia), egr_gastrico_noche = VALUES(egr_gastrico_noche),
            egr_drenaje_dia = VALUES(egr_drenaje_dia), egr_drenaje_noche = VALUES(egr_drenaje_noche),
            egr_diuresis_dia = VALUES(egr_diuresis_dia), egr_diuresis_noche = VALUES(egr_diuresis_noche),
            egr_perdidas_dia = VALUES(egr_perdidas_dia), egr_perdidas_noche = VALUES(egr_perdidas_noche),
            egr_otros_dia = VALUES(egr_otros_dia), egr_otros_noche = VALUES(egr_otros_noche),
            tot_ingreso_dia = VALUES(tot_ingreso_dia), tot_ingreso_noche = VALUES(tot_ingreso_noche),
            tot_egreso_dia = VALUES(tot_egreso_dia), tot_egreso_noche = VALUES(tot_egreso_noche),
            tot_balance_dia = VALUES(tot_balance_dia), tot_balance_noche = VALUES(tot_balance_noche),
            tot_balance_24h = VALUES(tot_balance_24h),
            elim_orina = VALUES(elim_orina), elim_vomitos = VALUES(elim_vomitos),
            elim_deposiciones = VALUES(elim_deposiciones), elim_otros = VALUES(elim_otros),
            updated_by = VALUES(updated_by)
    ''', (
        ingreso_id, fecha_hoy,
        limpiar_numero(ing.get('alimentacion_dia')), limpiar_numero(ing.get('alimentacion_noch')),
        limpiar_numero(ing.get('hidratacion_dia')), limpiar_numero(ing.get('hidratacion_noch')),
        limpiar_numero(ing.get('suero_dia')), limpiar_numero(ing.get('suero_noch')),
        limpiar_numero(ing.get('transfusion_dia')), limpiar_numero(ing.get('transfusion_noch')),
        limpiar_numero(ing.get('tratamiento_dia')), limpiar_numero(ing.get('tratamiento_noch')),
        limpiar_numero(ing.get('otros_dia')), limpiar_numero(ing.get('otros_noch')),
        limpiar_numero(egr.get('orina_dia')), limpiar_numero(egr.get('orina_noch')),
        limpiar_numero(egr.get('deposiciones_dia')), limpiar_numero(egr.get('deposiciones_noch')),
        limpiar_numero(egr.get('gastrico_dia')), limpiar_numero(egr.get('gastrico_noch')),
        limpiar_numero(egr.get('drenaje_dia')), limpiar_numero(egr.get('drenaje_noch')),
        limpiar_numero(egr.get('diuresis_dia')), limpiar_numero(egr.get('diuresis_noch')),
        limpiar_numero(egr.get('perdidas_dia')), limpiar_numero(egr.get('perdidas_noch')),
        limpiar_numero(egr.get('otros_dia')), limpiar_numero(egr.get('otros_noch')),
        limpiar_numero(tot.get('ingreso_dia')), limpiar_numero(tot.get('ingreso_noche')),
        limpiar_numero(tot.get('egreso_dia')), limpiar_numero(tot.get('egreso_noche')),
        limpiar_numero(tot.get('balance_dia')), limpiar_numero(tot.get('balance_noche')), limpiar_numero(tot.get('balance_24h')),
        elim.get('orina') or None, elim.get('vomitos') or None,
        elim.get('deposiciones') or None, elim.get('otros') or None,
        usuario_id, usuario_id
    ))


# ============================================================
# Módulo "elementos" -> elementos_invasivos
# ============================================================

MAPA_ELEMENTO_ENUM = {
    'VVP': 'vvp', 'CUP': 'cup', 'SNG': 'sng', 'L.A.': 'la',
    'CVC': 'cvc', 'TET': 'tet', 'Drenaje': 'drenaje'
}

def guardar_elementos_invasivos(cursor, ingreso_id, datos, usuario_id):
    for bloque in datos.get('bloques', []):
        numero_bloque = bloque.get('numero')
        fecha_hora = bloque.get('fechaHora')

        for elem in bloque.get('elementosInstalados', []):
            codigo_enum = MAPA_ELEMENTO_ENUM.get(elem.get('elemento', ''))
            if not codigo_enum:
                continue  # nombre no reconocido: se omite en vez de romper todo el guardado

            cursor.execute('''
                INSERT INTO elementos_invasivos (
                    ingreso_id, numero_bloque, fecha_hora, elemento,
                    dias_instalado, calibre, ubicacion, diametro, codigo, responsable,
                    created_by, updated_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    fecha_hora = VALUES(fecha_hora), dias_instalado = VALUES(dias_instalado),
                    calibre = VALUES(calibre), ubicacion = VALUES(ubicacion),
                    diametro = VALUES(diametro), codigo = VALUES(codigo),
                    responsable = VALUES(responsable), updated_by = VALUES(updated_by)
            ''', (
                ingreso_id, numero_bloque, fecha_hora, codigo_enum,
                limpiar_numero(elem.get('dias')), elem.get('calibre') or None,
                elem.get('ubicacion') or None, elem.get('diametro') or None,
                elem.get('codigo') or None, elem.get('responsable') or None,
                usuario_id, usuario_id
            ))


# ============================================================
# Módulo "prec-iaas" -> prevencion_iaas
# ============================================================

def guardar_prec_iaas(cursor, ingreso_id, datos, usuario_id):
    flebitis = datos.get('flebitis', {})
    navm = datos.get('navm', {})
    itu = datos.get('itu', {})
    fecha_hoy = datetime.now().date()

    cursor.execute('''
        INSERT INTO prevencion_iaas (
            ingreso_id, fecha,
            fleb_fijacion, fleb_vencimiento, fleb_grado, fleb_obs,
            navm_posicion, navm_cuff, navm_aspiracion, navm_bucal, navm_manos, navm_clorhex, navm_obs,
            itu_aseo, itu_fijacion, itu_obs,
            created_by, updated_by
        ) VALUES (
            %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s
        )
        ON DUPLICATE KEY UPDATE
            fleb_fijacion = VALUES(fleb_fijacion), fleb_vencimiento = VALUES(fleb_vencimiento),
            fleb_grado = VALUES(fleb_grado), fleb_obs = VALUES(fleb_obs),
            navm_posicion = VALUES(navm_posicion), navm_cuff = VALUES(navm_cuff),
            navm_aspiracion = VALUES(navm_aspiracion), navm_bucal = VALUES(navm_bucal),
            navm_manos = VALUES(navm_manos), navm_clorhex = VALUES(navm_clorhex),
            navm_obs = VALUES(navm_obs),
            itu_aseo = VALUES(itu_aseo), itu_fijacion = VALUES(itu_fijacion), itu_obs = VALUES(itu_obs),
            updated_by = VALUES(updated_by)
    ''', (
        ingreso_id, fecha_hoy,
        flebitis.get('fijacion'), flebitis.get('vencimiento'),
        flebitis.get('grado') or None, flebitis.get('obs') or None,
        navm.get('posicion'), navm.get('cuff') or None, navm.get('aspiracion') or None,
        navm.get('bucal') or None, navm.get('manos') or None, navm.get('clorhex') or None,
        navm.get('obs') or None,
        itu.get('aseo') or None, itu.get('fijacion'), itu.get('obs') or None,
        usuario_id, usuario_id
    ))


# ============================================================
# Módulo "hhha" -> indicadores_hhha
# ============================================================

def guardar_hhha(cursor, ingreso_id, datos, usuario_id):
    fecha_hoy = datetime.now().date()

    cursor.execute('''
        INSERT INTO indicadores_hhha (
            ingreso_id, fecha,
            hoja_ingreso_medico, ingreso_estadistico, hoja_dau, docs_externos,
            hoja_evolucion, examenes_ficha, protocolo_pertenencias, hoja_enfermeria,
            brazalete, ubicacion_brazalete, pizarra, obs_identificacion,
            pertenencias, obs_pertenencias, responsable_nombre, responsable_usuario,
            created_by, updated_by
        ) VALUES (
            %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s
        )
        ON DUPLICATE KEY UPDATE
            hoja_ingreso_medico = VALUES(hoja_ingreso_medico), ingreso_estadistico = VALUES(ingreso_estadistico),
            hoja_dau = VALUES(hoja_dau), docs_externos = VALUES(docs_externos),
            hoja_evolucion = VALUES(hoja_evolucion), examenes_ficha = VALUES(examenes_ficha),
            protocolo_pertenencias = VALUES(protocolo_pertenencias), hoja_enfermeria = VALUES(hoja_enfermeria),
            brazalete = VALUES(brazalete), ubicacion_brazalete = VALUES(ubicacion_brazalete),
            pizarra = VALUES(pizarra), obs_identificacion = VALUES(obs_identificacion),
            pertenencias = VALUES(pertenencias), obs_pertenencias = VALUES(obs_pertenencias),
            responsable_nombre = VALUES(responsable_nombre), responsable_usuario = VALUES(responsable_usuario),
            updated_by = VALUES(updated_by)
    ''', (
        ingreso_id, fecha_hoy,
        datos.get('hoja_ingreso_medico'), datos.get('ingreso_estadistico'),
        datos.get('hoja_dau'), datos.get('docs_externos'),
        datos.get('hoja_evolucion'), datos.get('examenes_ficha'),
        datos.get('protocolo_pertenencias'), datos.get('hoja_enfermeria'),
        datos.get('brazalete') or None, datos.get('ubicacion_brazalete') or None,
        datos.get('pizarra') or None, datos.get('obs_identificacion') or None,
        datos.get('pertenencias') or None, datos.get('obs_pertenencias') or None,
        datos.get('responsable_nombre') or None, datos.get('responsable_usuario') or None,
        usuario_id, usuario_id
    ))


# ============================================================
# LPP (dentro de "atencion-1") -> valoraciones_lpp + ubicaciones_lpp
# ============================================================

def guardar_lpp(cursor, ingreso_id, datos_lpp, usuario_id):
    """
    Reemplaza todas las valoraciones LPP existentes de este ingreso
    por las que llegan ahora. Borrar + reinsertar es más simple y
    seguro que tratar de calzar ids de un array que cambia de tamaño
    (se pueden agregar/eliminar valoraciones desde el navegador).
    """
    cursor.execute('DELETE FROM valoraciones_lpp WHERE ingreso_id = %s', (ingreso_id,))
    # Las filas de ubicaciones_lpp se borran solas (ON DELETE CASCADE)

    for v in datos_lpp:
        cursor.execute('''
            INSERT INTO valoraciones_lpp (
                ingreso_id, fecha_notificacion, responsable,
                braden_largo, riesgo_largo, upp_largo, grado_lpp_largo,
                reevaluacion_largo, puntaje_reevaluacion_largo, lpp_largo, observaciones_largo,
                braden_noche, riesgo_noche, upp_noche, grado_lpp_noche,
                reevaluacion_noche, puntaje_reevaluacion_noche, lpp_noche, observaciones_noche,
                created_by, updated_by
            ) VALUES (
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s
            )
        ''', (
            ingreso_id, v.get('fechaNotificacion') or None, v.get('responsable') or None,
            v.get('puntajeBradenLargo'), v.get('riesgoLargo') or None,
            v.get('uppLargo') or 'no', v.get('gradoLppLargo') or None,
            v.get('reevaluacionLargo') or 'no', v.get('puntajeReevaluacionLargo') or None,
            v.get('lppLargo') or 'no', v.get('observacionesLargo') or None,
            v.get('puntajeBradenNoche'), v.get('riesgoNoche') or None,
            v.get('uppNoche') or 'no', v.get('gradoLppNoche') or None,
            v.get('reevaluacionNoche') or 'no', v.get('puntajeReevaluacionNoche') or None,
            v.get('lppNoche') or 'no', v.get('observacionesNoche') or None,
            usuario_id, usuario_id
        ))
        valoracion_id = cursor.lastrowid

        for ubic in v.get('ubicacionesLargo', []):
            cursor.execute('''
                INSERT INTO ubicaciones_lpp (valoracion_id, turno, punto_id, punto_nombre)
                VALUES (%s, 'largo', %s, %s)
            ''', (valoracion_id, ubic.get('id'), ubic.get('nombre')))

        for ubic in v.get('ubicacionesNoche', []):
            cursor.execute('''
                INSERT INTO ubicaciones_lpp (valoracion_id, turno, punto_id, punto_nombre)
                VALUES (%s, 'noche', %s, %s)
            ''', (valoracion_id, ubic.get('id'), ubic.get('nombre')))


# Módulos que van a su propia tabla (ya no pasan por modulos_sesion)
MODULOS_CON_TABLA_PROPIA = {'control-signos', 'balance', 'elementos', 'prec-iaas', 'hhha'}


@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'CIB Backend Server'
    })

@app.route('/api/almacenar_tsv', methods=['POST'])
def almacenar_tsv():
    """Almacenar datos TSV en la base de datos (SQLite, aún no migrado)"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        codigo = data.get('codigo', f'SIRCLE{datetime.now().strftime("%Y%m%d%H%M%S")}')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        datos = data.get('datos', {})

        if not datos:
            return jsonify({'error': 'No hay datos para almacenar'}), 400

        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO ingresos (codigo, timestamp, datos)
        VALUES (?, ?, ?)
        ''', (codigo, timestamp, json.dumps(datos, ensure_ascii=False)))
        conn.commit()
        conn.close()

        log_action('almacenar_tsv', f'Código: {codigo}')

        return jsonify({
            'success': True,
            'message': 'Datos almacenados exitosamente',
            'codigo': codigo,
            'timestamp': timestamp
        })
    except Exception as e:
        error_msg = f"Error almacenando TSV: {str(e)}"
        log_action('error_almacenar_tsv', error_msg)
        return jsonify({'error': error_msg}), 500

@app.route('/api/obtener_tsv', methods=['GET'])
def obtener_tsv():
    """Obtener todos los datos TSV almacenados (SQLite, aún no migrado)"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        query = '''
        SELECT codigo, timestamp, datos, created_at 
        FROM ingresos 
        ORDER BY created_at DESC
        '''
        df = pd.read_sql_query(query, conn)
        conn.close()

        if not df.empty:
            datos_expandidos = df['datos'].apply(json.loads)
            datos_df = pd.json_normalize(datos_expandidos)
            result_df = pd.concat([df[['codigo', 'timestamp', 'created_at']], datos_df], axis=1)

            tsv_filename = "cib_database_completa.tsv"
            tsv_path = os.path.join(TSV_FOLDER, tsv_filename)
            result_df.to_csv(tsv_path, sep='\t', index=False, encoding='utf-8')

            log_action('descargar_tsv', f'Registros: {len(result_df)} - Archivo: {tsv_filename}')
            return send_file(tsv_path, as_attachment=True, download_name=tsv_filename)

        return jsonify({'message': 'No hay datos almacenados'}), 404
    except Exception as e:
        error_msg = f"Error obteniendo TSV: {str(e)}"
        log_action('error_obtener_tsv', error_msg)
        return jsonify({'error': error_msg}), 500

@app.route('/api/estadisticas', methods=['GET'])
def estadisticas():
    """Obtener estadísticas del sistema (SQLite, aún no migrado)"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) FROM ingresos')
        total_ingresos = cursor.fetchone()[0]

        cursor.execute('''
        SELECT DATE(created_at) as fecha, COUNT(*) as cantidad
        FROM ingresos
        WHERE created_at >= DATE('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY fecha DESC
        ''')
        ingresos_por_dia = cursor.fetchall()

        cursor.execute('SELECT MAX(created_at) FROM ingresos')
        ultimo_ingreso = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            'total_ingresos': total_ingresos,
            'ingresos_ultima_semana': len(ingresos_por_dia),
            'ingresos_por_dia': [{'fecha': f[0], 'cantidad': f[1]} for f in ingresos_por_dia],
            'ultimo_ingreso': ultimo_ingreso,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/farmacos', methods=['GET'])
def buscar_farmacos():
    """
    Busca fármacos por nombre para el autocompletar del campo
    BIC Fármaco. Ej: GET /api/farmacos?buscar=amox
    Devuelve como máximo 20 resultados que EMPIEZAN con el término
    (no "contiene", para poder aprovechar el índice de la columna
    y que la búsqueda sea rápida incluso con miles de fármacos).
    """
    try:
        termino = request.args.get('buscar', '').strip()

        # Con menos de 2 letras no vale la pena buscar todavía
        if len(termino) < 2:
            return jsonify({'farmacos': []})

        conexion = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conexion.cursor(dictionary=True)

        cursor.execute('''
            SELECT nombre, presentacion, codigo
            FROM catalogo_farmacos
            WHERE nombre LIKE %s AND activo = 1
            ORDER BY nombre
            LIMIT 20
        ''', (f'{termino}%',))

        resultados = cursor.fetchall()
        cursor.close()
        conexion.close()

        return jsonify({'farmacos': resultados})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/limpiar_modulo', methods=['POST'])
def limpiar_modulo():
    """API para limpiar módulo (simulación)"""
    data = request.json
    modulo = data.get('modulo', 'desconocido')
    log_action('limpiar_modulo', f'Módulo: {modulo}')
    return jsonify({
        'success': True,
        'message': f'Módulo {modulo} limpiado exitosamente',
        'timestamp': datetime.now().isoformat()
    })


# ============================================================
# guardar_modulo: distribuye cada módulo a donde corresponde
# ============================================================
@app.route('/api/guardar_modulo', methods=['POST'])
def guardar_modulo():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        codigo_sesion = data.get('codigo_sesion')
        modulo_id     = data.get('modulo_id')
        datos         = data.get('datos', {})
        username      = data.get('username')

        if not codigo_sesion or not modulo_id:
            return jsonify({'error': 'Faltan codigo_sesion o modulo_id'}), 400

        conexion = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conexion.cursor(dictionary=True)

        usuario_id = obtener_usuario_id_por_username(cursor, username)
        if not usuario_id:
            cursor.close()
            conexion.close()
            return jsonify({
                'error': f'Usuario "{username}" no encontrado. Vuelve a iniciar sesión.'
            }), 401

        if modulo_id == 'ingreso':
            # Crea/reutiliza paciente + ingreso, y además guarda su JSON completo
            procesar_modulo_ingreso(cursor, codigo_sesion, datos, usuario_id)
            guardar_modulo_en_mysql(cursor, codigo_sesion, modulo_id, datos, usuario_id)

        elif modulo_id in MODULOS_CON_TABLA_PROPIA:
            ingreso_id = obtener_ingreso_id_por_sesion(cursor, codigo_sesion)
            if not ingreso_id:
                raise ValueError(
                    "No existe un ingreso para esta sesión todavía. "
                    "Completa primero el módulo 'Ingreso del Paciente' con un RUT válido."
                )

            if modulo_id == 'control-signos':
                guardar_control_signos(cursor, ingreso_id, datos, usuario_id)
            elif modulo_id == 'balance':
                guardar_balance(cursor, ingreso_id, datos, usuario_id)
            elif modulo_id == 'elementos':
                guardar_elementos_invasivos(cursor, ingreso_id, datos, usuario_id)
            elif modulo_id == 'prec-iaas':
                guardar_prec_iaas(cursor, ingreso_id, datos, usuario_id)
            elif modulo_id == 'hhha':
                guardar_hhha(cursor, ingreso_id, datos, usuario_id)
            # Nota: estos módulos NO se guardan también en modulos_sesion

        elif modulo_id == 'atencion-1':
            ingreso_id = obtener_ingreso_id_por_sesion(cursor, codigo_sesion)
            if not ingreso_id:
                raise ValueError(
                    "No existe un ingreso para esta sesión todavía. "
                    "Completa primero el módulo 'Ingreso del Paciente' con un RUT válido."
                )
            datos_lpp = datos.get('datos_lpp', [])
            guardar_lpp(cursor, ingreso_id, datos_lpp, usuario_id)

            # El resto de atencion-1 (sin datos_lpp) sigue como JSON
            datos_sin_lpp = {k: v for k, v in datos.items() if k != 'datos_lpp'}
            guardar_modulo_en_mysql(cursor, codigo_sesion, modulo_id, datos_sin_lpp, usuario_id)

        else:
            # indicaciones, examen-fisico, evolucion, plan-enfermeria, examenes, iaas
            guardar_modulo_en_mysql(cursor, codigo_sesion, modulo_id, datos, usuario_id)

        conexion.commit()
        cursor.close()
        conexion.close()

        log_action('guardar_modulo', f'Sesión: {codigo_sesion} | Módulo: {modulo_id}')

        return jsonify({
            'success': True,
            'mensaje': f'Módulo {modulo_id} guardado',
            'codigo_sesion': codigo_sesion
        })

    except Exception as e:
        error_msg = f"Error guardando módulo: {str(e)}"
        log_action('error_guardar_modulo', error_msg)
        return jsonify({'error': error_msg}), 500



@app.route('/api/login', methods=['POST'])
def login():
    """Autenticación de usuario contra la tabla usuarios en MySQL"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Usuario y contraseña son obligatorios'
            }), 400

        conexion = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conexion.cursor(dictionary=True)

        cursor.execute('''
            SELECT u.id, u.username, u.password_hash, u.nombre_completo,
                   u.activo, r.nombre AS rol
            FROM usuarios u
            JOIN roles r ON r.id = u.rol_id
            WHERE u.username = %s
        ''', (username,))
        usuario = cursor.fetchone()

        cursor.close()
        conexion.close()

        if not usuario or not usuario['activo']:
            log_action('login_fallido', f'Usuario: {username}')
            return jsonify({
                'success': False,
                'message': 'Usuario o contraseña incorrectos'
            }), 401

        hash_guardado = usuario['password_hash'].encode('utf-8')
        coincide = bcrypt.checkpw(password.encode('utf-8'), hash_guardado)

        if coincide:
            log_action('login_exitoso', f'Usuario: {username}')
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'name': usuario['nombre_completo'],
                    'role': usuario['rol']
                }
            })
        else:
            log_action('login_fallido', f'Usuario: {username}')
            return jsonify({
                'success': False,
                'message': 'Usuario o contraseña incorrectos'
            }), 401

    except Exception as e:
        error_msg = f"Error en login: {str(e)}"
        log_action('error_login', error_msg)
        return jsonify({'error': error_msg}), 500
#para que se cambie el estado a finalizado en mysql
@app.route('/api/finalizar_ingreso', methods=['POST'])
def finalizar_ingreso():
    """
    Actualiza el estado del ingreso en MySQL de 'en_progreso' a 'finalizado'
    utilizando el codigo_sesion enviado desde el Frontend.
    """
    try:
        data = request.json or {}
        codigo_sesion = data.get('codigo_sesion') or data.get('session_id')

        if not codigo_sesion:
            return jsonify({
                'success': False, 
                'message': 'Falta el parámetro codigo_sesion en la petición.'
            }), 400

        conn = get_mysql_connection()
        if not conn:
            return jsonify({
                'success': False, 
                'message': 'No se pudo conectar a la base de datos MySQL.'
            }), 500

        cursor = conn.cursor()
        
        # Actualizamos el estado a 'finalizado' para la sesión correspondiente
        query = """
            UPDATE ingresos 
            SET estado = 'finalizado' 
            WHERE codigo_sesion = %s
        """
        cursor.execute(query, (codigo_sesion,))
        conn.commit()

        filas_afectadas = cursor.rowcount
        cursor.close()
        conn.close()

        if filas_afectadas > 0:
            log_action('finalizar_ingreso', f'Ingreso finalizado exitosamente para sesion: {codigo_sesion}')
            return jsonify({
                'success': True,
                'message': f'Ingreso {codigo_sesion} marcado como finalizado con éxito.',
                'codigo_sesion': codigo_sesion
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': f'No se encontró un registro activo para la sesión {codigo_sesion}.'
            }), 404

    except Exception as e:
        print(f"Error al finalizar ingreso: {e}")
        return jsonify({
            'success': False, 
            'message': f'Error interno del servidor: {str(e)}'
        }), 500



if __name__ == '__main__':
    init_database()
    log_action('server_start', 'Servidor CIB iniciado')

    print("=" * 50)
    print("CIB BACKEND SERVER")
    print("=" * 50)
    print(f"URL: http://172.22.251.49:5000")
    print(f"Database: {DATABASE_FILE}")
    print(f"TSV Folder: {TSV_FOLDER}")
    print("=" * 50)

    app.run(host='0.0.0.0', port=5000, debug=True)
