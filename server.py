import json
import os
import ssl
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import parse, request

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8914109311:AAFkYyvFTRfMW3_iCzJsAnuxRiDdS_NTcrw")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "8976198078")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class BookingHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/booking":
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": "Not found"}).encode("utf-8"))
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except Exception:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": "Invalid JSON"}).encode("utf-8"))
            return

        required_fields = ["name", "phone", "checkin", "checkout", "guests"]
        missing = [field for field in required_fields if not str(payload.get(field, "")).strip()]

        if missing:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": f"Missing required fields: {', '.join(missing)}"}).encode("utf-8"))
            return

        text = "\n".join([
            "<b>Новая заявка на бронирование</b>",
            "",
            f"<b>Имя:</b> {payload.get('name', '').strip()}",
            f"<b>Телефон:</b> {payload.get('phone', '').strip()}",
            f"<b>Дата заезда:</b> {payload.get('checkin', '').strip()}",
            f"<b>Дата выезда:</b> {payload.get('checkout', '').strip()}",
            f"<b>Количество гостей:</b> {payload.get('guests', '').strip()}",
            f"<b>Комментарий:</b> {payload.get('message', '').strip() or '—'}",
            f"<b>Дополнительные пожелания:</b> {payload.get('wishes', '').strip() or '—'}",
        ])

        telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        telegram_payload = json.dumps({
            "chat_id": CHAT_ID,
            "text": text,
            "parse_mode": "HTML"
        }).encode("utf-8")

        req = request.Request(
            telegram_url,
            data=telegram_payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            context = ssl._create_unverified_context()
            with request.urlopen(req, timeout=15, context=context) as response:
                response_data = response.read().decode("utf-8")
                result = json.loads(response_data)
        except Exception as exc:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(exc)}).encode("utf-8"))
            return

        self.send_response(200 if result.get("ok") else 500)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": bool(result.get("ok")), "result": result}).encode("utf-8"))

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": "Only POST is allowed"}).encode("utf-8"))
            return

        safe_path = self.path.split("?", 1)[0]
        if safe_path in ("", "/"):
            safe_path = "/index.html"

        if safe_path.startswith("/"):
            local_path = os.path.normpath(BASE_DIR + safe_path)
        else:
            local_path = os.path.normpath(BASE_DIR + "/" + safe_path)

        if os.path.commonpath([BASE_DIR, local_path]) != BASE_DIR:
            self.send_error(403, "Forbidden")
            return

        if not os.path.exists(local_path) or os.path.isdir(local_path):
            self.send_error(404, "File not found")
            return

        mime_types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".jpeg": "image/jpeg",
            ".jpg": "image/jpeg",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        }

        extension = os.path.splitext(local_path)[1].lower()
        content_type = mime_types.get(extension, "application/octet-stream")

        try:
            with open(local_path, "rb") as file:
                content = file.read()
        except OSError:
            self.send_error(404, "File not found")
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8000), BookingHandler)
    print("Serving on http://localhost:8000")
    server.serve_forever()
