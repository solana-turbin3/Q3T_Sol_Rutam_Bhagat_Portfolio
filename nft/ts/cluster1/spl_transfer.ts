import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getMint, getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

import wallet from "../wba-wallet.json";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("cvDnzKitkHiDJhrc2rmvBQic8KQ1ei46XjM4CMyNY7k");

// Recipient address
const to = new PublicKey("JCZjJcmuWidrj5DwuJBxwqHx7zRfiBAp6nCLq3zYmBxd");

(async () => {
  try {
    // Get mint info
    const mintInfo = await getMint(connection, mint);

    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, to);

    // Transfer the new token to the "toTokenAccount" we just created
    const tx = await transfer(
      connection,
      keypair,
      fromWallet.address,
      toWallet.address,
      keypair,
      10 * 10 ** mintInfo.decimals
    );
    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
