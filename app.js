require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// URL Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
const Url = mongoose.model('Url', urlSchema);

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Function to validate URL format
const isValidUrl = (url) => {
  const regex = /^(http:\/\/|https:\/\/)(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(:[0-9]{1,5})?(\/.*)?$/;
  return regex.test(url);
};

// POST: Shorten a URL
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  // Validate URL
  if (!isValidUrl(url)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Check if the URL already exists
    let existingUrl = await Url.findOne({ original_url: url });
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    // Get a new short_url number
    const count = await Url.countDocuments();
    const newUrl = new Url({ original_url: url, short_url: count + 1 });

    await newUrl.save();

    return res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    });

  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET: Redirect to original URL
app.get('/api/shorturl/:shorturl', async (req, res) => {
  const shorturl = Number(req.params.shorturl);

  try {
    const urlEntry = await Url.findOne({ short_url: shorturl });
    if (urlEntry) {
      return res.redirect(urlEntry.original_url);
    } else {
      return res.json({ error: 'No short URL found for the given input' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
