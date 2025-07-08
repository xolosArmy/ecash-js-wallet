const fs = require('fs');
const axios = require('axios');

// Cargar wallet.json
const wallet = JSON.parse(fs.readFileSync('wallet.json'));
const address = wallet.cashAddr; // Mantén el prefijo ecash:

console.log('🔵 Dirección que se está consultando:', address);

// Endpoint Chronik funcional
const chronik = 'https://chronik-native1.fabien.cash';
axios.get(`${chronik}/v1/address/${address}`)


// Llamada a la API de Chronik
axios.get(`${chronik}/v1/address/${address}`)
  .then(response => {
    const balance = response.data.balance;
    console.log(`💰 Saldo confirmado: ${balance.confirmed / 100} XEC`);
    console.log(`⌛ Saldo no confirmado: ${balance.unconfirmed / 100} XEC`);
  })
  .catch(error => {
    console.error('❌ Error al consultar saldo:', error.message);
  });
