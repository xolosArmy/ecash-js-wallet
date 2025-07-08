# 💸 eCash JS Wallet Generator

Generador simple de carteras (wallets) de eCash en Node.js usando `bitcore-lib-cash` y `ecashaddrjs`.

## 📦 Características

- Genera una clave privada (WIF)
- Deriva la clave pública
- Crea direcciones en formato:
  - Legacy (Bitcoin Cash style)
  - eCash (prefijo `ecash:`)
- Guarda la wallet en un archivo `.json`

## 🚀 Instalación

```bash
git clone https://github.com/xolosArmy/ecash-js-wallet.git
cd ecash-js-wallet
npm install
