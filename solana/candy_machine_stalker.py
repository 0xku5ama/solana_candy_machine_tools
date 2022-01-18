import requests
from time import sleep

candy_machines_contract = [
'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ']

s = set()

def handle_request(query):
    resp = requests.get(query)
    if resp.status_code == 200:
        return resp.json()
    else:
        raise Exception('Http request died')

def handle_candy_machine_txn(contract, h):
    print(f'Candy machine interaction at {h}')
    resp = handle_request(f'https://public-api.solscan.io/transaction/{h}')
    try:
        for acc in resp['inputAccount']:
            if acc['account'] != contract and not acc['signer']:
                print(f'Candy machine address: {acc["account"]} on {contract}')
                raw = resp['parsedInstruction'][0]['data']
                if raw[0] == 'f':
                    print('Probably updating candy machine')
                elif len(raw) > 40: # Likely upload NFT data
                    raw = raw[40:] # strip headers
                    end_of_name = raw.find('000000')
                    if end_of_name == -1:
                        print(f'Unknown data format, cannot find YY000000 open delimiter, please check txn: {h}')
                        return
                    if end_of_name % 2 != 0:
                        end_of_name += 1
                    end_of_link = raw.find('000000', end_of_name + 6)
                    if end_of_name == -1:
                        print(f'Unknown data format, cannot find XX000000 close delimiter, please check txn: {h}')
                        return
                    if end_of_link % 2 != 0:
                        end_of_link += 1
                    
                    nft_name = bytearray.fromhex(raw[:end_of_name - 2]).decode()
                    nft_link = bytearray.fromhex(raw[end_of_name + 6:end_of_link - 2]).decode()
                    print(f'Name: {nft_name}\nArweave link: {nft_link}')
                return
        raise Exception('Unknown interaction')
    except Exception as e:
        print(f'Unknown interaction, please check txn: {h}')

def handle_candy_machine_birth(h):
    print(f'New candy machine is born at {h}')
    resp = handle_request(f'https://public-api.solscan.io/transaction/{h}')
    candy_address = resp['parsedInstruction'][0]['params']['newAccount']
    contract = resp['parsedInstruction'][0]['params']['programOwner']
    print(f'New candy machine address {candy_address} on {contract}')

def process_txn(txn, contract):
    h = txn['txHash']
    if h in s:
        return
    s.add(h)

    if len(txn['parsedInstruction']) != 1:
        is_mint = False
        for instruction in txn['parsedInstruction']:
            is_mint = instruction['programId'] == 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            if is_mint:
                # print(f'NFT mint txn on {contract}')
                return
        if not is_mint:
            if txn['parsedInstruction'][0]['type'] == 'createAccount' and txn['parsedInstruction'][1]['programId'] == contract:
                handle_candy_machine_birth(h)
    else:
        handle_candy_machine_txn(contract, h)
    print('')
        

def job():
    try:
        for contract in candy_machines_contract:
            resp = handle_request(f'https://public-api.solscan.io/account/transactions?account={contract}&limit=10')
            for txn in resp:
                process_txn(txn, contract)

    except Exception as e:
        print(f'Http request failed due to {e}')

while True:
    job()
    sleep(5)
