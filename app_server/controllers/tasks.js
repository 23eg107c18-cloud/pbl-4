const mongoose = require('mongoose');
const Task = mongoose.model('Task');

const requireAuth = (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/signin');
  }
  return null;
};

const homelist = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.redirect('/signin');
    const tasks = await Task.find({ owner: req.session.userId }).sort({ nextRun: 1 }).lean();
    res.render('tasks-list', { title: 'Task Scheduler', tasks });
  } catch (err) {
    console.error('Error loading tasks', err);
    res.render('error', { message: 'Error loading tasks', error: err });
  }
};

const addTaskForm = (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/signin');
  return res.render('task-form', { title: 'Add Task', action: '/task/add' });
};

const doAddTask = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.redirect('/signin');
    const data = {
      owner: req.session.userId,
      title: req.body.title,
      description: req.body.description,
      nextRun: req.body.nextRun ? new Date(req.body.nextRun) : null,
      interval: req.body.interval || null
    };
    // handle optional file upload (multer memoryStorage)
    if (req.file && req.file.buffer) {
  const db = require('mongoose').connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });
      const uploadStream = bucket.openUploadStream(req.file.originalname || 'attachment', { contentType: req.file.mimetype });
      const { PassThrough } = require('stream');
      const readable = new PassThrough();
      readable.end(req.file.buffer);
      readable.pipe(uploadStream);
      const file = await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      data.attachment = file._id;
      data.attachmentFilename = file.filename;
      data.attachmentContentType = file.contentType || null;
    }
    await Task.create(data);
    res.redirect('/');
  } catch (err) {
    console.error('Error adding task', err);
    res.render('error', { message: 'Error adding task', error: err });
  }
};

const taskInfo = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.redirect('/signin');
    const task = await Task.findOne({ _id: req.params.taskid, owner: req.session.userId }).lean();
    if (!task) return res.render('error', { message: 'Task not found or not accessible', error: {} });
    res.render('task-info', { title: task.title, task });
  } catch (err) {
    console.error('Error loading task', err);
    res.render('error', { message: 'Task not found', error: err });
  }
};

const editTaskForm = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.redirect('/signin');
    const task = await Task.findOne({ _id: req.params.taskid, owner: req.session.userId }).lean();
    if (!task) return res.render('error', { message: 'Task not found or not accessible', error: {} });
    res.render('task-form', { title: `Edit ${task.title}`, task, action: `/task/${req.params.taskid}/edit` });
  } catch (err) {
    console.error('Error loading task for edit', err);
    res.render('error', { message: 'Task not found', error: err });
  }
};

const doEditTask = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.redirect('/signin');
    const update = {
      title: req.body.title,
      description: req.body.description,
      nextRun: req.body.nextRun ? new Date(req.body.nextRun) : null,
      interval: req.body.interval || null
    };
    // handle replacement attachment
    if (req.file && req.file.buffer) {
  const db = require('mongoose').connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });
      const existing = await Task.findOne({ _id: req.params.taskid, owner: req.session.userId }).select('attachment').lean();
      if (existing && existing.attachment) {
        try { await bucket.delete(existing.attachment); } catch (e) { console.warn('Failed to delete old GridFS file', e.message || e); }
      }
      const uploadStream = bucket.openUploadStream(req.file.originalname || 'attachment', { contentType: req.file.mimetype });
      const { PassThrough } = require('stream');
      const readable = new PassThrough();
      readable.end(req.file.buffer);
      readable.pipe(uploadStream);
      const file = await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      update.attachment = file._id;
      update.attachmentFilename = file.filename;
      update.attachmentContentType = file.contentType || null;
    }
    await Task.findOneAndUpdate({ _id: req.params.taskid, owner: req.session.userId }, update, { runValidators: true });
    res.redirect(`/task/${req.params.taskid}`);
  } catch (err) {
    console.error('Error updating task', err);
    res.render('error', { message: 'Error updating task', error: err });
  }
};

const doDeleteTask = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.redirect('/signin');
    await Task.findOneAndDelete({ _id: req.params.taskid, owner: req.session.userId });
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting task', err);
    res.render('error', { message: 'Error deleting task', error: err });
  }
};

module.exports = {
  homelist,
  addTaskForm,
  doAddTask,
  taskInfo,
  editTaskForm,
  doEditTask,
  doDeleteTask
};
