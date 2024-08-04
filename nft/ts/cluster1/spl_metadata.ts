import {
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
  createMetadataAccountV3,
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi";

import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../wba-wallet.json";

// Define our Mint address
const mint = publicKey("cvDnzKitkHiDJhrc2rmvBQic8KQ1ei46XjM4CMyNY7k");

// Create a UMI connection
const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
  try {
    // Start here
    let accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: mint,
      mintAuthority: signer,
    };
    let data: DataV2Args = {
      name: "Turbin WBA",
      symbol: "WBA",
      uri: "https://arweave.net/1234567890",
      sellerFeeBasisPoints: 100,
      creators: [
        {
          address: signer.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    };
    let args: CreateMetadataAccountV3InstructionArgs = {
      data: data,
      isMutable: true,
      collectionDetails: null,
    };
    let tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });
    let result = await tx.sendAndConfirm(umi);
    console.log(`https://explorer.solana.com/tx/${bs58.encode(result.signature)}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
