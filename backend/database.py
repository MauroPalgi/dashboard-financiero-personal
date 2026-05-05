import sqlite3

DB_PATH = "finanzas_brou.db"

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    # Tabla de movimientos
    cursor.execute('''CREATE TABLE IF NOT EXISTS movimientos 
        (fecha TEXT, descripcion TEXT, monto REAL, categoria TEXT, hash TEXT UNIQUE)''')
    # Tabla de reglas de categorización
    cursor.execute('''CREATE TABLE IF NOT EXISTS reglas 
        (keyword TEXT UNIQUE, categoria TEXT)''')
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Base de datos inicializada correctamente.")