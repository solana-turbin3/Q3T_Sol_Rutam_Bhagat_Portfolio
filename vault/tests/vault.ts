import * as anchor from "@coral-xyz/anchor";

import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";

import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { expect } from "chai";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;
  const user = provider.wallet;

  let vaultStatePda: PublicKey;
  let vaultPda: PublicKey;

  before(async () => {
    [vaultStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), user.publicKey.toBuffer()],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultStatePda.toBuffer()],
      program.programId
    );
  });

  it("Initializes the vault", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        user: user.publicKey,
      })
      .rpc();

    console.log("Initialization transaction signature", tx);

    const vaultState = await program.account.vaultState.fetch(vaultStatePda);
    expect(vaultState.vaultBump).to.not.be.null;
    expect(vaultState.stateBump).to.not.be.null;
  });

  it("Deposits funds into the vault", async () => {
    const depositAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const initialUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);

    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        user: user.publicKey,
      })
      .rpc();

    console.log("Deposit transaction signature", tx);

    const finalUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);

    expect(finalUserBalance).to.be.below(
      initialUserBalance - depositAmount.toNumber()
    );
    expect(finalVaultBalance).to.equal(
      initialVaultBalance + depositAmount.toNumber()
    );
  });

  it("Withdraws funds from the vault", async () => {
    const withdrawAmount = new anchor.BN(0.08 * LAMPORTS_PER_SOL);
    const initialUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);

    console.log("Initial user balance:", initialUserBalance);
    console.log("Initial vault balance:", initialVaultBalance);
    console.log("Withdraw amount:", withdrawAmount.toString());

    // Verify PDA derivation
    const [calculatedVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultStatePda.toBuffer()],
      program.programId
    );
    console.log("Calculated vault PDA:", calculatedVaultPda.toString());
    console.log("Used vault PDA:", vaultPda.toString());

    if (!calculatedVaultPda.equals(vaultPda)) {
      throw new Error("Vault PDA mismatch");
    }

    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        user: user.publicKey,
      })
      .rpc();

    console.log("Withdraw transaction signature", tx);

    const finalUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);

    console.log("Final user balance:", finalUserBalance);
    console.log("Final vault balance:", finalVaultBalance);

    const balanceDifference = finalUserBalance - initialUserBalance;
    console.log("Balance difference:", balanceDifference);

    expect(balanceDifference).to.be.greaterThan(
      withdrawAmount.toNumber() - 10000
    ); // Allow for up to 10000 lamports in fees
    expect(finalVaultBalance).to.equal(
      initialVaultBalance - withdrawAmount.toNumber()
    );
  });

  it("Closes the vault account", async () => {
    const initialUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);

    const tx = await program.methods
      .closeAccount()
      .accounts({
        user: user.publicKey,
      })
      .rpc();

    console.log("Close account transaction signature", tx);

    const finalUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);

    expect(finalUserBalance).to.be.above(
      initialUserBalance + initialVaultBalance - 10000
    ); // Allow for fees
    expect(finalVaultBalance).to.equal(0);

    // Verify that the vault state account is closed
    try {
      await program.account.vaultState.fetch(vaultStatePda);
      throw new Error("Vault state account should be closed");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
    }
  });
});
