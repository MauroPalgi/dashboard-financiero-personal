import pandas as pd
from src.database import get_connection

def procesar_csv_brou(file_path):
    # Ajuste para formato estándar BROU (Punto y coma y codificación regional)
    df = pd.read_csv(file_path, sep=';', encoding='latin-1')
    
    # Mapeo de columnas (Asegúrate que coincidan con tu CSV)
    df = df[['Fecha', 'Asunto', 'Importe']].copy()
    df.columns = ['fecha', 'descripcion', 'monto']
    
    # Crear hash para evitar duplicados al importar varias veces
    df['hash'] = pd.util.hash_pandas_object(df, index=False).astype(str)
    return df

def aplicar_reglas(df):
    conn = get_connection()
    reglas = pd.read_sql("SELECT * FROM reglas", conn)
    conn.close()
    
    df['categoria'] = None
    for _, regla in reglas.iterrows():
        mask = df['descripcion'].str.contains(regla['keyword'], case=False, na=False)
        df.loc[mask, 'categoria'] = regla['categoria']
    
    return df