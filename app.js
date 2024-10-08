const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const app = express();


app.set('view engine', 'ejs')

// Set up storage for multer (to save videos in the 'uploads' folder)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Use the current date to make filenames unique
    }
});

const upload = multer({ storage });

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/videos/:filename', (req, res) => {
    console.log("haiii")
    const videoPath = path.join(__dirname, 'uploads', req.params.filename);
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
console.log(range)
    if (!range) {
        // If the Range header is missing, return the whole video with Content-Length
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    } else {
        // Parse Range header to get start and end bytes
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
            return;
        }

        // Chunk size for partial file
        const chunkSize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });

        // Send 206 Partial Content header with proper Content-Range
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res); // Stream the partial file content
    }
});


// Handle video upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`Video uploaded successfully: <a href="/videos/${req.file.filename}">Watch Video</a>`);
});

app.listen(5000,()=>{
    console.log('Server is running on port 5000')
})