const express = require('express');
const router = express.Router();
const ctrlTasks = require('../controllers/tasks');

router.get('/tasks', ctrlTasks.tasksList);
router.post('/tasks', ctrlTasks.tasksCreate);
router.get('/tasks/:taskid', ctrlTasks.tasksReadOne);
router.put('/tasks/:taskid', ctrlTasks.tasksUpdateOne);
router.delete('/tasks/:taskid', ctrlTasks.tasksDeleteOne);

module.exports = router;
