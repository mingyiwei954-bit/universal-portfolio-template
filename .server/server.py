"""Static homepage plus persistent, idempotent like-count API."""
import argparse, functools, json, sqlite3, uuid
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Handler(SimpleHTTPRequestHandler):
    def reply(self, status, body):
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path.split('?')[0] != '/api/likes':
            return super().do_GET()
        with sqlite3.connect(self.server.database) as db:
            total = db.execute('SELECT total FROM counter WHERE id=1').fetchone()[0]
        self.reply(200, {'total': total})

    def do_POST(self):
        if self.path != '/api/likes':
            return self.reply(404, {'error': 'Not found'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 1024:
                raise ValueError()
            data = json.loads(self.rfile.read(length))
            batch = str(uuid.UUID(data['id']))
            count = data['count']
            if type(count) is not int or not 1 <= count <= 200:
                raise ValueError()
        except (ValueError, KeyError, TypeError):
            return self.reply(400, {'error': 'Invalid batch'})
        with sqlite3.connect(self.server.database, timeout=10) as db:
            db.execute('BEGIN IMMEDIATE')
            added = db.execute('INSERT OR IGNORE INTO batches(id) VALUES (?)', (batch,)).rowcount
            if added:
                db.execute('UPDATE counter SET total=total+? WHERE id=1', (count,))
            total = db.execute('SELECT total FROM counter WHERE id=1').fetchone()[0]
        self.reply(200, {'total': total})

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8768)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent / 'ev0331')
    parser.add_argument('--database', type=Path, default=Path(__file__).resolve().parent / 'data' / 'likes.sqlite3')
    args = parser.parse_args()
    args.database.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(args.database) as db:
        db.executescript('CREATE TABLE IF NOT EXISTS counter(id INTEGER PRIMARY KEY, total INTEGER NOT NULL); INSERT OR IGNORE INTO counter VALUES(1,0); CREATE TABLE IF NOT EXISTS batches(id TEXT PRIMARY KEY);')
    server = ThreadingHTTPServer((args.host, args.port), functools.partial(Handler, directory=str(args.root)))
    server.database = args.database
    server.serve_forever()
