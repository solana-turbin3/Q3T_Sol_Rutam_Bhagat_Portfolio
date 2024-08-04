# Web3 Builders Alliance Q3 2024 Cohort Enrollment

This repository contains enrollment tasks for the Web3 Builders Alliance (WBA) Q3 2024 Cohort. It includes implementations in both TypeScript and Rust.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [TypeScript Implementation](#typescript-implementation)
- [Rust Implementation](#rust-implementation)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) (for TypeScript implementation)
- [Rust](https://www.rust-lang.org/) (for Rust implementation)
- [Git](https://git-scm.com/)

## TypeScript Implementation

Navigate to the `ts` directory to work with the TypeScript implementation.

### Setup

1. Install dependencies:

```sh
   bun install
```

### Available Commands

- Create a development wallet:

  ```sh
  bun keygen
  ```

- Airdrop SOL to the development wallet:

  ```sh
  bun airdrop
  ```

- Transfer SOL from the development wallet to the WBA wallet:

  ```sh
  bun transfer
  ```

- Convert WBA wallet private key exported from Phantom:

  ```sh
  bun walletConvert
  ```

- Enroll in the 2024 Q3 Cohort:
  ```sh
  bun enroll
  ```

## Rust Implementation

Navigate to the `rs` directory to work with the Rust implementation.

### Available Commands

All Rust commands are executed using `cargo test` with the `--nocapture` flag to display output.

- Create a development wallet:

  ```sh
  cargo test keygen -- --nocapture
  ```

- Airdrop SOL to the development wallet:

  ```sh
  cargo test airdrop -- --nocapture
  ```

- Transfer SOL from the development wallet to the WBA wallet:

  ```sh
  cargo test transfer_sol -- --nocapture
  ```

- Transfer all SOL from the development wallet to the WBA wallet:

  ```sh
  cargo test transfer_all_sol -- --nocapture
  ```

- Convert WBA wallet private key exported from Phantom:

  ```sh
  cargo test base58_to_wallet -- --nocapture
  ```

- Convert bytes array to base58 string:

  ```sh
  cargo test wallet_to_base58 -- --nocapture
  ```

- Enroll in the 2024 Q3 Cohort:
  ```sh
  cargo test enroll_wba -- --nocapture
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
