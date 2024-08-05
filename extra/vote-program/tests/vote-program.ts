import * as anchor from "@coral-xyz/anchor";

import { Program } from "@coral-xyz/anchor";
import { VoteProgram } from "../target/types/vote_program";

describe("vote-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VoteProgram as Program<VoteProgram>;

  const url = "https://wba.dev";

  const [voteAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(url)],
    program.programId
  );

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize(url)
      .accounts({
        payer: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Your transaction signature", tx);

    let voteState = await program.account.voteState.fetch(voteAccount);
    console.log("Your vote score is", voteState.score.toString());
  });

  it("Upvote!", async () => {
    const tx = await program.methods
      .upvote(url)
      .accounts({
        voteAccount,
      })
      .rpc();

    console.log("Your transaction signature", tx);

    let voteState = await program.account.voteState.fetch(voteAccount);
    console.log("Your vote score is", voteState.score.toString());
  });

  it("Downvote!", async () => {
    const tx = await program.methods
      .downvote(url)
      .accounts({
        voteAccount,
      })
      .rpc();

    console.log("Your transaction signature", tx);

    let voteState = await program.account.voteState.fetch(voteAccount);
    console.log("Your vote score is", voteState.score.toString());
  });
});
