const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  }
  catch (err) {
    res.status(400).send(err);
  }
})

//  GET TASKS WITH DIFFERENT APPROACH(WITHOUT POPULATE)

// router.get('/tasks', auth, async (req, res) => {
//   const match = {};
//   const sort = {};
//   const limit = parseInt(req.query.limit);
//   const skip = parseInt(req.query.skip);
//   const user = req.user;

//   try {
//     if (req.query.completed) {
//       const completed = req.query.completed === 'true';
//       if (req.query.sortBy) {
//         const parts = req.query.sortBy.split(':');
//         sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
//       }
//       const tasks = await Task.find({ owner: user._id, completed }).limit(limit).skip(skip).sort(sort);
//       res.send(tasks);
//     }
//     else {
//       console.log(user)
//       if (req.query.sortBy) {
//         const parts = req.query.sortBy.split(':');
//         sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
//       }
//       const tasks = await Task.find({ owner: user._id }).limit(limit).skip(skip).sort(sort);
//       res.send(tasks);
//     }
//   }
//   catch (err) {
//     res.status(500).send(err);
//   }
// })



// GET /tasks?completed=true or false
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt_asc(or desc)
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = (req.query.completed === 'true')
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    // const tasks = await Task.find({ owner: req.user._id })
    // OR as a whole: 
    // await Task.find({owner:req.user._id,completed}).limit(limit).skip(skip).sort(sort)
    // res.send(task).status(200)
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate() // A little more efficient(could use .limit.skip)
    res.send(req.user.tasks);
  }
  catch (err) {
    res.status(500).send(err)
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id })

    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  }
  catch (err) {
    res.status(500).send(err)
  }
})



router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdated = ['description', 'completed'];
  const isApproved = updates.every(update => allowedUpdated.includes(update));

  if (!isApproved) {
    res.status(400).send({ error: 'Invalid updates' })
  }

  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send('Task not found')
    }

    updates.forEach(update => task[update] = req.body[update])

    await task.save()

    res.send(task)
  } catch (err) {
    res.status(400).send(err)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send('Task not found')
    }
    res.send(task);
  } catch (err) {
    res.status(400).send()
  }
})

module.exports = router;