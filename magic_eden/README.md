# Magic Eden Launchpad bot
1. Download tampermonkey plugin
2. Add new user scripts in tampermonkey
3. Paste the ```launchpad_bot.js``` inside new user scripts and save the script (```ctrl-s```). 
4. Set your Solana wallet to auto-approve on Magic Eden site. (Solana's Phantom wallet has this feature)
5. Visit https://magiceden.io/launchpad/ and connect your Solana wallet.
6. And now it will start spamming the mint button.


** Note that an additional ```/``` is required after ```launchpad``` of the URL to ensure that you don't accidentally buy NFTs when browsing magic eden launchpad regularly.

** The script is also very simple and can be modified easily.

# Magic Eden Candy Machine program 
Last updated Jan 2022
- Magic Eden's Candy Machine program does not work in the exact same way as Metaplex's current Candy Machine program.
- Magic Eden's Candy Machine is ```CMY8R8yghKfFnHKCWjzrArUpYH4PbJ56aWBr4kCP4DMk``` whereas Metaplex's Candy Machine is ```cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ```
- Magic Eden's Candy Machine mint transaction requires an additional notary signature which require user's to send a request to the the notary endpoint to get a signature
  - And requesting for singature before official launchpad launch time will be rejected
  - It is difficult to spoof as it requires the transaction signature of the latest finalized block on Solana as part of the request
- Tips to get mint transaction approved fast
  - Use a good RPC
  - Prepare the request in advance, except the key parameters that are time dependent
  - Host on a network that is geographically near to Magic Eden's server
  - Sent mutiple requests by using bots
