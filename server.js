#!/bin/env node
//  OpenShift sample Node application
var express = require('express')
, swig = require('swig')
  , cons = require('consolidate')
  , http = require('http')
  , path = require('path')
  , VIEWS_DIR = __dirname + '/views';

global.isProd = process.env.OPENSHIFT_INTERNAL_IP != null; 


var log4js = require('log4js');
log4js.replaceConsole();

var mongoose = require('mongoose');

var flash = require('connect-flash');
var fs      = require('fs');
var db = require('mylib/db.js');
db.connect();

var eu = require('mylib/expressUtils.js');
var passport = require('passport')
, LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    var User = db.User;
    User.findOne({ username: username }, function(err, user) {
      
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      if (user.password != password) {
        return done(null, false, { message: 'Incorrect password or password.' });
      }

      eu.prepareUserForSession();
      return done(null, user);
    });
  }
));


/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_INTERNAL_IP || '127.0.0.1';
        global.ipaddress = self.ipaddress;
        self.port      = process.env.OPENSHIFT_INTERNAL_PORT || 3000;
        global.port = self.port;
       
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.app = express();

        var app = self.app;

        swig.init({
            root: VIEWS_DIR, //Note this directory is your Views directory
            allowErrors: true // allows errors to be thrown and caught by express
        });

        // assign the swig engine to .html files
        app.engine('html', cons.swig);

        eu.prepareUserForSession();

        //console.log(db.connections[0]);
        //console.log("!!" + mongoose.connection.db)
        app.configure(function(){
          app.set('port', process.env.PORT || 3000);
          app.set('views', VIEWS_DIR);
          app.set('view engine', 'html');
          app.set('view options', { layout: false });

          app.use(express.favicon((path.join(__dirname, '/public/images/favicon.ico'))));
          
          //if you use formidable, you have to modify the next line
          //because it's not compatible with express bodyParser
          app.use(express.bodyParser());
          //delete express.bodyParser.parse['multipart/form-data']
          app.use(express.methodOverride());
          app.use(express.cookieParser("hellerworld2"));
          app.use(express.cookieSession());
          app.use(passport.initialize());
           
          app.use(passport.session());
          app.use(flash());
          app.use(app.router);
          app.use(express.static(path.join(__dirname, 'public')));
         
        });

        app.configure('development', function(){
          global.isDevelopment = true;
          app.use(express.logger('dev'));
           app.use(express.errorHandler());  
          require('swig').init({
            root: VIEWS_DIR, //Note this directory is your Views directory
            allowErrors: true,
            cache: false
          });
        });

        require('./routes/routes.js')(app);
        
       
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        //self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
        
    
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        http.createServer(self.app).listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */


var zapp = new SampleApp();
zapp.initialize();
zapp.start();

/**
 *  main():  Main code.
 */
mongoose.connection.on('open', function() {
  db.initData();
});

