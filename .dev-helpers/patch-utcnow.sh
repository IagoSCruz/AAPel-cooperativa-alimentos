#!/usr/bin/env bash
# Replace local _utcnow() definitions with imports from app.utils.
# Idempotent — only patches files where the pattern still matches.
set -e
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos/backend/app

FILES=(
  models/user.py
  models/order.py
  models/basket.py
  models/consent.py
  models/catalog.py
  models/logistics.py
  routers/admin/cestas.py
  routers/admin/pontos_coleta.py
  routers/admin/produtores.py
  routers/admin/zonas_entrega.py
  routers/admin/curadorias.py
  routers/admin/produtos.py
)

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "skip (missing): $f"
    continue
  fi
  if grep -q '^from app.utils import utcnow_naive$' "$f"; then
    echo "already patched: $f"
    continue
  fi
  if ! grep -q 'def _utcnow' "$f"; then
    echo "no local _utcnow: $f"
    continue
  fi
  # Remove the local _utcnow function definition (3 lines)
  python3 - "$f" <<'PY'
import re, sys, pathlib
p = pathlib.Path(sys.argv[1])
src = p.read_text()
# Drop the def block
src = re.sub(
    r'\n\ndef _utcnow\(\) -> datetime:\n    return datetime\.now\(timezone\.utc\)\n',
    '\n',
    src,
)
# Remove `from datetime import datetime, timezone` if `timezone` is now unused
if 'timezone.' not in src and ', timezone' in src:
    src = src.replace('from datetime import datetime, timezone', 'from datetime import datetime')
# Replace local _utcnow references with utcnow_naive
src = src.replace('_utcnow()', 'utcnow_naive()')
src = src.replace('default_factory=_utcnow', 'default_factory=utcnow_naive')
# Add import (placed after other `from app.` lines, or after `from sqlmodel`)
if 'from app.utils import utcnow_naive' not in src:
    if 'from app.models._enums_sql' in src:
        src = src.replace(
            'from app.models._enums_sql',
            'from app.utils import utcnow_naive\nfrom app.models._enums_sql',
            1,
        )
    elif 'from sqlmodel' in src:
        # Insert after the sqlmodel line
        lines = src.splitlines(keepends=True)
        out = []
        added = False
        for line in lines:
            out.append(line)
            if not added and line.startswith('from sqlmodel'):
                out.append('\nfrom app.utils import utcnow_naive\n')
                added = True
        src = ''.join(out)
    else:
        src = 'from app.utils import utcnow_naive\n' + src
p.write_text(src)
print(f"patched: {sys.argv[1]}")
PY
done

echo
echo "=== sanity grep ==="
grep -n '_utcnow\|utcnow_naive' /home/iago_cruz/Dev/AAPel-cooperativa-alimentos/backend/app/models/*.py | head
