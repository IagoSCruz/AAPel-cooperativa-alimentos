#!/usr/bin/env bash
echo "--- direct: node ---"
node --version 2>&1
echo "exit=$?"
echo
echo "--- direct: npm ---"
npm --version 2>&1
echo "exit=$?"
