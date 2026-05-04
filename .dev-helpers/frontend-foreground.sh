#!/usr/bin/env bash
# Foreground pnpm dev — when launched via Start-Process, this WSL session
# stays alive as long as the pnpm process is running.
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
exec pnpm dev > /tmp/aapel-frontend.log 2>&1
