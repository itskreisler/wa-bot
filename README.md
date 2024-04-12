# 🤩👉 WhatsApp bot

## How to use? 🤔

- Install the necessary dependencies with `npm install`or `pnpm i`
- Scan QR CODE.
- Finally run script `npm run dev:lib`

## Requirements

To Install [backgroundremover](https://github.com/nadermx/backgroundremover) and `rembg`, install it from pypi

```python
pip install --upgrade pip #python.exe -m pip install --upgrade pip
pip install backgroundremover rembg
```

also install [ffmpeg](https://ffmpeg.org/) for windows or linux
  
```sh
sudo apt install ffmpeg
// choco
choco install ffmpeg

```

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

## run pm2

```sh
pm2 start ./lib/index.cjs --name mi_aplicacion
pm2 stop mi_aplicacion
pm2 restart mi_aplicacion
pm2 delete mi_aplicacion
pm2 logs mi_aplicacion --lines 40
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
