'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');

var app = express();
var ObjectId = require('mongodb').ObjectID;

var MongoClient = require('mongodb').MongoClient;
var port = Number(process.env.PORT || 8000);

var allowCrossDomain = function allowCrossDomain(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'x-access-token, Content-Type, Authorization,' + ' Content-Length, X-Requested-With, X-Course-Id');

  'OPTIONS' === req.method ? res.sendStatus(200) : next();
};

app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

var db = void 0;

app.get('/', function (req, res) {
  res.send('Root');
});

app.post('/authenticate', function (req, res) {
  db.collection('users').findOne({ username: req.body.username }, function (err, user) {
    if (err || !user || user.password !== req.body.password) {
      return res.status(401).json({ message: 'Wrong username or password' });
    }

    var token = jwt.sign(user, process.env.SECRET_KEY, {
      expiresIn: '2h'
    });

    res.status(200).json({ token: token });
  });
});

app.get('/courses', function (req, res) {
  db.collection('courses').find({}).toArray(function (err, courses) {
    if (err) return console.log(err);

    res.status(200).json({ courses: courses });
  });
});

app.get('/courses/:course_id', function (req, res) {
  db.collection('courses').find({ _id: ObjectId(req.params.course_id) }).toArray(function (err, course) {
    if (err) return console.log(err);

    res.status(200).json({ course: course[0] });
  });
});

app.use(function (req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, function (err, decoded) {
      if (err) return res.status(401).json({ message: 'Failed to authenticate token.' });else {
        req.decoded = decoded;
        next();
      }
    });
  } else return res.status(401).send({ message: 'No token provided.' });
});

app.post('/courses', function (req, res) {
  db.collection('courses').save(req.body, function (err, savedCourse) {
    if (err) return console.log(err);

    res.json({ message: 'Course created!', course: savedCourse.ops });
  });
});

app.delete('/courses', function (req, res) {
  db.collection('courses').findAndModify({ _id: ObjectId(req.headers['x-course-id']) }, [], {}, { remove: true }, function (err, deletedCourse) {
    if (err) return console.log(err);

    res.json({ message: 'Course deleted!', course: deletedCourse.value });
  });
});

MongoClient.connect('mongodb://' + process.env.MLAB_USER + ':' + process.env.MLAB_PASS + '@' + process.env.MLAB_DIR, function (err, database) {
  if (err) return console.log(err);

  db = database;

  app.listen(port, function () {
    console.log('Listening on port ' + port);
  });
});