# 🤩👉 WhatsApp bot

## How to use? 🤔

- Install the necessary dependencies with `npm install`
- Scan QR CODE.
- Finally run script `npm run dev:lib`

## Termux fix

- INSTALL GLOBAL NPM PACKAGES

```node
npm config set unsafe-perm true
```

- CLEAN CACHE

```node
npm cache clean
```

- BYPASS SYMLINK ISSUES

```node
npm install --no-bin-links
```

## run sh

```sh
# screen -S [name]
screen -S mi_sesion
# screen -X -S [session # you want to kill] kill
screen -X -S mi_sesion kill
# screen -r [session # you want to resume]
screen -r mi_sesion
```

### The bot already
