import sys
import pandas as pd
import sqlite3
import json

def process_file(file_path):
    # 1. Cargar archivo (funciona igual en Windows/Linux gracias a pandas)
    df = pd.read_excel(file_path) if file_path.endswith('.xlsx') else pd.read_csv(file_path)
    
    # 2. Conectar a SQLite local
    conn = sqlite3.connect('finanzas.db')
    
    # 3. Lógica de categorías (Simplificada)
    # Aquí es donde verificas si hay descripciones nuevas
    # Si falta una, devuelves un JSON pidiendo la categoría
    output = {"status": "success", "data": df.to_dict()}
    print(json.dumps(output)) # Se comunica con Electron vía STDOUT

if __name__ == "__main__":
    process_file(sys.argv[1])