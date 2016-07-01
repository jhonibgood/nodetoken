var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model

var port = process.env.port || 8080;
mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

/*
 * ROOT ROUTES
 */

app.get('/setup', function(req, res) {

  // create a sample user
  var nick = new User({ 
    name: 'Missgeburt', 
    password: 'password',
    admin: true 
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});

app.post('/authenticate', function(req, res) {
    var tokenExpiresIn = 24 * 3600;
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'User not found' })
        } else {
            user.verify(req.body.password, function(err, match) {
                if(err || !match) {
                    res.json({ success: false, message: 'Auth failed' });
                } else {
                    var token = jwt.sign(user, app.get('superSecret'), {
                        expiresIn: tokenExpiresIn
                    });
                    res.json({
                        success: true,
                        message: 'Enjoy token',
                        token: token,
                        expiresIn: tokenExpiresIn
                    });                    
                }
            });
        }
    });
});

app.post('/signup', function(req, res) {

    console.log('/signup');
    console.log(req.body);

    var user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });
    user.save(function(err, user) {
        if(err) {
            res.json({
                success: false,
                message: 'Error creating user'
            });
        } else {
            res.json({
                success: true,
                message: 'Welcome user'
            });
        }
    });
});

/*
 * API ROUTES
 */

var apiRoutes = express.Router();

apiRoutes.use(function(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if(token) {
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {
			if(err) {
				return res.json({ success: false, message: 'Failed to authenticate' });
			} else {
				req.decoded = decoded;
				next();
			}
  		});
	} else {
		return res.status(403).send({
			success: false,
			message: 'No token provided'
		});
	}
});

apiRoutes.get('/', function(req, res) {
	res.json({ message: 'Welcome' });
});

apiRoutes.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});

app.use('/api', apiRoutes);

/*
 * 
 */

app.use(express.static('public'));
app.listen(port);
console.log('Magic ' + port);
