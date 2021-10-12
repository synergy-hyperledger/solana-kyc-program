/**
 * Hello world
 */

import {
  establishConnection,
  establishPayer,
  checkProgram,
  retriveCustomer,
} from './kyc_process';

async function main() {
  console.log("Let's connect to a Solana account...");

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Check if the program has been deployed
  await checkProgram();

  // create Customer account
  await retriveCustomer();


  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
