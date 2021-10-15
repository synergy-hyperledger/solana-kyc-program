#!/usr/bin/env bash

set -eux
set -o pipefail

#build rust program
cd src/program-rust

cargo build-bpf

# deploy program
solana program deploy target/deploy/kyc.so

# install client npm dependencies

#npm install --save




