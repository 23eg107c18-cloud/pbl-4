const express = require('express');
const router = express.Router();
const ctrlTasks = require('../controllers/tasks');
const ctrlGridfs = require('../controllers/gridfs');
const multer = require('multer');

// multer memory storage for GridFS uploads
const upload = multer({ storage: multer.memoryStorage() });

router.get('/tasks', ctrlTasks.tasksList);
router.post('/tasks', upload.single('file'), ctrlTasks.tasksCreate);
router.get('/tasks/:taskid', ctrlTasks.tasksReadOne);
router.put('/tasks/:taskid', upload.single('file'), ctrlTasks.tasksUpdateOne);
router.delete('/tasks/:taskid', ctrlTasks.tasksDeleteOne);

// GridFS routes
router.post('/gridfs/upload', upload.single('file'), ctrlGridfs.uploadFile);
router.get('/gridfs/files', ctrlGridfs.listFiles);
router.get('/gridfs/files/:id', ctrlGridfs.downloadFile);
router.delete('/gridfs/files/:id', ctrlGridfs.deleteFile);

module.exports = router;
