const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/user');
const Paper = require('./models/paper');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/research-portal')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// File upload configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Authentication routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        res.json({ 
            message: 'Login successful',
            userId: user._id 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Paper management routes
app.post('/api/papers/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const paper = new Paper({
            title: req.body.title,
            authors: req.body.authors,
            keywords: req.body.keywords,
            abstract: req.body.abstract,
            filename: req.file.filename,
            userId: req.body.userId
        });
        await paper.save();
        console.log('Paper saved:', paper);
        res.json({ success: true, message: 'Paper uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/papers', async (req, res) => {
    try {
        const papers = await Paper.find();
        res.json(papers);
    } catch (error) {
        console.error('Fetch papers error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/papers/:id/download', async (req, res) => {
    try {
        console.log('Download request for paper:', req.params.id);
        const paper = await Paper.findById(req.params.id);
        
        if (!paper) {
            console.log('Paper not found in database');
            return res.status(404).json({ error: 'Paper not found' });
        }

        const file = path.join(__dirname, 'uploads', paper.filename);
        console.log('File path:', file);

        if (!fs.existsSync(file)) {
            console.log('File not found in uploads directory');
            return res.status(404).json({ error: 'File not found in storage' });
        }

        // Set content disposition and content type
        res.setHeader('Content-Disposition', `attachment; filename="${paper.title}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Stream the file instead of using res.download
        const fileStream = fs.createReadStream(file);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('Stream error:', error);
            res.status(500).json({ error: 'Error streaming file' });
        });
    } catch (error) {
        console.error('Download route error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete paper route
app.delete('/api/papers/:id', async (req, res) => {
    try {
        console.log('Delete request for paper:', req.params.id);
        const paper = await Paper.findById(req.params.id);
        
        if (!paper) {
            return res.status(404).json({ error: 'Paper not found' });
        }

        // Delete file from uploads folder
        const file = path.join(__dirname, 'uploads', paper.filename);
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }

        // Delete paper from database
        await Paper.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Paper deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});