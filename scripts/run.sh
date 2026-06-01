#!/usr/bin/env bash
set -e

chmod +x build/main || true
exec ./build/main
