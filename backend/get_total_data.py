import sqlite3
import json
import os

def obtener_datos_totales():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'finanzas_brou.db')

    if not os.path.exists(db_path):
        print(json.dumps({"status": "ok", "datos": []}))
        return

    try:
        conn = sqlite3.connect(db_path)
        # Esto nos permite acceder a las columnas por nombre
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        
        # Consultamos todo
        cursor.execute("SELECT * FROM movimientos")
        rows = cursor.fetchall()
        
        datos = []
        for r in rows:
            # Convertimos el objeto Row a diccionario
            item = dict(r)
            
            # Normalizamos el nombre para el Frontend:
            # Si en la DB se llama 'monto', lo pasamos como 'monto' al JS
            
            datos.append({
                "fecha": item.get('fecha'),
                "descripcion": item.get('descripcion'),
                "monto": item.get('monto'),
                "categoria": item.get('categoria')
            })
        
        print(json.dumps({"status": "ok", "datos": datos}))

    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    obtener_datos_totales()