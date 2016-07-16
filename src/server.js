const express = require('express');
const bodyParser= require('body-parser');
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

let db;

app.get('/', (req, res) => {
  console.log('Root served');
  res.send('Root');
});

app.get('/courses', (req, res) => {
  console.log('All courses will be returned');

  db.collection('courses').find({}).toArray((err, courses) => {
    if (err) return console.log(err);

    res.status(200).json({ courses });
  });
});

app.get('/courses/:course_id', (req, res) => {
  console.log('A single course will be returned');

  db.collection('courses').find({_id: ObjectId(req.params.course_id)}).toArray((err, course) => {
    if (err) return console.log(err);

    res.status(200).json({ course: course[0] });
  });
});

app.post('/courses', (req, res) => {
  console.log('A course will be saved');

  db.collection('courses').save(req.body, (err) => {
    if (err) return console.log(err);

    res.json({ message: 'Course created!' });
  });
});

app.delete('/courses', (req, res) => {
  console.log('A course will be deleted');

  db.collection('courses').remove({_id: ObjectId(req.body.id)}, (err) => {
    if (err) return console.log(err);

    res.json({ message: 'Course deleted!' });
  });
});

MongoClient.connect(`mongodb://${process.env.MLAB_USER}:${process.env.MLAB_PASS}@ds011745.mlab.com:11745/courses`, (err, database) => {
  if (err) return console.log(err);

  db = database;

  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  });
})
