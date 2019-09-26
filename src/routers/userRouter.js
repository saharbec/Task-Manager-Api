const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendcancelationEmail } = require('../emails/account');

const router = new express.Router();


router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save()
    sendWelcomeEmail(user);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token })

  } catch (err) {
    res.status(400).send(err)
  }
})

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken();
    res.send({ user, token })
  } catch (err) {
    res.status(401).send(err)
  }
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
    await req.user.save();

    res.send()

  } catch (err) {
    res.status(500).send(err)
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send(req.user)
  } catch (err) {
    res.status(500).send(err);
  }
})

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
  const { user } = req;
  const updates = Object.keys(req.body)
  const allowedUpdated = ['name', 'email', 'password', 'age']
  const isApproved = updates.every(update => allowedUpdated.includes(update))
  if (!isApproved) {
    return res.status(400).send({ error: 'Invalid updates' })
  }

  try {
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    res.send(user)
  } catch (err) {
    res.status(400).send(err);
  }
})

router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendcancelationEmail(req.user);
    res.send(req.user);
  } catch (err) {
    res.status(400).send()
  }
})

const upload = multer({
  // dest: 'avatars',
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error(`File must be an image`))
    }
    cb(undefined, true)
  }
})

const roundedCorners = Buffer.from(
  '<svg><rect x="0" y="0" width="200" height="200" rx="50" ry="50"/></svg>'
);

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const { user, file } = req;
  const buffer = await sharp(file.buffer).resize(200, 200).composite([{
    input: roundedCorners,
    blend: 'dest-in'
  }]).png().toBuffer();
  user.avatar = buffer;
  await user.save();

  res.send()
}, (err, req, res, next) => {
  res.status(400).send({ error: err.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    const { user } = req;
    console.log(user.avatar)
    if (user.avatar) {
      user.avatar = undefined;
      await user.save();
      res.send('Avatar deleted');
    }
    else throw new Error('Avatar not exists.')
  }
  catch (err) {
    res.status(404).send(err.message);
  }
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar);

  }
  catch (err) {
    res.status(404).send();
  }
})

module.exports = router