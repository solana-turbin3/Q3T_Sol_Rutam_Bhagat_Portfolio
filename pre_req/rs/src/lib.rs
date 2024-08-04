mod programs;

#[cfg(test)]
mod tests {
    use crate::programs::wba_prereq::{CompleteArgs, WbaPrereqProgram};
    use bs58;
    use dotenvy::dotenv;
    use serde_json::from_str;
    use solana_client::rpc_client::RpcClient;
    use solana_program::{pubkey::Pubkey, system_instruction::transfer};
    use solana_sdk::{
        message::Message,
        signature::{Keypair, Signer},
        system_program,
        transaction::Transaction,
    };
    use std::env;
    use std::io::{self, BufRead};
    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com";

    #[test]
    fn keygen() {
        // Create a new keypair
        let kp = Keypair::new();
        println!(
            "You've generated a new Solana wallet: {}",
            kp.pubkey().to_string()
        );
        println!("");
        println!("To save your wallet, copy and paste the following into a JSON file:");
        println!("{:?}", kp.to_bytes());
    }

    #[test]
    fn base58_to_wallet() {
        println!("Input your private key as base58:");
        let stdin = io::stdin();
        let base58 = stdin.lock().lines().next().unwrap().unwrap();
        println!("Your wallet file is:");
        let wallet = bs58::decode(base58).into_vec().unwrap();
        println!("{:?}", wallet);
    }

    #[test]
    fn wallet_to_base58() {
        println!("Input your private key as a wallet file byte array:");
        let stdin = io::stdin();
        let wallet = stdin
            .lock()
            .lines()
            .next()
            .unwrap()
            .unwrap()
            .trim_start_matches('[')
            .trim_end_matches(']')
            .split(',')
            .map(|s| s.trim().parse::<u8>().unwrap())
            .collect::<Vec<u8>>();
        println!("Your private key is:");
        let base58 = bs58::encode(wallet).into_string();
        println!("{:?}", base58);
    }

    #[test]
    fn airdop() {
        dotenv().ok();
        // Import our keypair from .env
        let private_key_json = env::var("PRIVATE_KEY").expect("PRIVATE_KEY not set");
        let private_key: Vec<u8> =
            from_str(&private_key_json).expect("Failed to parse PRIVATE_KEY");

        // Get keypair from private key
        let keypair = Keypair::from_bytes(&private_key).expect("Failed to create keypair");

        let client = RpcClient::new(RPC_URL);
        match client.request_airdrop(&keypair.pubkey(), 2_000_000_000u64) {
            Ok(s) => {
                println!("Success! Check out your TX here:");
                println!(
                    "https://explorer.solana.com/tx/{}?cluster=devnet",
                    s.to_string()
                );
            }
            Err(e) => println!("Oops, something went wrong: {}", e.to_string()),
        };
    }

    #[test]
    fn transfer_sol() {
        dotenv().ok();
        // Import our keypair from .env
        let private_key_json = env::var("PRIVATE_KEY").expect("PRIVATE_KEY not set");
        let private_key: Vec<u8> =
            from_str(&private_key_json).expect("Failed to parse PRIVATE_KEY");

        // Get keypair from private key
        let keypair = Keypair::from_bytes(&private_key).expect("Failed to create keypair");

        // Define our WBA public key
        let to_pubkey_str =
            env::var("WBA_WALLET_PUBLIC_KEY").expect("WBA_WALLET_PUBLIC_KEY not set");
        let to_pubkey =
            Pubkey::from_str(&to_pubkey_str).expect("Failed to parse WBA_WALLET_PUBLIC_KEY");

        // Create a Solana devnet connection
        let rpc_client = RpcClient::new(RPC_URL);

        // Get recent blockhash
        let recent_blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");

        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &to_pubkey, 1_000_000)],
            Some(&keypair.pubkey()),
            &[&keypair],
            recent_blockhash,
        );

        // Send the transaction
        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");

        // Print our transaction out
        println!(
            "Success! Check out your TX here: 
            https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }

    #[test]
    fn transfer_all_sol() {
        dotenv().ok();
        // Import our keypair from .env
        let private_key_json = env::var("PRIVATE_KEY").expect("PRIVATE_KEY not set");
        let private_key: Vec<u8> =
            from_str(&private_key_json).expect("Failed to parse PRIVATE_KEY");

        // Get keypair from private key
        let keypair = Keypair::from_bytes(&private_key).expect("Failed to create keypair");

        // Define our WBA public key
        let to_pubkey_str =
            env::var("WBA_WALLET_PUBLIC_KEY").expect("WBA_WALLET_PUBLIC_KEY not set");
        let to_pubkey =
            Pubkey::from_str(&to_pubkey_str).expect("Failed to parse WBA_WALLET_PUBLIC_KEY");

        // Create a Solana devnet connection
        let rpc_client = RpcClient::new(RPC_URL);

        // Get recent blockhash
        let recent_blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");

        // Get balance of dev wallet
        let balance = rpc_client
            .get_balance(&keypair.pubkey())
            .expect("Failed to get balance");

        // Create a test transaction to calculate fees
        let message = Message::new_with_blockhash(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance)],
            Some(&keypair.pubkey()),
            &recent_blockhash,
        );

        // Calculate exact fee rate to transfer entire SOL amount out of account minus fees
        let fee = rpc_client
            .get_fee_for_message(&message)
            .expect("Failed to get fee calculator");

        // Deduct fee from lamports amount and create a TX with correct balance
        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance - fee)],
            Some(&keypair.pubkey()),
            &vec![&keypair],
            recent_blockhash,
        );

        // Send the transaction
        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");

        // Print our transaction out
        println!(
            "Success! Check out your TX here: 
            https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }

    #[test]
    fn enroll_wba() {
        dotenv().ok();
        // Create a Solana devnet connection
        let rpc_client = RpcClient::new(RPC_URL);
        // Let's define our accounts
        let private_key_json =
            env::var("WBA_WALLET_PRIVATE_KEY").expect("WBA_WALLET_PRIVATE_KEY not set");
        let private_key: Vec<u8> =
            from_str(&private_key_json).expect("Failed to parse WBA_WALLET_PRIVATE_KEY");

        // Get keypair from private key
        let signer = Keypair::from_bytes(&private_key).expect("Failed to create keypair");
        let prereq = WbaPrereqProgram::derive_program_address(&[
            b"prereq",
            signer.pubkey().to_bytes().as_ref(),
        ]);
        // Define our instruction data
        let args = CompleteArgs {
            github: b"RutamBhagat".to_vec(),
        };
        // Get recent blockhash
        let blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");
        // Now we can invoke the "complete" function
        let transaction = WbaPrereqProgram::complete(
            &[&signer.pubkey(), &prereq, &system_program::id()],
            &args,
            Some(&signer.pubkey()),
            &[&signer],
            blockhash,
        );
        // Send the transaction
        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");
        // Print our transaction out
        println!(
            "Success! Check out your TX here: 
            https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }
}
