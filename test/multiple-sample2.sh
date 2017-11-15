#!/bin/sh

for i in `seq 1 10`
do
  xvfb-run -n $i node ./dest/src/sample2.js &
done