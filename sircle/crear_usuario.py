"""
crear_usuario.py

Script para correr UNA VEZ a mano, para crear un usuario en la
tabla `usuarios` de MySQL, con la contraseña cifrada con bcrypt.

Antes de correrlo:
    pip install bcrypt mysql-connector-python

Cómo correrlo:
    python crear_usuario.py
"""

import bcrypt
import mysql.connector
import getpass

# ------------------------------------------------------------
# 1. DATOS DE CONEXIÓN A MYSQL
# Cambia estos valores por los tuyos. Si aún no cambiaste la
# contraseña de ejemplo de "sircle_app", usa la que pusiste en
# schema_usuarios.sql.
# ------------------------------------------------------------
CONFIG_MYSQL = {
    "host": "localhost",
    "user": "sircle_app",
    "password": "bioquimica11",
    "database": "sircle_db",
}


def hash_password(contraseña_plana: str) -> str:
    """
    Convierte una contraseña en texto plano a un hash bcrypt.
    bcrypt genera automáticamente una "sal" (salt) distinta cada
    vez, por eso el mismo texto da un hash distinto cada corrida
    -- eso es intencional y correcto.
    """
    # bcrypt trabaja con bytes, no con texto directo, por eso el .encode()
    hash_bytes = bcrypt.hashpw(contraseña_plana.encode("utf-8"), bcrypt.gensalt(rounds=12))
    # Lo guardamos como texto normal para meterlo en una columna VARCHAR
    return hash_bytes.decode("utf-8")


def crear_usuario(username, password_plano, nombre_completo, nombre_rol):
    password_hash = hash_password(password_plano)

    conexion = mysql.connector.connect(**CONFIG_MYSQL)
    cursor = conexion.cursor()

    # Buscamos el id del rol por su nombre, en vez de escribir el número a mano
    cursor.execute("SELECT id FROM roles WHERE nombre = %s", (nombre_rol,))
    fila_rol = cursor.fetchone()
    if not fila_rol:
        raise ValueError(f"El rol '{nombre_rol}' no existe en la tabla roles.")
    rol_id = fila_rol[0]

    cursor.execute(
        """
        INSERT INTO usuarios (username, password_hash, nombre_completo, rol_id)
        VALUES (%s, %s, %s, %s)
        """,
        (username, password_hash, nombre_completo, rol_id),
    )

    conexion.commit()
    print(f"✅ Usuario '{username}' creado con id {cursor.lastrowid}.")

    cursor.close()
    conexion.close()


if __name__ == "__main__":
    print("== Crear usuario nuevo en SIRCLE ==")
    username = input("Username (ej: jperez): ").strip()
    nombre_completo = input("Nombre completo: ").strip()
    nombre_rol = input("Rol (enfermera / administrador): ").strip()

    # getpass no muestra lo que escribes en pantalla, para que la
    # contraseña no quede visible mientras la escribes.
    password_plano = getpass.getpass("Contraseña: ")
    password_confirmacion = getpass.getpass("Repite la contraseña: ")

    if password_plano != password_confirmacion:
        print("❌ Las contraseñas no coinciden. Intenta de nuevo.")
    else:
        crear_usuario(username, password_plano, nombre_completo, nombre_rol)