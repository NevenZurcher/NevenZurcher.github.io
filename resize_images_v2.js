import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const imagesDir = path.resolve('public/images');

const images = [
    { name: 'about', width: 300, height: 300, src: 'about.webp' },
    { name: 'EcoSnap', width: 400, height: 400, src: 'EcoSnap.webp' },
    { name: 'SFalt1', width: 400, height: 400, src: 'SFalt1.webp' }
];

async function resizeImages() {
    console.log('Starting V2 resize...');
    for (const img of images) {
        const inputPath = path.join(imagesDir, img.src);
        const outputPath = path.join(imagesDir, `${img.name}-opt.webp`); // New filename

        if (fs.existsSync(inputPath)) {
            console.log(`Creating ${img.name}-opt.webp...`);
            try {
                await sharp(inputPath)
                    .resize(img.width, img.height, { fit: 'cover' })
                    .toFile(outputPath);
                console.log(`Success.`);
            } catch (e) {
                console.error(`Error processing ${img.name}:`, e);
            }
        } else {
            console.log(`Input ${img.src} not found.`);
        }
    }
}

resizeImages().catch(console.error);
