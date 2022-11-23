# example SC deployment script

# SC not upgradeable
# 1 EGLD per vote
# 15 EGLD per registration as contestant
# max 100 contestants
# transfer funds to the winner after voting period
# you can modify the deployment parameters as needed

erdpy contract deploy --bytecode egldvoting.wasm --pem wallet.pem --metadata-not-upgradeable --gas-limit 100000000 --recall-nonce --arguments 1669696378 1679896378 1000000000000000000 15000000000000000000 100 1 --send --wait-result
