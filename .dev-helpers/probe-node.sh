#!/usr/bin/env bash
echo "--- listing /mnt/c/Program Files/nodejs/ ---"
ls "/mnt/c/Program Files/nodejs/" | head
echo
echo "--- node.exe version ---"
"/mnt/c/Program Files/nodejs/node.exe" --version
echo
echo "--- PATH lookup ---"
type node 2>&1 || echo "type node failed"
echo
echo "--- find any node binary in /usr ---"
ls /usr/bin/node* 2>/dev/null || echo "no /usr/bin/node*"
ls /usr/local/bin/node* 2>/dev/null || echo "no /usr/local/bin/node*"
