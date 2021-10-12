#!/usr/bin/env bash

set -eux
set -o pipefail

#build rust program
npm run build:program-rust

# deploy program
solana program deploy dist/program/kyc.so

# install client npm dependencies

npm install --save




