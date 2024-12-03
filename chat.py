import asyncio
from re import I
import websockets
import json
import time

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

            while True:
                
                message = await websocket.recv()
                data = json.loads(message)

                if data["type"] == "pair_status":
                    if data["status"] == "connected":
                        print("Kapcsolat sikeresen létrejött.")
                    elif data["status"] == "disconnected":
                        print("Kapcsolat bontva a partnerrel.")
                        break

                elif data["type"] == "tea_order":
                    print("Új rendelés érkezett:")
                    print(f"  Víz: {data['waterAmount']} ml")
                    print(f"  Cukor: {data['sugarAmount']} mg")
                    print(f"  Citromlé: {data['lemonJuice']} ml")
                    print(f"  Tea filter: {data['teaFilter']}")

                    # Error generálása
                    await websocket.send(
                        json.dumps({
                            "type": "order_status",
                            "status": "error",
                            "pairId": pair_id,
                            "number": error
                        })
                    )
                    
                    for i in range(0, 11):
                        await asyncio.sleep(1)
                        progress = i * 10
                        print(f"Feldolgozás haladása: {progress}%")

                        
                        await websocket.send(
                            json.dumps({
                                "type": "update_progress",
                                "pairId": pair_id,
                                "progress": progress,
                                "status": "in_progress" if progress < 100 else "completed"
                            })
                        )

                    print("Rendelés feldolgozva.")

                    # Visszajelzés küldése a rendelés befejezéséről
                    await websocket.send(
                        json.dumps({
                            "type": "order_status",
                            "status": "processed",
                            "pairId": pair_id
                        })
                    )

    except websockets.ConnectionClosed as e:
        print(f"Kapcsolat megszakadt: {e}")
    except Exception as e:
        print(f"Hiba történt: {e}")

if __name__ == "__main__":
    asyncio.run(connect_to_server())
