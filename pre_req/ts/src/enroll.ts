import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { type Idl } from "@coral-xyz/anchor";

import { IDL } from "../programs/wba_prereq";
// import wallet from "./wba-wallet.json";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

// Get the sender's public key from the environment
const keypair = getKeypairFromEnvironment("WBA_SECRET_KEY");
// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
// Github account
const github = Buffer.from("RutamBhagat", "utf8");
// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });
// Create our program
const program: Program<Idl> = new Program(IDL, provider);
// Create the PDA for our enrollment account
const enrollment_seeds = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

// Execute our enrollment transaction
(async () => {
  try {
    const txhash = await program.methods
      .complete(github)
      .accounts({
        signer: keypair.publicKey,
        enrollmentAccount: enrollment_key,
      })
      .signers([keypair])
      .rpc();
    console.log(`Success! Check out your TX here:
https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
