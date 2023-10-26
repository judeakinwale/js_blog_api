#!/bin/bash

# if start.sh in config folder
cd ..

if [ "$NODE_ENV" == "production" ] ; then
  npm run start
else
  npm run dev
fi