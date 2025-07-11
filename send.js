//-------------------------------------------------
//  send.js
//-------------------------------------------------
const fs                = require('fs');
const { ChronikClient } = require('chronik-client');
const tinysecp          = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');
const bitcoin           = require('ecashjs-lib');

const ECPair = ECPairFactory(tinysecp);   // ← ahora sí .fromWIF existe
const { Psbt } = bitcoin;                 // PSBT de ecashjs-lib

// ⚙️  EDITA solo estas dos líneas
const TO_ADDR_XEC = 'ecash:qqa4zjj0mt6gkm3uh6wcmxtzdr3p6f7cky4y7vujuw';
const AMOUNT_XEC  = 100;
// ---------------------------------------

const FEE_SATS = 500;
const wallet   = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
const keyPair  = ECPair.fromWIF(wallet.privateKeyWIF);
const chronik  = new ChronikClient('https://chronik-native1.fabien.cash');

(async () => {
  try {
    console.log(`📤  Enviando ${AMOUNT_XEC} XEC → ${TO_ADDR_XEC}`);

    const { utxos } = await chronik.address(wallet.cashAddr).utxos();
    if (!utxos.length) throw new Error('Wallet sin fondos');

    const satsNeeded = AMOUNT_XEC * 100 + FEE_SATS;
    let   totalIn    = 0;
    const inputs     = [];

    for (const u of utxos) {
      inputs.push(u);
      totalIn += Number(u.value);
      if (totalIn >= satsNeeded) break;
    }
    if (totalIn < satsNeeded) throw new Error('Fondos insuficientes');

    const psbt = new Psbt();

    for (const u of inputs) {
      const raw = (await chronik.tx(u.outpoint.txid)).rawHex;
      psbt.addInput({
        hash:  u.outpoint.txid,
        index: u.outpoint.outIdx,
        nonWitnessUtxo: Buffer.from(raw, 'hex'),
      });
    }

    psbt.addOutput({ address: TO_ADDR_XEC, value: AMOUNT_XEC * 100 });

    const change = totalIn - AMOUNT_XEC * 100 - FEE_SATS;
    if (change > 0) psbt.addOutput({ address: wallet.cashAddr, value: change });

    // firmar + transmitir
    for (let i = 0; i < psbt.inputCount; i++) psbt.signInput(i, keyPair);
    psbt.finalizeAllInputs();

    const { txid } =
      await chronik.broadcastTx(psbt.extractTransaction().toHex());

    console.log('✅  Transacción enviada:', txid);
  } catch (e) {
    console.error('❌', e.message || e);
  }
})();
