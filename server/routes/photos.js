const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const EventPhoto = require('../models/EventPhoto');
const Event      = require('../models/Event');

// Store photos locally in uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Images only'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// GET photos for an event
router.get('/:event_id', async (req, res) => {
  try {
    const photos = await EventPhoto.find({ event_id: req.params.event_id })
      .sort({ createdAt: -1 });
    const mapped = photos.map(p => ({
      ...p.toObject(),
      id:  p._id,
      // Use Cloudinary URL if available (old photos), else local URL
      url: p.cloudinary_url || `${req.protocol}://${req.get('host')}/uploads/${p.filename}`,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload photos
router.post('/:event_id', upload.array('photos', 10), async (req, res) => {
  try {
    const { event_id } = req.params;
    const { photo_type = 'reference' } = req.body;

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No files uploaded' });

    const saved = await Promise.all(req.files.map(file =>
      EventPhoto.create({
        event_id,
        filename:      file.filename,
        original_name: file.originalname,
        photo_type,
        url: `/uploads/${file.filename}`,
        size:     file.size,
        mimetype: file.mimetype,
      })
    ));

    const mapped = saved.map(p => ({
      ...p.toObject(),
      id:  p._id,
      url: `${req.protocol}://${req.get('host')}/uploads/${p.filename}`,
    }));

    // Save first photo as cover
    await Event.findByIdAndUpdate(event_id, {
      cover_photo_url: `${req.protocol}://${req.get('host')}/uploads/${saved[0].filename}`
    }).catch(() => {});

    res.status(201).json(mapped);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a photo
router.delete('/:photo_id', async (req, res) => {
  try {
    const photo = await EventPhoto.findById(req.params.photo_id);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    // Delete file from disk
    const filePath = path.join(__dirname, '../uploads', photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await EventPhoto.findByIdAndDelete(req.params.photo_id);
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
