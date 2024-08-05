use anchor_lang::prelude::*;

declare_id!("EfUzENuCxeM1V3dxXpTaRFbtNMAboznTKR67CeMWcZ9T");

#[program]
pub mod vote_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, _url: String) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)?;
        Ok(())
    }

    pub fn upvote(ctx: Context<Vote>, _url: String) -> Result<()> {
        ctx.accounts.upvote()?;
        Ok(())
    }

    pub fn downvote(ctx: Context<Vote>, _url: String) -> Result<()> {
        ctx.accounts.downvote()?;
        Ok(())
    }

    // New instruction to get the last voter's address
    pub fn get_last_voter(ctx: Context<GetLastVoter>, _url: String) -> Result<Pubkey> {
        Ok(ctx.accounts.vote_account.last_voter)
    }
}

#[derive(Accounts)]
#[instruction(_url: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [_url.as_bytes()],
        bump,
        space = VoteState::INIT_SPACE
    )]
    pub vote_account: Account<'info, VoteState>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        self.vote_account.score = 0;
        self.vote_account.bump = bumps.vote_account;
        self.vote_account.last_voter = Pubkey::default(); // Initialize with default Pubkey
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(_url: String)]
pub struct Vote<'info> {
    #[account(
        mut,
        seeds = [_url.as_bytes()],
        bump = vote_account.bump
    )]
    pub vote_account: Account<'info, VoteState>,
    pub voter: Signer<'info>, // Add the voter (signer) to the context
}

impl<'info> Vote<'info> {
    pub fn upvote(&mut self) -> Result<()> {
        self.vote_account.score += 1;
        self.vote_account.last_voter = self.voter.key(); // Store the voter's address
        Ok(())
    }

    pub fn downvote(&mut self) -> Result<()> {
        self.vote_account.score -= 1;
        self.vote_account.last_voter = self.voter.key(); // Store the voter's address
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(_url: String)]
pub struct GetLastVoter<'info> {
    #[account(
        seeds = [_url.as_bytes()],
        bump = vote_account.bump
    )]
    pub vote_account: Account<'info, VoteState>,
}

#[account]
pub struct VoteState {
    pub score: i64,
    pub bump: u8,
    pub last_voter: Pubkey, // New field to store the last voter's address
}

impl Space for VoteState {
    const INIT_SPACE: usize = 8 + 8 + 1 + 32; // Add 32 bytes for Pubkey
}
