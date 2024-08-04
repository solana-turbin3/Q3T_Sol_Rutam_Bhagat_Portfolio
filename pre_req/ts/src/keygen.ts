import { Keypair } from "@solana/web3.js";
import fs from "fs";

//Generate a new keypair
let kp = Keypair.generate();
console.log(`You've generated a new Solana wallet: ${kp.publicKey.toBase58()}`);
const secretKey = Array.from(kp.secretKey);
console.log("secretKey", secretKey);

// write the keypair.secretKey to dev-wallet.json
fs.writeFileSync("dev-wallet.json", JSON.stringify(secretKey));
