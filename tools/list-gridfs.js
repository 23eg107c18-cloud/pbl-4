#!/usr/bin/env node
/*
Usage: node tools/list-gridfs.js [MONGO_URI]
Reads MONGO_URI from env or first arg. Prints GridFS files (fs.files) and tasks referencing attachments.
*/
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI || process.argv[2];
  if (!uri) {
    console.error('Provide MongoDB URI as MONGO_URI env var or first argument');
    process.exit(1);
  }

  await mongoose.connect(uri, { });
  const db = mongoose.connection.db;

  try {
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });
    const files = await bucket.find({}).toArray();
    console.log(`GridFS files count: ${files.length}`);
    files.forEach(f => {
      console.log(`- id=${f._id.toString()} filename=${f.filename} length=${f.length} contentType=${f.contentType} uploadDate=${f.uploadDate}`);
    });

    // show tasks that reference attachments
    const tasks = await db.collection('tasks').find({ attachment: { $exists: true, $ne: null } }).toArray();
    console.log(`\nTasks with attachment count: ${tasks.length}`);
    tasks.forEach(t => {
      console.log(`- taskId=${t._id.toString()} title=${t.title || '<no title>'} attachment=${t.attachment}`);
    });
  } catch (err) {
    console.error('Error reading GridFS or tasks:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
