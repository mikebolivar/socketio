var path = require('path');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var mysqlModel = require('mysql-model');







// Server part
var app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

router.route('/products')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {
        
        var bear = new Product();      // create a new instance of the Bear model
        bear.name = req.body.name;  // set the bears name (comes from the request)

        // save the bear and check for errors
        bear.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Bear created!' });
        });
        
    })    
    // get all the bears (accessed at GET http://localhost:8080/api/bears)
    .get(function(req, res) {
    	var MyAppModel = mysqlModel.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'jajaja',
  database : 'socketio',
});
 
var Product = MyAppModel.extend({
	tableName: "products",
});

        Product.query("Select * from products", function(err, row){
            res.json({ message: 'JOJOJO created!' });
        });
    });


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


app.use('/', express.static(path.join(__dirname, 'public')));

var port = process.env.PORT || 5000;        // set our port
var server = app.listen(port);
console.log('Server listening on port '+ port);

// Socket.IO part
var io = require('socket.io')(server);

var sendComments = function (socket) {
	fs.readFile(__dirname + '/_comments.json', 'utf8', function(err, comments) {
		comments = JSON.parse(comments);
		socket.emit('comments', comments);
	});
};

io.on('connection', function (socket) {

	console.log('New client connected! Id: ' + socket.id);
  
  	socket.on('fetchComments', function () {
		sendComments(socket);
	});

	socket.on('newComment', function (comment, callback) {
		fs.readFile('_comments.json', 'utf8', function(err, comments) {
			comments = JSON.parse(comments);
			comments.push(comment);
			fs.writeFile(__dirname +'/_comments.json', JSON.stringify(comments, null, 4), function (err) {
				io.emit('comments', comments);
				callback(err);
			});
		});

	});


	socket.on('disconnect', function(){
        console.log('Client has disconnected. Id: ' + socket.id);
    });
});
