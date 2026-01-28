import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const imagesDir = path.resolve('public/images');

const images = [
    { name: 'about', width: 300, height: 300 },
    { name: 'EcoSnap', width: 400, height: 400 },
    { name: 'SFalt1', width: 400, height: 400 }
];

async function resizeImages() {
    console.log('Starting image resize...');
    for (const img of images) {
        const webpPath = path.join(imagesDir, `${img.name}.webp`);
        const tempWebp = path.join(imagesDir, `${img.name}_temp.webp`);

        // WebP
        if (fs.existsSync(webpPath)) {
            console.log(`Resizing ${img.name}.webp...`);
            try {
                await sharp(webpPath)
                    .resize(img.width, img.height, { fit: 'cover' })
                    .toFile(tempWebp);
                // Small delay to ensure handle release?
                await new Promise(r => setTimeout(r, 100));
                fs.unlinkSync(webpPath);
                fs.renameSync(tempWebp, webpPath);
                console.log(`Success.`);
            } catch (e) {
                console.error(`Error resizing ${img.name}.webp:`, e);
            }
        }

        // PNG
        const pngPath = path.join(imagesDir, `${img.name}.png`);
        const tempPng = path.join(imagesDir, `${img.name}_temp.png`);
        if (fs.existsSync(pngPath)) {
            console.log(`Resizing ${img.name}.png...`);
            try {
                await sharp(pngPath)
                    .resize(img.width, img.height, { fit: 'cover' })
                    .toFile(tempPng);
                await new Promise(r => setTimeout(r, 100));
                fs.unlinkSync(pngPath);
                fs.renameSync(tempPng, pngPath);
            } catch (e) { console.error(e); }
        }

        // JPG
        const jpgPath = path.join(imagesDir, `${img.name}.jpg`);
        const tempJpg = path.join(imagesDir, `${img.name}_temp.jpg`);
        if (fs.existsSync(jpgPath)) {
            console.log(`Resizing ${img.name}.jpg...`);
            try {
                await sharp(jpgPath)
                    .resize(img.width, img.height, { fit: 'cover' })
                    .toFile(tempJpg);
                await new Promise(r => setTimeout(r, 100));
                fs.unlinkSync(jpgPath);
                fs.renameSync(tempJpg, jpgPath);
            } catch (e) { console.error(e); }
        }
    }
    console.log('All done.');
}

resizeImages().catch(console.error);
