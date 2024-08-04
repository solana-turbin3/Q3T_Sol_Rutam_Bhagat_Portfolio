import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import inquirer from "inquirer";

// Function to convert base58 private key to Keypair
function base58ToKeypair(base58PrivateKey: string): Keypair {
  const privateKeyBuffer = bs58.decode(base58PrivateKey);
  return Keypair.fromSecretKey(privateKeyBuffer);
}

// Function to convert Keypair to base58 private key
function keypairToBase58(keypair: Keypair): string {
  return bs58.encode(keypair.secretKey);
}

// Main function to handle user input
async function main() {
  const question = [
    {
      type: "list",
      name: "option",
      message: "Choose an option:",
      choices: [
        { name: "Base58 to Keypair", value: "1" },
        { name: "Keypair to Base58", value: "2" },
      ],
    },
  ];

  // @ts-ignore
  const { option } = await inquirer.prompt(question);

  if (option === "1") {
    const questionA = [
      {
        type: "input",
        name: "base58PrivateKey",
        message: "Enter the Base58 private key:",
      },
    ];
    // @ts-ignore
    const { base58PrivateKey } = await inquirer.prompt(questionA);

    try {
      const keypair = base58ToKeypair(base58PrivateKey);
      console.log(`Public Key: ${keypair.publicKey.toBase58()}`);

      // Format the secret key as an array in a single line
      const secretKeyArray = Array.from(keypair.secretKey);
      const formattedSecretKey = JSON.stringify(secretKeyArray).replace(/,/g, ", ");
      console.log(`Private Key (Array Format): ${formattedSecretKey}`);
    } catch (error) {
      // @ts-ignore
      console.error("Error: " + error.message);
    }
  } else if (option === "2") {
    const questionB = [
      {
        type: "input",
        name: "secretKeyInput",
        message: "Enter the Keypair secret key as a comma-separated list (e.g., 111, 222, ...):",
      },
    ];
    // @ts-ignore
    const { secretKeyInput } = await inquirer.prompt(questionB);

    // Remove square brackets if present
    const cleanedSecretKeyInput = secretKeyInput.replace(/[\[\]]/g, "");

    const secretKeyArray = cleanedSecretKeyInput.split(",").map((num: string) => parseInt(num.trim(), 10));
    try {
      const keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
      const base58PrivateKey = keypairToBase58(keypair);
      console.log(`Base58 Private Key: ${base58PrivateKey}`);
    } catch (error) {
      // @ts-ignore
      console.error("Error creating keypair: " + error.message);
    }
  } else {
    console.log("Invalid option. Please choose 1 or 2.");
  }
}

// Execute the main function
main().catch((error) => {
  console.error("An unexpected error occurred: " + error.message);
});
