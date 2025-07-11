const { ChronikClient } = require("chronik-client");
const fs = require("fs");

const wallet = JSON.parse(fs.readFileSync("wallet.json"));
const address = wallet.cashAddr;

const chronik = new ChronikClient("https://chronik.e.cash/xec");

(async () => {
  try {
    console.log("🔍 Consultando UTXOs de:", address);
    const data = await chronik.address(address);
    const utxos = data.utxos;

    if (utxos.length === 0) {
      console.log("⚠️ No hay UTXOs disponibles (sin fondos)");
    } else {
      console.log(`✅ ${utxos.length} UTXO(s) encontrados:`);
      for (const utxo of utxos) {
        console.log(`- txid: ${utxo.outpoint.txid}, valor: ${utxo.value} sats`);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err.message || err);
  }
})();
