// send.js
const ecash = require('ecash-lib');
const axios = require('axios');
const fs = require('fs');

// Leer wallet
const wallet = JSON.parse(fs.readFileSync('wallet.json'));
const WIF = wallet.privateKeyWIF;
const ecashAddress = wallet.cashAddr;

// Destinatario y monto (puedes modificar)
const toAddress = 'ecash:qqa4zjj0mt6gkm3uh6wcmxtzdr3p6f7cky4y7vujuw'; // Dirección destino
const sendAmount = 100; // en XEC (recuerda que 1 XEC = 100 satoshis)

// Convertir a satoshis
const sendAmountSats = sendAmount * 100;

// Chronik para buscar UTXOs
const chronik = axios.create({
  baseURL: 'https://chronik.e.cash',
  timeout: 5000,
});

// Función principal
(async () => {
  try {
    console.log('🔍 Obteniendo UTXOs...');
    const utxosRes = await chronik.get(`/v1/address/${ecashAddress}/utxos`);
    const utxos = utxosRes.data.utxos;

    if (utxos.length === 0) throw new Error('❌ No hay fondos en la wallet');

    const fromKey = ecash.ECPair.fromWIF(WIF);
    const psbt = new ecash.Psbt();

    let totalInput = 0;
    for (const utxo of utxos) {
      if (totalInput >= sendAmountSats + 500) break; // fee incluida
      psbt.addInput({
        hash: utxo.outpoint.txid,
        index: utxo.outpoint.outIdx,
        nonWitnessUtxo: Buffer.from(await axios.get(
          `https://chronik.e.cash/v1/tx/${utxo.outpoint.txid}/raw`
        ).then(r => r.data), 'hex'),
      });
      totalInput += utxo.value;
    }

    if (totalInput < sendAmountSats + 500) throw new Error('❌ Fondos insuficientes');

    psbt.addOutput({ address: toAddress, value: sendAmountSats }); // envío
    const fee = 500;
    const change = totalInput - sendAmountSats - fee;
    if (change > 0) {
      psbt.addOutput({ address: ecashAddress, value: change }); // cambio
    }

    // Firmar y finalizar
    for (let i = 0; i < psbt.inputCount; i++) psbt.signInput(i, fromKey);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();

    console.log('📤 Transmitiendo transacción...');
    const broadcast = await chronik.post('/v1/tx/broadcast', { rawTx: txHex });
    console.log(`✅ Transacción enviada: ${broadcast.data.txid}`);
  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
})();
