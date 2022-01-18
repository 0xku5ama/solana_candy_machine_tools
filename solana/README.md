# Lightweight tool to help you discover new projects or candy machines to mint
This is a lightweight tool to help users discover candy machines. Candy machines for Magic Eden is omitted as upcoming mints are all announced by Magic Eden.
1. Download & install ```python```
2. Run ```python candy_machine_stalker.py``` in your terminal and it will start discovering candy machines for you.
  - Some Arweave links will be revealed so that you can determine if the candy machine is a honeypot (NFTs that have no value) a not. 
  - You can visit the Arweave link to look at the metadata and check out the jpegs. For generative art collections, you will notice that it is a fake immediately when you see that the jpegs are all the same.
  - You can also further inspect mint price, whitelist, supply etc by using the ```auto_mint.ts``` tool by running ```ts-node ../../metaplex/js/packages/cli/src/auto-mint.ts show --env mainnet-beta --candy EvRavjam31mrtbMRbKE4scLhXfCkeb7DgUDZSaExmXSW```
