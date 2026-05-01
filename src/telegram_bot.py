import schedule
import time
import requests

TOKEN = "TU_TOKEN_AQUI"
CHAT_ID = "TU_ID_AQUI"

def enviar_recordatorio():
    msg = "🏦 ¡Mauro! No te olvides de bajar el CSV del BROU y categorizar tus gastos de hoy."
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    try:
        requests.post(url, data={'chat_id': CHAT_ID, 'text': msg})
    except Exception as e:
        print(f"Error enviando mensaje: {e}")

# Programar a las 20:00 cada día
schedule.every().day.at("20:00").do(enviar_recordatorio)

if __name__ == "__main__":
    print("Recordatorios activos... (Ctrl+C para detener)")
    while True:
        schedule.run_pending()
        time.sleep(60)