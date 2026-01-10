const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

//ensure folder exist before uploading inside
//fallback for local exec inside Docker
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {
        recursive : true
    });
}

const storage = multer.memoryStorage(); //temporary store media in ram before sharp compresses it to upload on the actual hdd/ssd

//initial upload config ( Validation )
const upload = multer({
    storage, 
    limits: { fileSize : 5 * 1024 * 1024}, //max 5mb/file 
    fileFilter: (req, file, cb) => {              //request , file, callback
        if(file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG/PNG image files can be uploaded!'), false);
        }
    }
});

//image proccessing middleware ( compress/resize )
const resizeImage = async (req, res, next) => {
    console.log('--- DEBUG: Files in Middleware ---', req.files);
    
    // Check if files exist
    if(!req.files || req.files.length === 0)
        return next();
    
    try{
        await Promise.all(
            req.files.map(async (file) => {
                //create unique name for each file | format : ticket-timestamp-random.jpeg
                const filename = `ticket-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpeg`;
                const outputPath = path.join(uploadDir, filename);

                //sharp logic : resize > jpeg > compress > write to disk
                await sharp(file.buffer)
                    .resize(1920, 1080,{fit:'inside', withoutEnlargement: true}) //hd quality
                    .toFormat('jpeg')
                    .jpeg({quality: 75}) //75% quality of original image
                    .toFile(outputPath);
                //security patch / manually attach properties so controller can find the file (memoryStorage skips this)
                file.path = `uploads/${filename}`;
                file.filename = filename;
            })
        );
        next();
    } catch(error){
        console.error('Resize Error:', error);
        res.status(500).json({message: 'Error proccessing images', error: error.message});
    }
}

module.exports = {upload , resizeImage};