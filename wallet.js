const bitcore = require('bitcore-lib-cash');
const ecashaddr = require('ecashaddrjs');
const fs = require('fs');

const privateKey = new bitcore.PrivateKey();
const wif = privateKey.toWIF();
const publicKey = privateKey.toPublicKey().toString();
const legacyAddress = privateKey.toAddress();
const hash = Uint8Array.from(legacyAddress.hashBuffer);
const type = 'p2pkh'; // <----- minúsculas y con guion bajo

const cashAddr = ecashaddr.encodeCashAddress('ecash', type, hash);

console.log("🔐 Clave privada (WIF):", wif);
console.log("🔓 Clave pública:", publicKey);
console.log("🏛️ Dirección Legacy:", legacyAddress.toString());
console.log("💌 Dirección eCash:", cashAddr);

const wallet = {
  privateKeyWIF: wif,
  publicKey,
  legacyAddress: legacyAddress.toString(),
  cashAddr,
  createdAt: new Date().toISOString()
};

fs.writeFileSync('wallet.json', JSON.stringify(wallet, null, 2));
console.log("✅ Wallet guardada como wallet.json");
