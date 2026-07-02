const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// GET all events (with client populated)
router.get('/', async (req, res) => {
  try {
    const { status, payment_status, event_name, date_from, date_to, client_id } = req.query;
    const filter = {};
    if (status)         filter.event_status   = status;
    if (payment_status) filter.payment_status = payment_status;
    if (event_name)     filter.event_name     = event_name;
    if (client_id)      filter.client_id      = client_id;
    if (date_from || date_to) {
      filter.event_date = {};
      if (date_from) filter.event_date.$gte = date_from;
      if (date_to)   filter.event_date.$lte = date_to;
    }
    const events = await Event.find(filter)
      .populate('client_id', 'name mobile alternate_mobile address google_map_link')
      .sort({ event_date: 1 });
    // Rename client_id -> client for frontend compatibility
    const mapped = events.map(e => {
      const obj = e.toObject();
      obj.client = obj.client_id;
      obj.id = obj._id;
      return obj;
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('client_id', 'name mobile alternate_mobile address google_map_link');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const obj = event.toObject();
    obj.client = obj.client_id;
    obj.id = obj._id;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create event
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    await event.populate('client_id', 'name mobile alternate_mobile address google_map_link');
    const obj = event.toObject();
    obj.client = obj.client_id;
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update event
router.put('/:id', async (req, res) => {
  try {
    // Recalculate balance
    if (req.body.total_price !== undefined || req.body.advance_received !== undefined) {
      const existing = await Event.findById(req.params.id);
      const total   = req.body.total_price      ?? existing.total_price;
      const advance = req.body.advance_received ?? existing.advance_received;
      req.body.remaining_balance = total - advance;
    }
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('client_id', 'name mobile alternate_mobile address google_map_link');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const obj = event.toObject();
    obj.client = obj.client_id;
    obj.id = obj._id;
    res.json(obj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
