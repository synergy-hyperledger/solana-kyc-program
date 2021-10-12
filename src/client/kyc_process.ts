/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as borsh from 'borsh';

import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';

/**
 * Connection to the network
 */
let connection: Connection;

/**
 * Keypair associated to the fees' payer
 */
let payer: Keypair;

/**
 * Hello world's program id
 */
let programId: PublicKey;

/**
 * The public key of the account we are saying hello to
 */
let kycPubkey: PublicKey;

/**
 * Path to program files
 */
const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

/**
 * Path to program shared object file which should be deployed on chain.
 * This file is created when running either:
 *   - `npm run build:program-c`
 *   - `npm run build:program-rust`
 */
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'kyc.so');

/**
 * Path to the keypair of the deployed program.
 * This file is created when running `solana program deploy dist/program/helloworld.so`
 */
const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'kyc-keypair.json');

class Component {
   opcode =0;
   customer_id = new Uint8Array(64);
   customer_name = new Uint8Array(128);

 // constructor(fields: {opcode: number, customer_id: Uint8Array, customer_name: Uint8Array, kyc_status: boolean, active: boolean} | undefined = undefined) {
  constructor(fields: {opcode: number, customer_id: Uint8Array, customer_name: Uint8Array} | undefined = undefined) {
    if(fields){
      this.opcode = fields.opcode;
      this.customer_id = fields.customer_id;
      this.customer_name = fields.customer_name;
    }
  }
}

const ComponentSchema = new Map([
    [Component, {kind: 'struct', fields: [
      ['opcode', 'u8'],
      ['customer_id', [64]],
      ['customer_name', [128]],
    ]}],
]);
/**
 * Borzh schema definition for creating KYC
 * The expected size of each KYC Component
 */
const KYC_SIZE = borsh.serialize(
  ComponentSchema,
  new Component(),
).length;

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<void> {
  const rpcUrl = await getRpcUrl();
  connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl, version);
}

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
  let fees = 0;
  if (!payer) {
    const {feeCalculator} = await connection.getRecentBlockhash();

    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(KYC_SIZE);

    // Calculate the cost of sending transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    payer = await getPayer();
  }

  let lamports = await connection.getBalance(payer.publicKey);
  if (lamports < fees) {
    // If current balance is not enough to pay for fees, request an airdrop
    const sig = await connection.requestAirdrop(
      payer.publicKey,
      fees - lamports,
    );
    await connection.confirmTransaction(sig);
    lamports = await connection.getBalance(payer.publicKey);
  }

  console.log(
    'Using account',
    payer.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'SOL to pay for fees',
  );
}

/**
 * Check if the hello world BPF program has been deployed
 */
export async function checkProgram(): Promise<void> {
  // Read program id from keypair file
  try {
    const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
    programId = programKeypair.publicKey;
  } catch (err) {
    const errMsg = (err as Error).message;
    throw new Error(
      `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
    );
  }

  // Check if the program has been deployed
  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        'Program needs to be deployed with `solana program deploy dist/program/kyc.so`',
      );
    } else {
      throw new Error('Program needs to be built and deployed');
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }
  console.log(`Using program ${programId.toBase58()}`);

  // Derive the address (public key) of a kyc account from the program so that it's easy to find later.
  const KYC_SEED = 'kyc';
  kycPubkey = await PublicKey.createWithSeed(
    payer.publicKey,
    KYC_SEED,
    programId,
  );

  // Check if the greeting account has already been created
  const kycAccount = await connection.getAccountInfo(kycPubkey);
  console.log("kyc account .............",kycAccount?.data.toString());
  
  if (kycAccount === null) {
    console.log(
      'Creating kyc account',
      kycPubkey.toBase58(),
      'with storage size: ',
      KYC_SIZE
    );
    const lamports = await connection.getMinimumBalanceForRentExemption(
      KYC_SIZE,
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: payer.publicKey,
        basePubkey: payer.publicKey,
        seed: KYC_SEED,
        newAccountPubkey: kycPubkey,
        lamports,
        space: KYC_SIZE,
        programId,
      }),
    );
    await sendAndConfirmTransaction(connection, transaction, [payer]);
  }
}

/**
 * Say hello
 */
export async function createKYCAccount(): Promise<void> {
  console.log('creating component for KYC', kycPubkey.toBase58());

  let this_component = new Component();
  this_component.opcode = 100;
  this_component.customer_id = new TextEncoder().encode("2342342323".substring(0,64).padEnd(64,'*'));
  this_component.customer_name = new TextEncoder().encode("XYZ Technologies pvt ltd..  ".substring(0,128).padEnd(128,'*')); //len exactly 64 bytes
 // this_component.kyc_status = false;
 // this_component.active = true;

  //serialize the component using borsh

  let this_component_s = borsh.serialize(
    ComponentSchema,
    this_component,
  );
  const instruction = new TransactionInstruction({
    keys: [{pubkey: kycPubkey, isSigner: false, isWritable: true}],
    programId,
    data: Buffer.from(this_component_s), // All instructions are hellos
  });
  let txoutput = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
  console.log("Transactiond data ", txoutput);
}


export async function retriveCustomer(): Promise<void> {
  console.log('retrieving customer details ', kycPubkey);
  const accountInfo = await connection.getAccountInfo(kycPubkey);
  if (accountInfo === null) {
    throw 'Error: cannot find the greeted account';
  }
  const component = borsh.deserialize(
    ComponentSchema,
    Component,
    accountInfo.data,
  );

  console.log(
    'Account:',
    kycPubkey.toBase58(),
    '\n',
    'Customer ID:',
    new TextDecoder().decode(component.customer_id),
    '\n',
    'Customer Name:',
    new TextDecoder().decode(component.customer_name),
  
  );

}