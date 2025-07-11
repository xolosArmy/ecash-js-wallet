const { ChronikClient } = require("chronik-client");
const ecashaddr = require("ecashaddrjs");
const fs = require("fs");

// Leer wallet
const wallet = JSON.parse(fs.readFileSync("wallet.json"));
const ecashAddress = wallet.cashAddr;

// Decodificar dirección ecash
const decoded = ecashaddr.decodeCashAddress(ecashAddress);
const type = decoded.type; // debe ser 'P2PKH'
const hash160 = Buffer.from(decoded.hash).toString("hex");

// Cliente Chronik
const chronik = new ChronikClient("https://chronik.e.cash/xec");

(async () => {
  try {
    console.log("📫 Consultando UTXOs de:", ecashAddress);
    const result = await chronik.script("p2pkh", hash160).utxos();

    if (!result.utxos || result.utxos.length === 0) {
      console.warn("⚠️ No hay UTXOs disponibles (sin fondos)");
      return;
    }

    console.log("✅ UTXOs encontrados:");
    result.utxos.forEach((utxo, idx) => {
      console.log(
        `#${idx + 1}: txid=${utxo.outpoint.txid} | vout=${utxo.outpoint.outIdx} | valor=${utxo.value} sats`
      );
    });
  } catch (err) {
    if (err.status === 404) {
      console.error("❌ No se encontró script para esta dirección (404)");
    } else {
      console.error("❌ Error:", err.message || err);
    }
  }
})();

