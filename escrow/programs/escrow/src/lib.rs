use anchor_lang::prelude::*;

declare_id!("8XcApMHke2GjVzJQAB7ZCvHF8SpikYsndQNB8jwWDb4C");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
