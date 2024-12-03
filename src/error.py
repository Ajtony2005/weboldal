import asyncio
import websockets
import json
from tkinter import Tk, Listbox, Button, END

# Tkinter GUI setup
def select_error_and_send(websocket, pair_id, errors):
    def on_select():
        selection = listbox.curselection()
        if not selection:
            print("Nincs kiválasztva hiba.")
            return
        selected_error = errors[selection[0]]
        error_code = selected_error["code"]
        error_message = selected_error["message"]
        
        # Küldjük az error státuszt a WebSocket szerveren keresztül
        asyncio.run_coroutine_threadsafe(
            websocket.send(
                json.dumps({
                    "type": "error_status",
                    "status": "error",
                    "pairId": pair_id,
                    "number": error_code
                })
            ),
            asyncio.get_event_loop()
        )
        print(f"Küldött hiba: {error_message} (Kód: {error_code})")

    # Tkinter ablak inicializálása
    root = Tk()
    root.title("Error kiválasztása")

    listbox = Listbox(root, width=50, height=20)
    for error in errors:
        listbox.insert(END, f"{error['message']} (Kód: {error['code']})")
    listbox.pack()

    send_button = Button(root, text="Küldés", command=on_select)
    send_button.pack()

    root.mainloop()

# WebSocket kapcsolódás
async def connect_to_server():
    uri = "ws://localhost:8000"
    try:
        async with websockets.connect(uri) as websocket:
            pair_id = "teaorder"
            await websocket.send(
                json.dumps({
                    "type": "pair_request",
                    "pairId": pair_id,
                })
            )
            print("Kapcsolódás kezdeményezve a szerverhez.")

            # Error JSON beolvasása
            with open("error.json", "r") as f:
                errors = json.load(f)

            # Tkinter futtatása az error kiválasztására
            select_error_and_send(websocket, pair_id, errors)

            while True:
                message = await websocket.recv()
                data = json.loads(message)

                if data["type"] == "pair_status":
                    if data["status"] == "connected":
                        print("Kapcsolat sikeresen létrejött.")
                    elif data["status"] == "disconnected":
                        print("Kapcsolat bontva a partnerrel.")
                        break

    except websockets.ConnectionClosed as e:
        print(f"Kapcsolat megszakadt: {e}")
    except Exception as e:
        print(f"Hiba történt: {e}")

if __name__ == "__main__":
    asyncio.run(connect_to_server())
