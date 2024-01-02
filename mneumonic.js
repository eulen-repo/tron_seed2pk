// Compatible with TronLink

const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const TronWeb = require('tronweb');
const fs = require('fs');
const readline = require('readline');

const bip32 = BIP32Factory(ecc);

function hideInput(prompt) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.stdoutMuted = true;

        rl.question(prompt, (value) => {
            rl.history = rl.history.slice(1);
            rl.close();
            resolve(value);
        });

        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            if (rl.stdoutMuted)
                rl.output.write("*");
            else
                rl.output.write(stringToWrite);
        };
    });
}

async function getValidWord(prompt, validWords) {
    let word;
    do {
        word = await hideInput(prompt);

        if (!validWords.includes(word)) {
            console.log('\nInvalid word. Please try again.');
            word = null;
        }
    } while (!word);

    return word;
}

async function getMnemonic() {
    const validWordCount = [12, 24];
    const validWords = fs.readFileSync('bip39_english.txt', 'utf8').split('\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let wordCount;
    do {
        wordCount = await new Promise(resolve => {
            rl.question('Enter number of words (12 or 24): ', answer => {
                resolve(answer);
            });
        });

        wordCount = parseInt(wordCount);
        if (!validWordCount.includes(wordCount)) {
            console.log('Invalid number of words. Please enter 12 or 24.');
        }
    } while (!validWordCount.includes(wordCount));

    rl.close();

    let mnemonic;
    do {
        mnemonic = '';
        for (let i = 1; i <= wordCount; i++) {
            const word = await getValidWord(`Enter word ${i}: `, validWords);
            mnemonic += word + ' ';
        }
        mnemonic = mnemonic.trim();

        if (!bip39.validateMnemonic(mnemonic)) {
            console.log('Invalid mnemonic. Checksum failed. Please try again.');
        }
    } while (!bip39.validateMnemonic(mnemonic));

    return mnemonic;
}

function getAccountAtIndex(mnemonic, index) {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const node = bip32.fromSeed(seed);
    const child = node.derivePath(`m/44'/195'/${index}'/0/0`);
    const privateKey = child.privateKey.toString('hex');
    const address = TronWeb.address.fromPrivateKey(privateKey);

    return {
        privateKey,
        address
    };
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.includes('--help') || (args.length === 1 && isNaN(parseInt(args[0])))) {
        console.log('Usage: node mnemonic.js [accountIndex]');
        console.log('accountIndex is optional and defaults to 0.');
        process.exit(1);
    }

    const accountIndex = args.length === 1 ? parseInt(args[0]) : 0;
    const mnemonic = await getMnemonic();
    const account = getAccountAtIndex(mnemonic, accountIndex);
    console.log(account);
}

main();
