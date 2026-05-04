import pandas as pd
import numpy as np
from src.database import get_connection

def procesar_csv_brou(file_path):
    # Ajuste para formato estándar BROU (Punto y coma y codificación regional)
    df = pd.read_csv(file_path, sep=';', encoding='latin-1')
    
    # Mapeo de columnas (Asegúrate que coincidan con tu CSV)
    df = df[['Fecha', 'Asunto', 'Monto']].copy()
    df.columns = ['fecha', 'descripcion', 'monto']
    
    # Crear hash para evitar duplicados al importar varias veces
    # df['hash'] = pd.util.hash_pandas_object(df, index=False).astype(str)
    # return df

def procesar_excel_brou(file_path):
    print(f"--- DEBUG: Iniciando lectura de {file_path} ---")
    
    # 1. Leemos el Excel completo
    df_raw = pd.read_excel(file_path)
    
    # 2. Buscamos la fila que tiene los encabezados reales de la tabla
    row_index = None
    for i, row in df_raw.iterrows():
        # Convertimos la fila a una lista de strings limpia
        fila_str = [str(val).strip() for val in row.values]
        
        # BUSQUEDA ESTRICTA: La fila debe tener estas 3 columnas sí o sí
        if 'Fecha' in fila_str and 'Descripción' in fila_str and 'Débito' in fila_str:
            row_index = i + 1
            print(f"--- DEBUG: ¡Tabla real encontrada en fila {i}! ---")
            break
            
    if row_index is None:
        print("❌ ERROR: No se encontró la cabecera de la tabla (Fecha/Descripción/Débito).")
        return None

    # 3. Volvemos a leer el archivo desde donde empieza la tabla de verdad
    df = pd.read_excel(file_path, skiprows=row_index)
    
    # 4. Limpiamos nombres de columnas (espacios, saltos de línea, etc.)
    df.columns = [str(c).strip().replace('\n', ' ') for c in df.columns]
    print(f"--- DEBUG: Columnas finales detectadas: {df.columns.tolist()}")

    # 5. Procesar montos (Débito vs Crédito)
    # El BROU a veces usa 'Débito' o 'Débitos' (con/sin s)
    col_debito = 'Débito' if 'Débito' in df.columns else 'Débitos'
    col_credito = 'Crédito' if 'Crédito' in df.columns else 'Créditos'
    
    # Convertimos a número forzando errores a NaN y luego a 0
    debitos = pd.to_numeric(df[col_debito], errors='coerce').fillna(0)
    creditos = pd.to_numeric(df[col_credito], errors='coerce').fillna(0)
    df['monto'] = creditos - debitos
    
    # 6. Unir Descripción y Asunto para tener el detalle (ej: Compra POS + Comercio)
    # Usamos .get por si alguna columna no existe en un mes específico
    desc = df.get('Descripción', pd.Series(['']*len(df))).fillna('').astype(str)
    asunto = df.get('Asunto', pd.Series(['']*len(df))).fillna('').astype(str)
    df['descripcion_clean'] = (desc + " " + asunto).str.strip()
    
    # 7. Renombramos para el formato del Dashboard
    df = df.rename(columns={'Fecha': 'fecha', 'descripcion_clean': 'descripcion'})
    
    # 8. Filtro de seguridad: Nos quedamos solo con filas que tengan fecha real
    # (Esto quita los totales o leyendas que el BROU pone al final)
    df_final = df[['fecha', 'descripcion', 'monto']].copy()
    df_final = df_final[df_final['fecha'].notna()]
    df_final['fecha'] = df_final['fecha'].astype(str)
    
    print(f"--- DEBUG: Se procesaron {len(df_final)} movimientos ---")
    
    # Generar hash único para evitar duplicados
    df_final['hash'] = pd.util.hash_pandas_object(df_final, index=False).astype(str)
    
    return df_final

def aplicar_reglas(df):
    conn = get_connection()
    reglas = pd.read_sql("SELECT * FROM reglas", conn)
    conn.close()
    
    df['categoria'] = None
    for _, regla in reglas.iterrows():
        mask = df['descripcion'].str.contains(regla['keyword'], case=False, na=False)
        df.loc[mask, 'categoria'] = regla['categoria']
    
    return df