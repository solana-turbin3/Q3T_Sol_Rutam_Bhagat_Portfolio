import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";
import wallet from "../wba-wallet.json";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    //1. Load image
    const imageFile = await readFile(
      "/home/rutam/Downloads/Code/rust/turbin_wba/week_0/solana-starter/ts/cluster1/rugpull.png"
    );

    //2. Convert image to generic file.
    const generic = createGenericFile(imageFile, "generug.png", { contentType: "image/png" });

    //3. Upload image
    const [myUri] = await umi.uploader.upload([generic]);
    console.log("Image uploaded successfully. URI:", myUri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
