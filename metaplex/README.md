# Tool to help you mint automatically due to timezone differences
Works only for metaplex's Candy Machine V2 (For Magic Eden use Tamper Monkey or other tools)
1. Complete the [Getting Started page of Metaplex tutorial](https://docs.metaplex.com/candy-machine-v2/getting-started) to obtain the necessary dependencies (Metaplex Candy Machine, Solana wallet, etc)
2. Place the ```auto_mint.ts``` file under this directory: ```~/metaplex/js/packages/cli/src/```
3. You can now auto mint. For example by calling ```ts-node ~/metaplex/js/packages/cli/src/auto_mint.ts mint_one_token --keypair ~/.config/solana/devnet.json --candy 4FfahYtvhZV9nNXw5eaXbkGYzKTEVBazWFoz544B5yff --time='17 Jan 2022 5:40:56 GMT' --env devnet --rpc-url https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899```
  - ```keypair``` is the Solana keypair of your Solana wallet you want to use to pay for the mint.
  - ```candy``` is the candy machine you want to mint from.
  - ```time``` is the time you want to start minting.
  - ```env``` is the network you want to mint on. ```mainnet-beta``` with real Sol and ```devnet``` with fake Sol.
  - ```rpc_url``` is the rpc endpoint you want to use. Typically you want to use a good one such as ```https://ssc-dao.genesysgo.net``` to ensure your transaction go through fast.
