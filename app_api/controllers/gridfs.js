const mongoose = require('mongoose');
const stream = require('stream');

// Upload a file buffer (expects multer memoryStorage single 'file')
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });

    const filename = req.file.originalname || 'upload';
    const contentType = req.file.mimetype || 'application/octet-stream';

    const uploadStream = bucket.openUploadStream(filename, { contentType });
    const readable = new stream.PassThrough();
    readable.end(req.file.buffer);
    readable.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      console.error('GridFS upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    });

    uploadStream.on('finish', (file) => {
      res.json({ file });
    });
  } catch (err) {
    console.error('uploadFile error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// List files in the GridFS bucket
exports.listFiles = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });
    const files = await bucket.find({}).toArray();
    res.json({ files });
  } catch (err) {
    console.error('listFiles error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Download a file by id
exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!fileId) return res.status(400).json({ error: 'Missing file id' });

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });
    const _id = new mongoose.Types.ObjectId(fileId);
    const downloadStream = bucket.openDownloadStream(_id);

    // set headers when we can fetch file metadata first
    // try to fetch file doc
    const files = await bucket.find({ _id }).toArray();
    if (files.length === 0) return res.status(404).json({ error: 'File not found' });
    const file = files[0];
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);

    downloadStream.on('error', (err) => {
      console.error('GridFS download error', err);
      res.status(500).end();
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('downloadFile error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a file by id
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!fileId) return res.status(400).json({ error: 'Missing file id' });
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });
    const _id = new mongoose.Types.ObjectId(fileId);
    await bucket.delete(_id);
    res.json({ deleted: true });
  } catch (err) {
    console.error('deleteFile error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
