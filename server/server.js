require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Mongoose model for Polaroid
const PolaroidSchema = new mongoose.Schema({
    image: { type: String, required: true },
    caption: { type: String, required: true },
    date: { type: String, required: true },
});

const Polaroid = mongoose.model('Polaroid', PolaroidSchema);

// Routes
app.post('/api/polaroids', upload.single('image'), async (req, res) => {
    try {
        const { caption, date } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'Image upload failed' });
        }

        const newPolaroid = new Polaroid({
            image: `/uploads/${req.file.filename}`,
            caption,
            date,
        });

        await newPolaroid.save();
        res.json(newPolaroid);
    } catch (error) {
        console.error('Error in POST /api/polaroids:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Get all polaroids
app.get('/api/polaroids', async (req, res) => {
    try {
        const polaroids = await Polaroid.find();
        res.json(polaroids);
    } catch (error) {
        console.error('Error in GET /api/polaroids:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Delete a polaroid
app.delete('/api/polaroids/:id', async (req, res) => {
    try {
        const polaroid = await Polaroid.findByIdAndDelete(req.params.id);
        if (!polaroid) return res.status(404).json({ message: 'Polaroid not found' });

        // Delete the image file from uploads
        fs.unlink(path.join(__dirname, polaroid.image), (err) => {
            if (err) console.error('Error deleting image file:', err);
        });

        res.json({ message: 'Polaroid deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/polaroids:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Edit a polaroid
app.put('/api/polaroids/:id', async (req, res) => {
    try {
        const { caption, date } = req.body;
        const polaroid = await Polaroid.findByIdAndUpdate(
            req.params.id,
            { caption, date },
            { new: true }
        );
        if (!polaroid) return res.status(404).json({ message: 'Polaroid not found' });

        res.json(polaroid);
    } catch (error) {
        console.error('Error in PUT /api/polaroids:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
