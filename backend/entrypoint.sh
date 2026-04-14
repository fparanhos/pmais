#!/bin/sh
set -e

# Cria database se não existir (quando compartilhamos instância postgres)
if [ -n "$DB_BOOTSTRAP_URL" ] && [ -n "$DB_NAME" ]; then
  python - <<EOF
import os, psycopg2
from psycopg2 import sql
conn = psycopg2.connect(os.environ["DB_BOOTSTRAP_URL"])
conn.autocommit = True
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (os.environ["DB_NAME"],))
if not cur.fetchone():
    cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(os.environ["DB_NAME"])))
    print("database created:", os.environ["DB_NAME"])
else:
    print("database exists:", os.environ["DB_NAME"])
cur.close(); conn.close()
EOF
fi

alembic upgrade head
exec "$@"
