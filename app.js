var koa = require('koa');
var monk = require('monk');
var coMonk = require('co-monk');
var route = require('koa-route');
var parse = require('co-body');
var static = require('koa-static');
var views = require('co-views');
var crypto = require('crypto');

/**
 * Settings
 */

var app = koa();
var render = views(__dirname + '/views', { map: { html: 'jade' } });
var db = monk('localhost/jonglog');
var groups = coMonk(db.get('groups'));

app.use(static(__dirname + '/public'));

// bodyParser
app.use(function *(next) {
  if (this.type) {
    this.params = yield parse(this);
  }
  yield next;
});

// methodOverride
app.use(function *(next) {
  if (this.method.toLowerCase() === 'post' && this.params._method) {
    this.method = this.params._method.toUpperCase();
    delete this.params._method;
  }
  yield next;
});


/**
 * Routes
 */

// top page
app.use(route.get('/', function *() {
  this.body = yield render('index.jade');
}));

// create group
app.use(route.post('/groups', function *() {
  var group = yield groups.insert({
    token: sha1(),
    title: this.params.title,
    names: this.params.names.split('\r\n'),
    results: []
  });
  this.redirect('/groups/' + group.token);
}));

// show group
app.use(route.get('/groups/:token', function *(token) {
  var group = yield groups.findOne({ token: token });
  this.body = yield render('groups/index.jade', { group: group });
}));

// edit group
app.use(route.get('/groups/:token/edit', function *(token) {
  var group = yield groups.findOne({ token: token });
  this.body = yield render('groups/edit.jade', { group: group });
}));
app.use(route.put('/groups/:token', function *(token) {
  yield groups.update({ token: token }, {
    '$set': {
      title: this.params.title,
      names: this.params.names.split('\r\n')
    }
  });
  this.redirect('/groups/' + token);
}));

// add result
app.use(route.get('/groups/:token/add', function *(token) {
  var group = yield groups.findOne({ token: token });
  this.body = yield render('groups/add.jade', { group: group });
}));
app.use(route.post('/groups/:token', function *(token) {
  yield groups.update({ token: token }, {
    '$push': {
      results: {
        title: this.params.title,
        date: this.params.date,
        points: this.params.points
      }
    }
  });
  this.redirect('/groups/' + token);
}));

// (API) fetch group
app.use(route.get('/api/groups/:token', function *(token) {
  this.body = yield groups.findOne({ token: token });
}));


/**
 * listen
 */
app.listen(process.env.PORT || 3000);


/**
 * Private functions
 */
function sha1() {
  return crypto.createHash('sha1').update('' + Math.random() + Date.now()).digest('hex');
}
