"""
probar_login.py

Script para probar el login: pide usuario y contraseña, busca el
hash guardado en MySQL, y verifica si la contraseña ingresada
coincide -- sin comparar texto plano en ningún momento.

Antes de correrlo:
    pip install bcrypt mysql-connector-python

Cómo correrlo:
    python probar_login.py
"""

import bcrypt
import mysql.connector
import getpass

CONFIG_MYSQL = {
    "host": "localhost",
    "user": "genodata",
    "password": "bioinfo",
    "database": "sircle_db",
}


def verificar_login(username: str, password_ingresada: str) -> dict | None:
    """
    Busca el usuario por username y compara la contraseña ingresada
    contra el hash guardado. Devuelve los datos del usuario si es
    correcto, o None si el usuario no existe o la contraseña no coincide.
    """
    conexion = mysql.connector.connect(**CONFIG_MYSQL)
    # dictionary=True hace que cada fila venga como {"columna": valor},
    # más cómodo de leer que una tupla posicional.
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT u.id, u.username, u.password_hash, u.nombre_completo,
               u.activo, r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        WHERE u.username = %s
        """,
        (username,),
    )
    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    if not usuario:
        print("❌ No existe un usuario con ese username.")
        return None

    if not usuario["activo"]:
        print("❌ El usuario existe pero está marcado como inactivo.")
        return None

    # bcrypt.checkpw compara internamente sin exponer el hash real,
    # y es resistente a "timing attacks" (no se puede adivinar la
    # contraseña midiendo cuánto tarda la comparación).
    hash_guardado = usuario["password_hash"].encode("utf-8")
    coincide = bcrypt.checkpw(password_ingresada.encode("utf-8"), hash_guardado)

    if coincide:
        print(f"✅ Login correcto. Bienvenido/a {usuario['nombre_completo']} ({usuario['rol']}).")
        return usuario
    else:
        print("❌ Contraseña incorrecta.")
        return None


if __name__ == "__main__":
    print("== Probar login SIRCLE ==")
    username = input("Username: ").strip()
    password = getpass.getpass("Contraseña: ")

    verificar_login(username, password)
