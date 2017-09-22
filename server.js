//  OpenShift sample Node application
var express = require('express'),
  app = express(),
  graph = require('fbgraph'),
  morgan = require('morgan');

Object.assign = require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
  mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
  mongoURLLabel = "";

// this should really be in a config file!
var conf = {
  client_id: '28da84b4aa827c07a1f326e9d57086f8',
  client_secret: 'd5f908b55b06c469fdc1503b67357698',
  scope: 'email, user_about_me, user_birthday, user_location, publish_stream',
  redirect_uri: 'http://' + ip + ':' + port + '/auth/facebook'
};

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
    mongoPassword = process.env[mongoServiceName + '_PASSWORD']
  mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
  dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

//app.configure(function() {
app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.use(express.bodyParser());
//app.use(express.methodOverride());
//app.use(app.router);
app.use(express.static(__dirname + '/public'));
//});



app.get('/', function(req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err) {});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({
      ip: req.ip,
      date: Date.now()
    });
    col.count(function(err, count) {
      res.render('index.html', {
        pageCountMessage: count,
        dbInfo: dbDetails
      });
    });
  } else {
    res.render('index.html', {
      pageCountMessage: null
    });
  }
});

app.get('/auth/facebook', function(req, res) {

  // we don't have a code yet
  // so we'll redirect to the oauth dialog
  if (!req.query.code) {
    var authUrl = graph.getOauthUrl({
      "client_id": conf.client_id,
      "redirect_uri": conf.redirect_uri,
      "scope": conf.scope
    });

    if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
      res.redirect(authUrl);
    } else { //req.query.error == 'access_denied'
      res.send('access denied');
    }
    return;
  }

  // code is set
  // we'll send that and get the access token
  graph.authorize({
    "client_id": conf.client_id,
    "redirect_uri": conf.redirect_uri,
    "client_secret": conf.client_secret,
    "code": req.query.code
  }, function(err, facebookRes) {
    res.redirect('/UserHasLoggedIn');
  });


});

// user gets sent here after being authorized
app.get('/UserHasLoggedIn', function(req, res) {
  res.render('index.html', {
    pageCountMessage: null
  });
});

app.get('/pagecount', function(req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err) {});
  }
  if (db) {
    db.collection('counts').count(function(err, count) {
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err) {
  console.log('Error connecting to Mongo. Message:\n' + err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
