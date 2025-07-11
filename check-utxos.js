// ---------------- check-utxos.js ----------------
const fs                = require('fs');
const { ChronikClient } = require('chronik-client');

// lee wallet.json
const { cashAddr } = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));

// Chronik público (mainnet)
const chronik = new ChronikClient('https://chronik-native1.fabien.cash');

(async () => {
  try {
    console.log(`🔎  Consultando UTXOs de  ${cashAddr}`);

    // chronik.address(...).utxos() → {utxos, numPages}
    const { utxos } = await chronik.address(cashAddr).utxos();
    if (!utxos.length) {
      console.warn('⚠️  No hay UTXOs (balance = 0)');
      return;
    }

    // muestra tabla rápida
    console.table(
      utxos.map(u => ({
        txid : u.outpoint.txid,
        vout : u.outpoint.outIdx,
        value: (u.value / 100) + ' XEC',
        blk  : u.blockHeight,
      }))
    );
    const total = utxos.reduce((s, u) => s + u.value, 0) / 100;
    console.log(`💰  Total disponible: ${total} XEC`);
  } catch (err) {
    console.error('❌', err.message || err);
  }
})();


