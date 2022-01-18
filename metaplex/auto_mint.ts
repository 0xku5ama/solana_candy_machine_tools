#!/usr/bin/env ts-node
import * as fs from 'fs';
import { program } from 'commander';
import * as anchor from '@project-serum/anchor';

import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { MintLayout, Token } from '@solana/spl-token';
import {
  CACHE_PATH,
  TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID
} from './helpers/constants';
import { createAssociatedTokenAccountInstruction } from './helpers/instructions';
import { sendTransactionWithRetryWithKeypair } from './helpers/transactions';
import {
  getAtaForMint,
  getMetadata,
  getMasterEdition,
  getCandyMachineCreator,
  loadWalletKey,
  getTokenWallet,
} from './helpers/accounts';

import { getCluster } from './helpers/various';
import log from 'loglevel';
program.version('0.0.2');

if (!fs.existsSync(CACHE_PATH)) {
  fs.mkdirSync(CACHE_PATH);
}
log.setLevel(log.levels.INFO);

async function loadCandyProgram(
    keypair: Keypair,
    candyMachineId: PublicKey,
    env: string,
    customRpcUrl?: string,
  ) {
    if (customRpcUrl) console.log('USING CUSTOM URL', customRpcUrl);
  
    // @ts-ignore
    const solConnection = new anchor.web3.Connection(
      //@ts-ignore
      customRpcUrl || getCluster(env),
    );
  
    const walletWrapper = new anchor.Wallet(keypair);
    const provider = new anchor.Provider(solConnection, walletWrapper, {
      preflightCommitment: 'recent',
    });
    

    const idl = await anchor.Program.fetchIdl(
      candyMachineId,
      provider,
    );
    const program = new anchor.Program(
      idl,
      candyMachineId,
      provider,
    );
    log.debug('program id from anchor', program.programId.toBase58());
    return program;
  }

/**
 * Example:
 *  ts-node ../../metaplex/js/packages/cli/src/auto-mint.ts show --env mainnet-beta --candy EvRavjam31mrtbMRbKE4scLhXfCkeb7DgUDZSaExmXSW
 */

programCommand('show')
  .option('--candy <string>')
  .option('--machine <string>', 'multiple candy machine exists', 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
  .option(
    '-r, --rpc-url <string>',
    'custom rpc url since this is a heavy command',
  )
  .action(async (directory, cmd) => {
    const { env, rpcUrl, candy, machine } = cmd.opts();

    const candyMachineId = new PublicKey(machine);
    const isMagicEden = machine == 'CMY8R8yghKfFnHKCWjzrArUpYH4PbJ56aWBr4kCP4DMk';
    const anchorProgram = await loadCandyProgram(Keypair.generate(), candyMachineId, env, rpcUrl);

    try {
      const machine = await anchorProgram.account.candyMachine.fetch(
        candy,
      );
      log.info('...Candy Machine...');
      log.info('Key:', candy);
      //@ts-ignore
      log.info('authority: ', machine.authority.toBase58());
      //@ts-ignore
      log.info('wallet: ', machine.wallet.toBase58());
      //@ts-ignore
      log.info(
        'tokenMint: ',
        //@ts-ignore
        machine.tokenMint ? machine.tokenMint.toBase58() : null,
      );
      //@ts-ignore
      log.info('uuid: ', machine.data.uuid);
      //@ts-ignore
      log.info('price: ', machine.data.price.toNumber());
      //@ts-ignore
      log.info('itemsAvailable: ', machine.data.itemsAvailable.toNumber());
      //@ts-ignore
      log.info('itemsRedeemed: ', machine.itemsRedeemed.toNumber());
      log.info(
        'goLiveDate: ',
        //@ts-ignore
        machine.data.goLiveDate
          ? //@ts-ignore
            new Date(machine.data.goLiveDate * 1000)
          : 'N/A',
      );

      if (isMagicEden) {
        log.info('config: ', machine.config.toBase58());
        log.info('wallet limit: ', machine.data.walletLimit);
        log.info('bump: ', machine.bump);
        log.info('notary: ', machine.notary.toBase58());
        return;
      }
      //@ts-ignore
      log.info('symbol: ', machine.data.symbol);
      //@ts-ignore
      log.info('sellerFeeBasisPoints: ', machine.data.sellerFeeBasisPoints);
      //@ts-ignore
      log.info('creators: ');
      //@ts-ignore
      machine.data.creators.map(c =>
        log.info(c.address.toBase58(), 'at', c.share, '%'),
      ),
        //@ts-ignore
        log.info('maxSupply: ', machine.data.maxSupply.toNumber());
      //@ts-ignore
      log.info('retainAuthority: ', machine.data.retainAuthority);
      //@ts-ignore
      log.info('isMutable: ', machine.data.isMutable);

      //@ts-ignore
      log.info('hidden settings: ', machine.data.hiddenSettings);
      if (machine.data.endSettings) {
        log.info('End settings: ');

        if (machine.data.endSettings.endSettingType.date) {
          //@ts-ignore
          log.info('End on', new Date(machine.data.endSettings.number * 1000));
        } else {
          log.info(
            'End when',
            machine.data.endSettings.number.toNumber(),
            'sold',
          );
        }
      } else {
        log.info('No end settings detected');
      }

      if (machine.data.gatekeeper) {
        log.info('Captcha settings:');
        log.info(
          'Gatekeeper:',
          machine.data.gatekeeper.gatekeeperNetwork.toBase58(),
        );
        log.info('Expires on use:', machine.data.gatekeeper.expireOnUse);
      } else {
        log.info('No captcha for this candy machine');
      }

      if (machine.data.whitelistMintSettings) {
        //@ts-ignore
        log.info('whitelist settings: ');
        //@ts-ignore
        log.info('Mint: ', machine.data.whitelistMintSettings.mint.toBase58());
        //@ts-ignore
        log.info('Mode: ', machine.data.whitelistMintSettings.mode);
        //@ts-ignore
        log.info('Presale: ', machine.data.whitelistMintSettings.presale);
        //@ts-ignore
        log.info(
          'Discounted Price: ',
          machine.data.whitelistMintSettings.discountPrice?.toNumber() || 'N/A',
        );
      } else {
        log.info('no whitelist settings');
      }
    } catch (e) {
      console.error(e);
      console.log('No machine found');
    }
  });

export async function mintV2(
  keypair: string,
  env: string,
  candyMachineAddress: PublicKey,
  machine: string,
  rpcUrl: string,
  mint_time: number
): Promise<string> {
  const mint = Keypair.generate();

  const userKeyPair = loadWalletKey(keypair);
  const anchorProgram = await loadCandyProgram(userKeyPair, new PublicKey(machine), env, rpcUrl);
  const userTokenAccountAddress = await getTokenWallet(
    userKeyPair.publicKey,
    mint.publicKey,
  );

  const candyMachine: any = await anchorProgram.account.candyMachine.fetch(
    candyMachineAddress,
  );

  const remainingAccounts = [];
  const signers = [mint, userKeyPair];
  const cleanupInstructions = [];
  const instructions = [
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: userKeyPair.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MintLayout.span,
      lamports:
        await anchorProgram.provider.connection.getMinimumBalanceForRentExemption(
          MintLayout.span,
        ),
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      0,
      userKeyPair.publicKey,
      userKeyPair.publicKey,
    ),
    createAssociatedTokenAccountInstruction(
      userTokenAccountAddress,
      userKeyPair.publicKey,
      userKeyPair.publicKey,
      mint.publicKey,
    ),
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      userTokenAccountAddress,
      userKeyPair.publicKey,
      [],
      1,
    ),
  ];

  if (candyMachine.data.whitelistMintSettings) {
    const mint = new anchor.web3.PublicKey(
      candyMachine.data.whitelistMintSettings.mint,
    );

    const whitelistToken = (
      await getAtaForMint(mint, userKeyPair.publicKey)
    )[0];
    remainingAccounts.push({
      pubkey: whitelistToken,
      isWritable: true,
      isSigner: false,
    });

    if (candyMachine.data.whitelistMintSettings.mode.burnEveryTime) {
      const whitelistBurnAuthority = anchor.web3.Keypair.generate();

      remainingAccounts.push({
        pubkey: mint,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: whitelistBurnAuthority.publicKey,
        isWritable: false,
        isSigner: true,
      });
      signers.push(whitelistBurnAuthority);
      const exists = await anchorProgram.provider.connection.getAccountInfo(
        whitelistToken,
      );
      if (exists) {
        instructions.push(
          Token.createApproveInstruction(
            TOKEN_PROGRAM_ID,
            whitelistToken,
            whitelistBurnAuthority.publicKey,
            userKeyPair.publicKey,
            [],
            1,
          ),
        );
        cleanupInstructions.push(
          Token.createRevokeInstruction(
            TOKEN_PROGRAM_ID,
            whitelistToken,
            userKeyPair.publicKey,
            [],
          ),
        );
      }
    }
  }

  let tokenAccount;
  if (candyMachine.tokenMint) {
    const transferAuthority = anchor.web3.Keypair.generate();

    tokenAccount = await getTokenWallet(
      userKeyPair.publicKey,
      candyMachine.tokenMint,
    );

    remainingAccounts.push({
      pubkey: tokenAccount,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts.push({
      pubkey: transferAuthority.publicKey,
      isWritable: false,
      isSigner: true,
    });

    instructions.push(
      Token.createApproveInstruction(
        TOKEN_PROGRAM_ID,
        tokenAccount,
        transferAuthority.publicKey,
        userKeyPair.publicKey,
        [],
        candyMachine.data.price.toNumber(),
      ),
    );
    signers.push(transferAuthority);
    cleanupInstructions.push(
      Token.createRevokeInstruction(
        TOKEN_PROGRAM_ID,
        tokenAccount,
        userKeyPair.publicKey,
        [],
      ),
    );
  }
  const metadataAddress = await getMetadata(mint.publicKey);
  const masterEdition = await getMasterEdition(mint.publicKey);

  const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
    candyMachineAddress,
  );

  while (Date.now() + 500 < mint_time) {
    console.log(mint_time - Date.now());
    await new Promise(r => setTimeout(r, 1));
  }

  instructions.push(
    await anchorProgram.instruction.mintNft(creatorBump, {
      accounts: {
        candyMachine: candyMachineAddress,
        candyMachineCreator,
        payer: userKeyPair.publicKey,
        //@ts-ignore
        wallet: candyMachine.wallet,
        mint: mint.publicKey,
        metadata: metadataAddress,
        masterEdition,
        mintAuthority: userKeyPair.publicKey,
        updateAuthority: userKeyPair.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
        instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      },
      remainingAccounts:
        remainingAccounts.length > 0 ? remainingAccounts : undefined,
    }),
  );

  const finished = (
    await sendTransactionWithRetryWithKeypair(
      anchorProgram.provider.connection,
      userKeyPair,
      instructions,
      signers,
    )
  ).txid;

  await sendTransactionWithRetryWithKeypair(
    anchorProgram.provider.connection,
    userKeyPair,
    cleanupInstructions,
    [],
  );

  return finished;
}

/**
 * Example:
 *  ts-node ../../metaplex/js/packages/cli/src/auto-mint.ts mint_one_token --keypair ~/.config/solana/devnet.json --candy 4FfahYtvhZV9nNXw5eaXbkGYzKTEVBazWFoz544B5yff --time='17 Jan 2022 5:40:56 GMT' --env mainnet-beta --rpc-url https://ssc-dao.genesysgo.net
 * 
 */
programCommand('mint_one_token')
  .option('--candy <string>')
  .option('--machine <string>', 'multiple candy machine exists', 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
  .option('--time <string>', 'time to start mint', '01 Jan 1970 00:00:00 GMT')
  .option(
    '-r, --rpc-url <string>',
    'custom rpc url since this is a heavy command'
  )
  .action(async (directory, cmd) => {
    const { keypair, env, rpcUrl, candy, machine, time } = cmd.opts();
    if (machine == 'CMY8R8yghKfFnHKCWjzrArUpYH4PbJ56aWBr4kCP4DMk') {
      log.info('Magic Eden mint will not work. It uses notary signature');
    }

    const mint_time = Date.parse(time);
    const candyMachine = new PublicKey(candy);
    while (Date.now() + 3500 < mint_time) {
      await new Promise(r => setTimeout(r, 1000));
    }
    const tx = await mintV2(keypair, env, candyMachine, machine, rpcUrl, mint_time);

    log.info('mint_one_token finished', tx);
  });

/**
 * Safely tries to mint multiple tokens, remove await on line 461 to spam.
 * Example:
 *  ts-node ../../metaplex/js/packages/cli/src/auto-mint.ts mint_multiple_tokens --keypair ~/.config/solana/devnet.json --number 10 --candy 4FfahYtvhZV9nNXw5eaXbkGYzKTEVBazWFoz544B5yff --time='17 Jan 2022 5:40:56 GMT' --env mainnet-beta --rpc-url https://ssc-dao.genesysgo.net
 * 
 */
programCommand('mint_multiple_tokens')
  .requiredOption('-n, --number <string>', 'Number of tokens')
  .option('--candy <string>')
  .option('--machine <string>', 'multiple candy machine exists', 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
  .option('--time <string>', 'time to start mint', '01 Jan 1970 00:00:00 GMT')
  .option(
    '-r, --rpc-url <string>',
    'custom rpc url since this is a heavy command',
  )
  .action(async (_, cmd) => {
    const { keypair, env, rpcUrl, candy, machine, number, time } = cmd.opts();

    const NUMBER_OF_NFTS_TO_MINT = parseInt(number, 10);
    const mint_time = Date.parse(time);
    const candyMachine = new PublicKey(candy);
    while (Date.now() + 3500 < mint_time) {
      console.log(mint_time - Date.now());
      await new Promise(r => setTimeout(r, 1000));
    }

    log.info(`Minting ${NUMBER_OF_NFTS_TO_MINT} tokens...`);
    const mintToken = async index => {
      const tx = await mintV2(keypair, env, candyMachine, machine, rpcUrl, mint_time); // remove await here to enable spam
      log.info(`transaction ${index + 1} complete`, tx);

      if (index < NUMBER_OF_NFTS_TO_MINT - 1) {
        log.info('minting another token...');
        await mintToken(index + 1);
      }
    };

    await mintToken(0);

    log.info(`minted ${NUMBER_OF_NFTS_TO_MINT} tokens`);
    log.info('mint_multiple_tokens finished');
  });

function programCommand(name: string) {
  return program
    .command(name)
    .option(
      '-e, --env <string>',
      'Solana cluster env name',
      'devnet', //mainnet-beta, testnet, devnet
    )
    .option('-k, --keypair <path>', `Solana wallet location`)
    .option('-l, --log-level <string>', 'log level', setLogLevel)
    .option('-c, --cache-name <string>', 'Cache file name', 'temp');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setLogLevel(value, prev) {
  if (value === undefined || value === null) {
    return;
  }
  log.info('setting the log value to: ' + value);
  log.setLevel(value);
}

program.parse(process.argv);
