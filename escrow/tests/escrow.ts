import * as anchor from "@coral-xyz/anchor";

import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";

import { Escrow } from "../target/types/escrow";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";

describe("escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program<Escrow>;

  let mintA: PublicKey;
  let mintB: PublicKey;
  let makerAtaA: PublicKey;
  let makerAtaB: PublicKey;
  let takerAtaA: PublicKey;
  let takerAtaB: PublicKey;
  let escrowPda: PublicKey;
  let vaultPda: PublicKey;

  const maker = Keypair.generate();
  const taker = Keypair.generate();
  const seed = new anchor.BN(Date.now());
  const escrowAmount = new anchor.BN(50);
  const takerAmount = new anchor.BN(100);

  before(async () => {
    // Airdrop SOL to maker and taker
    await provider.connection.requestAirdrop(maker.publicKey, 1000000000);
    await provider.connection.requestAirdrop(taker.publicKey, 1000000000);

    // Create mints
    mintA = await createMint(
      provider.connection,
      maker,
      maker.publicKey,
      null,
      6
    );
    mintB = await createMint(
      provider.connection,
      taker,
      taker.publicKey,
      null,
      6
    );

    // Create token accounts
    makerAtaA = await createAccount(
      provider.connection,
      maker,
      mintA,
      maker.publicKey
    );
    makerAtaB = await createAccount(
      provider.connection,
      maker,
      mintB,
      maker.publicKey
    );
    takerAtaA = await createAccount(
      provider.connection,
      taker,
      mintA,
      taker.publicKey
    );
    takerAtaB = await createAccount(
      provider.connection,
      taker,
      mintB,
      taker.publicKey
    );

    // Mint tokens
    await mintTo(
      provider.connection,
      maker,
      mintA,
      makerAtaA,
      maker,
      escrowAmount.toNumber()
    );
    await mintTo(
      provider.connection,
      taker,
      mintB,
      takerAtaB,
      taker,
      takerAmount.toNumber()
    );

    // Derive PDAs
    [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), escrowPda.toBuffer()],
      program.programId
    );
  });

  it("Can make escrow", async () => {
    await program.methods
      .make(seed, escrowAmount, takerAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultPda,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.ok(escrowAccount.maker.equals(maker.publicKey));
    assert.ok(escrowAccount.mintA.equals(mintA));
    assert.ok(escrowAccount.mintB.equals(mintB));
    assert.ok(escrowAccount.seed.eq(seed));
    assert.ok(escrowAccount.receive.eq(takerAmount));

    const vaultBalance = await provider.connection.getTokenAccountBalance(
      vaultPda
    );
    assert.ok(vaultBalance.value.uiAmount === escrowAmount.toNumber());
  });

  it("Can take escrow", async () => {
    await program.methods
      .take()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        mintA,
        mintB,
        takerAtaA,
        takerAtaB,
        makerAtaB,
        escrow: escrowPda,
        vault: vaultPda,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc();

    const makerBalanceB = await provider.connection.getTokenAccountBalance(
      makerAtaB
    );
    assert.ok(makerBalanceB.value.uiAmount === takerAmount.toNumber());

    const takerBalanceA = await provider.connection.getTokenAccountBalance(
      takerAtaA
    );
    assert.ok(takerBalanceA.value.uiAmount === escrowAmount.toNumber());

    const escrowAccount = await program.account.escrow.fetchNullable(escrowPda);
    assert.ok(escrowAccount === null);
  });

  it("Can refund escrow", async () => {
    // First, create a new escrow
    await program.methods
      .make(seed, escrowAmount, takerAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultPda,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

    // Now, refund the escrow
    await program.methods
      .refund()
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultPda,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

    const makerBalanceA = await provider.connection.getTokenAccountBalance(
      makerAtaA
    );
    assert.ok(makerBalanceA.value.uiAmount === escrowAmount.toNumber());

    const escrowAccount = await program.account.escrow.fetchNullable(escrowPda);
    assert.ok(escrowAccount === null);
  });
});
