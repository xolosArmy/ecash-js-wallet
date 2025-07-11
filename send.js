const { ChronikClient } = require("chronik-client");
const ecash = require("ecash-lib");
const ecashaddr = require("ecashaddrjs");
const fs = require("fs");

// Leer wallet
const wallet = JSON.parse(fs.readFileSync("wallet.json"));
const WIF = wallet.privateKeyWIF;
const ecashAddress = wallet.cashAddr;

// Dirección destino y monto
const toAddress = "ecash:qqa4zjj0mt6gkm3uh6wcmxtzdr3p6f7cky4y7vujuw";
const sendAmount = 100; // XEC
const sendAmountSats = sendAmount * 100;

// Cliente Chronik
const chronik = new ChronikClient("https://chronik.e.cash/xec");

(async () => {
  try {
    console.log("📮 Dirección de envío:", ecashAddress);

    // Decodificar dirección
    const decoded = ecashaddr.decodeCashAddress(ecashAddress);
    const hash160 = Buffer.from(decoded.hash).toString("hex");

    // Obtener UTXOs
    console.log("🔍 Consultando UTXOs...");
    const result = await chronik.script("p2pkh", hash160).utxos();
    const utxos = result.utxos;

    if (!utxos || utxos.length === 0) {
      throw new Error("❌ No hay fondos en la wallet (UTXOs vacíos)");
    }

    const psbt = new ecash.Psbt();
    const fromKey = ecash.ECPair.fromWIF(WIF);
    let totalInput = 0;

    for (const utxo of utxos) {
      if (totalInput >= sendAmountSats + 500) break;

      const txDetails = await chronik.tx(utxo.outpoint.txid);
      psbt.addInput({
        hash: utxo.outpoint.txid,
        index: utxo.outpoint.outIdx,
        nonWitnessUtxo: Buffer.from(txDetails.rawHex, "hex"),
      });

      totalInput += utxo.value;
    }

    const fee = 500;
    if (totalInput < sendAmountSats + fee) {
      throw new Error("❌ Fondos insuficientes para cubrir monto + fee");
    }

    // Agregar output destino
    psbt.addOutput({
      address: toAddress,
      value: sendAmountSats,
    });

    // Agregar output de cambio si sobra
    const change = totalInput - sendAmountSats - fee;
    if (change > 0) {
      psbt.addOutput({
        address: ecashAddress,
        value: change,
      });
    }

    // Firmar inputs
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, fromKey);
    }
    psbt.finalizeAllInputs();

    // Enviar transacción
    const txHex = psbt.extractTransaction().toHex();
    console.log("📤 Transmitiendo transacción...");
    const resultTx = await chronik.broadcastTx(txHex);
    console.log("✅ Transacción enviada con éxito:");
    console.log("🔗 TXID:", resultTx.txid);
  } catch (err) {
    console.error("❌ Error:", err.message || err);
  }
})();
