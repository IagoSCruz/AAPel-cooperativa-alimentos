#!/usr/bin/env bash
# Install fnm (Fast Node Manager) and Node LTS — no sudo required.
set -e

echo "=== installing fnm ==="
curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
echo

# fnm installs to ~/.local/share/fnm
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env --use-on-cd --shell bash)"

echo "=== fnm version ==="
fnm --version
echo

echo "=== installing Node LTS ==="
fnm install --lts
fnm default lts-latest
echo

echo "=== node + npm versions ==="
node --version
npm --version
echo

echo "=== adding shell init to .bashrc (idempotent) ==="
BASHRC="$HOME/.bashrc"
MARKER="# >>> fnm initializer <<<"
if ! grep -qF "$MARKER" "$BASHRC" 2>/dev/null; then
  cat >> "$BASHRC" <<'EOF'

# >>> fnm initializer <<<
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env --use-on-cd --shell bash)"
# <<< fnm initializer <<<
EOF
  echo "Appended fnm init to $BASHRC"
else
  echo "fnm init already present in $BASHRC"
fi

echo
echo "=== DONE ==="
