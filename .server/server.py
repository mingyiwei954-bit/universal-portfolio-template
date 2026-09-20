"""Self-contained static site and isolated, persistent like counter."""

import argparse
import json
import os
import sqlite3
import uuid
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn


try:
    from http.server import ThreadingHTTPServer
except ImportError:  # Python 3.6
    class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
        daemon_threads = True


def connect(database):
    db = sqlite3.connect(str(database), timeout=10)
    db.execute("PRAGMA busy_timeout=10000")
    return db


def initialize(database):
    database.parent.mkdir(parents=True, exist_ok=True)
    with connect(database) as db:
        db.executescript(
            """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS metadata(
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS counter(
                id INTEGER PRIMARY KEY CHECK(id = 1),
                total INTEGER NOT NULL CHECK(total >= 0)
            );
            CREATE TABLE IF NOT EXISTS batches(
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT OR IGNORE INTO counter(id, total) VALUES(1, 0);
            """
        )
        row = db.execute(
            "SELECT value FROM metadata WHERE key='instance_id'"
        ).fetchone()
        if row:
            return row[0]
        instance_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO metadata(key, value) VALUES('instance_id', ?)",
            (instance_id,),
        )
        return instance_id


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def reply(self, status, body):
        raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def state(self):
        with connect(self.server.database) as db:
            total = db.execute(
                "SELECT total FROM counter WHERE id=1"
            ).fetchone()[0]
        return {"total": total, "instance": self.server.instance_id}

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/api/health":
            return self.reply(200, {"ok": True, "instance": self.server.instance_id})
        if route == "/api/likes":
            return self.reply(200, self.state())
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/likes":
            return self.reply(404, {"error": "Not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 2048:
                raise ValueError()
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            batch = str(uuid.UUID(data["id"]))
            instance_id = str(uuid.UUID(data["instance"]))
            count = data["count"]
            if instance_id != self.server.instance_id:
                return self.reply(409, {
                    "error": "Backend instance changed",
                    "instance": self.server.instance_id,
                })
            if type(count) is not int or not 1 <= count <= 200:
                raise ValueError()
        except (ValueError, KeyError, TypeError, UnicodeDecodeError):
            return self.reply(400, {"error": "Invalid batch"})

        with connect(self.server.database) as db:
            db.execute("BEGIN IMMEDIATE")
            added = db.execute(
                "INSERT OR IGNORE INTO batches(id) VALUES (?)", (batch,)
            ).rowcount
            if added:
                db.execute(
                    "UPDATE counter SET total=total+? WHERE id=1", (count,)
                )
            total = db.execute(
                "SELECT total FROM counter WHERE id=1"
            ).fetchone()[0]
        return self.reply(200, {
            "total": total,
            "instance": self.server.instance_id,
        })


def parse_args():
    project_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        description="Serve the portfolio and its isolated like counter."
    )
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument(
        "--port", type=int, default=int(os.environ.get("PORT", "8769"))
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(os.environ.get("SITE_ROOT", str(project_root))),
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=Path(
            os.environ.get(
                "LIKES_DB", str(project_root / ".server" / "data" / "likes.sqlite3")
            )
        ),
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    root = args.root.resolve()
    database = args.database.resolve()
    if not (root / "index.html").is_file():
        raise SystemExit("Site root must contain index.html: {}".format(root))
    instance_id = initialize(database)
    os.chdir(str(root))
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.database = str(database)
    server.instance_id = instance_id
    print(
        "Portfolio running at http://{}:{}/ (instance {})".format(
            args.host, args.port, instance_id
        ),
        flush=True,
    )
    server.serve_forever()
