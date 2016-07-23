const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
  
const app = express();
const ObjectId = require('mongodb').ObjectID;

const MongoClient = require('mongodb').MongoClient;
const port = Number(process.env.PORT || 8000);

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  'OPTIONS' === req.method ? res.send(200) : next();
};

app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

let db;

app.get('/', (req, res) => {
  res.send('Root');
});

app.post('/authenticate', (req, res) => {
  db.collection('users').findOne({ username: req.body.username }, (err, user) => {
    if (err || !user || user.password !== req.body.password) {
      return res.status(401).json({ message: 'Wrong username or password' });
    }

    const token = jwt.sign(user, process.env.SECRET_KEY, {
      expiresIn: '2h'
    });

    res.status(200).json({ token });
  });
});

app.get('/courses', (req, res) => {
  db.collection('courses').find({}).toArray((err, courses) => {
    if (err) return console.log(err);

    res.status(200).json({ courses });
  });
});

app.get('/courses/:course_id', (req, res) => {
  db.collection('courses').find({_id: ObjectId(req.params.course_id)}).toArray((err, course) => {
    if (err) return console.log(err);

    res.status(200).json({ course: course[0] });
  });
});

app.use((req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Failed to authenticate token.' });
      else {
        req.decoded = decoded;
        next();
      }
    })
  }
  else return res.status(401).send({ message: 'No token provided.' });
});

app.post('/courses', (req, res) => {
  db.collection('courses').save(req.body, (err) => {
    if (err) return console.log(err);

    res.json({ message: 'Course created!' });
  });
});

app.delete('/courses', (req, res) => {
  db.collection('courses').remove({_id: ObjectId(req.body.id)}, (err) => {
    if (err) return console.log(err);

    res.json({ message: 'Course deleted!' });
  });
});

MongoClient.connect(`mongodb://${process.env.MLAB_USER}:${process.env.MLAB_PASS}@${process.env.MLAB_DIR}`, (err, database) => {
  if (err) return console.log(err);

  db = database;

  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  });
})
