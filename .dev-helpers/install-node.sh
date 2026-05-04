#!/usr/bin/env bash
# Install Node.js LTS to ~/.local/share/nodejs/ — no sudo, no apt.
set -e

NODE_VERSION="v22.11.0"
ARCH="linux-x64"
TARBALL="node-${NODE_VERSION}-${ARCH}.tar.xz"
URL="https://nodejs.org/dist/${NODE_VERSION}/${TARBALL}"

INSTALL_DIR="$HOME/.local/share/nodejs"
BIN_DIR="$HOME/.local/bin"

mkdir -p "$INSTALL_DIR" "$BIN_DIR"

echo "=== downloading $URL ==="
cd /tmp
curl -fsSL -o "$TARBALL" "$URL"

echo "=== extracting ==="
tar xJf "$TARBALL" -C "$INSTALL_DIR" --strip-components=1
rm -f "$TARBALL"

echo "=== linking binaries to $BIN_DIR ==="
for bin in node npm npx corepack; do
  ln -sf "$INSTALL_DIR/bin/$bin" "$BIN_DIR/$bin"
done

echo
echo "=== verifying ==="
"$BIN_DIR/node" --version
"$BIN_DIR/npm" --version
echo

echo "=== adding ~/.local/bin to PATH in .bashrc (idempotent) ==="
BASHRC="$HOME/.bashrc"
MARKER='# >>> local bin (node) <<<'
if ! grep -qF "$MARKER" "$BASHRC" 2>/dev/null; then
  cat >> "$BASHRC" <<EOF

$MARKER
case ":\$PATH:" in
  *":\$HOME/.local/bin:"*) ;;
  *) export PATH="\$HOME/.local/bin:\$PATH" ;;
esac
# <<< local bin (node) <<<
EOF
  echo "Appended PATH export to $BASHRC"
else
  echo "PATH export already present in $BASHRC"
fi

echo
echo "=== DONE === Open a new shell or run: source ~/.bashrc"
