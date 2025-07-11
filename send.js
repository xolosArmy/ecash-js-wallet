const { ChronikClient } = require("chronik-client");
const ecash = require("ecash-lib");
const fs = require("fs");

// Leer wallet
const wallet = JSON.parse(fs.readFileSync("wallet.json"));
const WIF = wallet.privateKeyWIF;
const ecashAddress = wallet.cashAddr;

// Cliente Chronik
const chronik = new ChronikClient("https://chronik.e.cash/xec");

// Dirección destino
const toAddress = "ecash:qqa4zjj0mt6gkm3uh6wcmxtzdr3p6f7cky4y7vujuw";
const sendAmount = 100; // en XEC
const sendAmountSats = sendAmount * 100; // convertir a satoshis

(async () => {
  try {
    console.log("📡 Dirección usada:", ecashAddress);
    console.log("🔍 Obteniendo UTXOs...");

    // Obtener UTXOs
    const utxoData = await chronik.address(ecashAddress);
    const utxos = utxoData.utxos;

    if (utxos.length === 0) throw new Error("❌ No hay fondos en la wallet");

    const psbt = new ecash.Psbt();
    const fromKey = ecash.ECPair.fromWIF(WIF);

    let totalInput = 0;
    for (const utxo of utxos) {
      if (totalInput >= sendAmountSats + 500) break;
      const txDetails = await chronik.tx(utxo.outpoint.txid);
      const rawHex = txDetails.rawHex;
      psbt.addInput({
        hash: utxo.outpoint.txid,
        index: utxo.outpoint.outIdx,
        nonWitnessUtxo: Buffer.from(rawHex, "hex"),
      });
      totalInput += utxo.value;
    }

    if (totalInput < sendAmountSats + 500) throw new Error("❌ Fondos insuficientes");

    // Output principal
    psbt.addOutput({
      address: toAddress,
      value: sendAmountSats,
    });

    // Cambio
    const fee = 500;
    const change = totalInput - sendAmountSats - fee;
    if (change > 0) {
      psbt.addOutput({
        address: ecashAddress,
        value: change,
      });
    }

    // Firmar y transmitir
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, fromKey);
    }
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    console.log("📤 Transmitiendo transacción...");

    const result = await chronik.broadcastTx(txHex);
    console.log("✅ Transacción enviada:", result.txid);
  } catch (err) {
    console.error("❌ Error:", err.message || err);
  }
})();

