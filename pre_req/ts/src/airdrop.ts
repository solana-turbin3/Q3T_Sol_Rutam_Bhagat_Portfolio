import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { getKeypairFromEnvironment } from "@solana-developers/helpers";

// Get the sender's public key from the environment
const keypair = getKeypairFromEnvironment("SECRET_KEY");
//Create a Solana devnet connection to devnet SOL tokens
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

(async () => {
  try {
    // We're going to claim 2 devnet SOL tokens
    const txhash = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
    console.log(`Success! Check out your TX here:
https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
