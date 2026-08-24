import fs from 'fs';
import path from 'path';

const htmlPath = 'c:/Users/Kam3leoN/Downloads/holo/pokemon-holo-demo.html';
const outDir = 'C:/wamp64/www/k3ui/assets/images/holo';

fs.mkdirSync(outDir, { recursive: true });

const html = fs.readFileSync(htmlPath, 'utf8');

const map = {
    'tex-0': 'birthday-dank-2.webp',
    'tex-1': 'birthday-dank.webp',
    'tex-2': 'birthday-holo.webp',
    'tex-3': 'iri-1.webp',
    'tex-4': 'iri-2.webp',
    'tex-5': 'iri-3.webp',
    'tex-6': 'iri-4.webp',
    'tex-7': 'iri-5.webp',
    'tex-8': 'iri-6.webp',
    'tex-9': 'iri-7.webp',
    'tex-10': 'iri-8.webp',
    'tex-11': 'iri-9.webp',
    'tex-12': 'noise-base.webp',
    'tex-13': 'noise-top.webp',
    'tex-14': 'glitter.webp',
    'tex-15': 'grain.webp',
};

for (const [key, filename] of Object.entries(map)) {
    const re = new RegExp(`--${key}:\\s*url\\("data:image/webp;base64,([^"]+)"\\)`);
    const m = html.match(re);
    if (!m) {
        console.error('Missing', key);
        continue;
    }
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, Buffer.from(m[1], 'base64'));
    console.log('OK', filename, fs.statSync(filePath).size);
}

const imgM = html.match(/src="(data:image\/webp;base64,[^"]+)"/);
if (imgM) {
    const b64 = imgM[1].replace('data:image/webp;base64,', '');
    fs.writeFileSync(path.join(outDir, 'demo-card.webp'), Buffer.from(b64, 'base64'));
    console.log('OK demo-card.webp');
}
