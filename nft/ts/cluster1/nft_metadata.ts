import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import wallet from "../wba-wallet.json";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    // Follow this JSON structure
    // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

    const image = "https://arweave.net/M2bF3Ug53fL1dCzE1EOnkjzEFtVPxOIB0jZv3JYVe4o";
    const metadata = {
      name: "RUG PULL RUG",
      symbol: "RPR",
      description: "Rug Pull Master Edition Rug",
      image: image,
      attributes: [{ trait_type: "material", value: "Rug" }],
      properties: {
        files: [
          {
            type: "image/png",
            uri: image,
          },
        ],
      },
      creators: [],
    };

    const metadataFile = createGenericFile(Buffer.from(JSON.stringify(metadata)), "metadata.json", {
      contentType: "application/json",
    });

    const [myUri] = await umi.uploader.upload([metadataFile]);
    console.log("Your metadata URI: ", myUri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
