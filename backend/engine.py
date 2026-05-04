import sys
import pandas as pd
import json

def procesar_excel_brou(file_path):
    # Usamos file=sys.stderr para que estos logs no ensucien el JSON de salida
    print(f"--- DEBUG: Iniciando lectura de {file_path} ---", file=sys.stderr)
    
    try:
        df_raw = pd.read_excel(file_path)
        
        row_index = None
        for i, row in df_raw.iterrows():
            fila_str = [str(val).strip() for val in row.values]
            # Búsqueda de cabecera
            if 'Fecha' in fila_str and 'Descripción' in fila_str:
                row_index = i + 1
                break
                
        if row_index is None:
            return {"status": "error", "message": "No se encontró la cabecera de la tabla."}

        df = pd.read_excel(file_path, skiprows=row_index)
        df.columns = [str(c).strip().replace('\n', ' ') for c in df.columns]

        # Lógica de montos (Débito vs Crédito)
        col_debito = next((c for c in df.columns if 'Débito' in c), None)
        col_credito = next((c for c in df.columns if 'Crédito' in c), None)
        
        debitos = pd.to_numeric(df[col_debito], errors='coerce').fillna(0) if col_debito else 0
        creditos = pd.to_numeric(df[col_credito], errors='coerce').fillna(0) if col_credito else 0
        
        # Unificamos en una columna 'importe' (positivo para ingresos, negativo para gastos)
        df['importe'] = creditos - debitos
        
        # Limpieza de descripción
        desc = df.get('Descripción', pd.Series(['']*len(df))).fillna('').astype(str)
        asunto = df.get('Asunto', pd.Series(['']*len(df))).fillna('').astype(str)
        df['descripcion_final'] = (desc + " " + asunto).str.strip()
        
        # Filtro final de filas con fecha
        df = df[df['Fecha'].notna()].copy()
        
        registros = []
        for _, row in df.iterrows():
            registros.append({
                "fecha": str(row['Fecha']),
                "descripcion": row['descripcion_final'],
                "importe": float(row['importe'])
            })
        
        return {"status": "ok", "pendientes": registros}

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        resultado = procesar_excel_brou(sys.argv[1])
        # EL ÚNICO PRINT QUE RECIBE ELECTRON:
        print(json.dumps(resultado))