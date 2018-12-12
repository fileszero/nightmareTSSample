#!/usr/bin/env bash

# save with LF
set -e

lockfile=/tmp/.X99-lock
if [ -e $lockfile ]; then
    rm $lockfile
fi

# Start Xvfb
Xvfb -ac -screen scrn 1280x2000x24 :99.0 &
export DISPLAY=:99.0

exec "$@"
