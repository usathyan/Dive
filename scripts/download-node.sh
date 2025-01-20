#!/bin/bash

NODE_VERSION="20.18.1"
PLATFORM="${1:-win-x64}"

mkdir -p temp
mkdir -p node/${PLATFORM}

echo "Downloading Node.js v${NODE_VERSION}..."
if [[ "$PLATFORM" == "win-x64" ]]; then
    FILENAME="node-v${NODE_VERSION}-${PLATFORM}.zip"
else
    FILENAME="node-v${NODE_VERSION}-${PLATFORM}.tar.gz"
fi

URL="https://nodejs.org/dist/v${NODE_VERSION}/${FILENAME}"
curl -L "$URL" -o "temp/${FILENAME}"

echo "Extracting..."
if [[ "$PLATFORM" == "win-x64" ]]; then
    unzip -o "temp/${FILENAME}" -d temp/
else
    tar -xzf "temp/${FILENAME}" -C temp/
fi

echo "Moving files..."
mv "temp/node-v${NODE_VERSION}-${PLATFORM}"/* node/${PLATFORM}

echo "Cleaning up..."
rm -rf temp

echo "Done! Node.js v${NODE_VERSION} has been downloaded to ./node/${PLATFORM}" 