import asyncio
import aiohttp

hashlist = set()

s = set()

async def call(payload, url='https://ssc-dao.genesysgo.net', method='POST', headers={'content-type': 'application/json'}, backoff_duration=1):
    async with aiohttp.request(
        method=method,
        url=url,
        json=payload,
        headers=headers) as resp:
        if resp.status == 429:
            print(f'Request failed for {payload} due to too many requests... Backing off for {backoff_duration}s')
            await asyncio.sleep(backoff_duration)
            return call(payload=payload, backoff_duration=backoff_duration*2)
        return await resp.json()

async def get_block(i):
    if i in s:
        return
    s.add(i)
    payload = {
        "method":"getBlock",
        "jsonrpc": "2.0",
        "id": 4,
        "method":"getBlock",
        "params":[i, 
        {
            "encoding": "json"
        }]
    }
    resp = await call(payload)
    try:
        for txn in resp['result']['transactions']:
            if 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K' in txn['transaction']['message']['accountKeys']:
                if 'Program log: Instruction: Sell' in txn['meta']['logMessages'] and 'Program M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K success' in txn['meta']['logMessages']:
                    print(i, txn['meta']['postTokenBalances'][0]['mint'])
                    if txn['meta']['postTokenBalances'][0]['mint'] in hashlist:
                        print(collection_name)
                        print('\a')
                    for message in txn['meta']['logMessages']:
                        if '"price"' in message:
                            print(message)
                print('magic eden')

        print(i, resp['result']['blockhash'])
    except Exception as e:
        if resp['error']['code'] == -32004: # block most likely not available in node yet, let's retry
            await asyncio.sleep(0.1)
            return await get_block(i)
        elif resp['error']['code'] == -32007:
            print(i, 'no block found (-32007)')
            return
        print(i, f'unknown error ({resp["error"]["code"]})')
    return

async def get_latest_slot(aggro=0):
    payload = {
        "method":"getSlot",
        "jsonrpc": "2.0",
        "id": 3,
        "params": []
    }
    resp = await call(payload)
    try:
        return resp['result'] + aggro
    except Exception as e:
        print('Failed to get latest slot')
        return -1

async def main():
    slot_height = await get_latest_slot()
    while True:
        current_height = await get_latest_slot()
        print(f'-----------')
        if current_height > slot_height:
            loop = asyncio.get_event_loop()
            for i in range(slot_height, current_height):
                loop.create_task(get_block(i))
            slot_height = current_height
        print('--------------')

loop = asyncio.get_event_loop()
loop.run_until_complete(main())

