# dashboard-financiero-personal

dashboard-financiero/
├── data/
│   ├── raw/               # Aquí guardas los CSV descargados del BROU
│   └── processed/         # (Opcional) Copias de seguridad de lo procesado
├── src/
│   ├── __init__.py
│   ├── database.py        # Lógica de SQLite (tablas y conexiones)
│   ├── processor.py       # Lógica de limpieza de Pandas y categorización
│   └── telegram_bot.py    # El script del recordatorio diario
├── notebooks/
│   └── dashboard.ipynb    # Tu interfaz principal en VS Code
├── .gitignore             # Para NO subir tus gastos reales a la nube
├── finanzas_brou.db       # La base de datos (se genera sola)
└── requirements.txt


# Requirement
pandas
plotly
ipywidgets
schedule
requests