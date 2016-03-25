var path = require('path');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');






var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '223.229.192.135',
  user     : 'alobarodemo',
  password : 'alobarodemo',
  database : 'alobarodemo'
});


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'jajaja',
  database : 'socketio'
});


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

		connection.query('INSERT INTO products (name) VALUES ("'+ req.body.name+'")', function(err, rows, fields) {
		  if (err) throw err;

            res.json({ message: 'Product created!' });

            connection.query('INSERT INTO products (name,description,photo) VALUES ("'+ req.body.name +'","'+ req.body.description +'","'+ req.body.photo+'")', function(err, rows, fields) {
				if (err) throw err;
			 	console.log("Product created");
				
				connection.query('SELECT * FROM products', function(err, products, fields) {
					if (err) throw err;
					io.emit('products', products);
				});

			});
		});

    	
        
    })    
    // get all the bears (accessed at GET http://localhost:8080/api/bears)
    .get(function(req, res) {

		connection.query('SELECT * FROM products', function(err, rows, fields) {
		  if (err) throw err;

            res.json(rows);
		});

    });


router.route('/comments')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {
    	query = 'INSERT INTO comments (author,text, product_id) VALUES ("'+ req.body.author+'","'+ req.body.text+'","'+ req.body.product_id+'")';

    	console.log(query);

		connection.query( query, function(err, rows, fields) {
		  if (err) throw err;

            res.json({ message: 'Comment created!' });
		});

    	
        
    })    
    // get all the bears (accessed at GET http://localhost:8080/api/bears)
    .get(function(req, res) {

		connection.query('SELECT * FROM comments', function(err, rows, fields) {
		  if (err) throw err;

            res.json(rows);
		});

    });


// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/product/:product_id/comments')

    // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
    .get(function(req, res) {
        
        connection.query('SELECT * FROM comments WHERE product_id = "'+ req.params.product_id +'"', function(err, rows, fields) {
		  if (err) throw err;

            res.json(rows);
		});

    }) 



// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/webhook')

    // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
    .post(function(req, res) {
        
        console.log(req.params)
        connection.query('INSERT INTO webhooks (params) VALUES ("'+ JSON.stringify(req.params) +'")', function(err, rows, fields) {
		  if (err) throw err;

            res.json(rows);
		});

		connection.query('SELECT * FROM products', function(err, products, fields) {
					if (err) throw err;
					io.emit('products', products);
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

	connection.query('SELECT * FROM comments', function(err, comments, fields) {
	  	if (err) throw err;
		socket.emit('comments', comments);
	});

};


io.on('connection', function (socket) {

	console.log('New client connected! Id: ' + socket.id);
  
  	socket.on('fetchComments', function () {
		sendComments(socket);
	});

	socket.on('newComment', function (comment, callback) {

		connection.query('INSERT INTO comments (author,text, product_id) VALUES ("'+ comment.author +'","'+ comment.text+'", "'+ comment.product_id +'")', function(err, rows, fields) {
			if (err) throw err;
		 	console.log("comment created");
			connection.query('SELECT * FROM comments', function(err, comments, fields) {
				if (err) throw err;
				io.emit('comments', comments);
				callback(err);
			});

		});

	});

	socket.on('fetchProducts', function () {
		connection.query('SELECT * FROM products', function(err, products, fields) {
			  	if (err) throw err;
				socket.emit('products', products);
		});
	});

	socket.on('newProduct', function (product, callback) {

		connection.query('INSERT INTO products (name,description,photo) VALUES ("'+ product.name +'","'+ product.description +'","'+ product.photo+'")', function(err, rows, fields) {
			if (err) throw err;
		 	console.log("Product created");
			connection.query('SELECT * FROM products', function(err, products, fields) {
				if (err) throw err;
				io.emit('products', products);
				callback(err);
			});

		});

	});


	socket.on('disconnect', function(){
        console.log('Client has disconnected. Id: ' + socket.id);
    });
});






const Shopify = require('shopify-api-node');

const shopify = new Shopify("alobaro", "7e8905ddf301133f68d73103def268ee", "fad748a80dd2e3b51e536a81fbc1bd16");

/*
shopify.product.list({ limit: 5 })
  .then( 
  	products => {

  		console.log("Shopify products",products)
  	}
  )
  .catch( err => console.error(err));


shopify.webhook.list({ limit: 5 })
  .then( 
  	webhooks => console.log("Shopify w",webhooks)
  )
  .catch( err => console.error(err));


/*
shopify.webhook.update(168500100,
{
	"topic": "products\/create",
    "address": "http:\/\/stark-shore-49013.herokuapp.com\/api\/webhook",
    "format": "json"
}
	)
  .then( 
  	console.log("Shopify destroy w")
  )
  .catch( err => console.error(err));

*/