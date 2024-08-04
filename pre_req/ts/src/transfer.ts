import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { getKeypairFromEnvironment } from "@solana-developers/helpers";

// Get the sender's public key from the environment
const from = getKeypairFromEnvironment("SECRET_KEY");

// Define our WBA public key
// Define our WBA public key
const to = new PublicKey(process.env.WBA_PUBLIC_KEY as string);
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// // Transfer 0.01 SOL to WBA
// (async () => {
//   try {
//     const transaction = new Transaction().add(
//       SystemProgram.transfer({
//         fromPubkey: from.publicKey,
//         toPubkey: to,
//         lamports: LAMPORTS_PER_SOL / 100,
//       })
//     );
//     transaction.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
//     transaction.feePayer = from.publicKey;
//     // Sign transaction, broadcast, and confirm
//     const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
//     console.log(`Success! Check out your TX here:
// https://explorer.solana.com/tx/${signature}?cluster=devnet`);
//   } catch (e) {
//     console.error(`Oops, something went wrong: ${e}`);
//   }
// })();

// Transfer all remaining SOL to WBA
(async () => {
  try {
    // Get balance of dev wallet
    const balance = await connection.getBalance(from.publicKey);
    // Create a test transaction to calculate fees
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance,
      })
    );
    transaction.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
    transaction.feePayer = from.publicKey;
    // Calculate exact fee rate to transfer entire SOL amount out of account minus fees
    const fee = (await connection.getFeeForMessage(transaction.compileMessage(), "confirmed")).value || 0;
    // Remove our transfer instruction to replace it
    transaction.instructions.pop();
    // Now add the instruction back with correct amount of lamports
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance - fee,
      })
    );
    // Sign transaction, broadcast, and confirm
    const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
    console.log(`Success! Check out your TX here:
https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
