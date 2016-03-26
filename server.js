var path = require('path');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');






var mysql      = require('mysql');

/*
var connection = mysql.createConnection({
  host     : 'www.asore.net',
  user     : 'wwwasore_socket',
  password : 'socketio1',
  database : 'wwwasore_socketio'
});

*/
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

            connection.query('INSERT INTO products SET ? ', {name: req.body.name , description: req.body.description , photo: req.body.photo}, function(err, rows, fields) {
				if (err) throw err;
			 	console.log("Product created");
				
				connection.query('SELECT * FROM products', function(err, products, fields) {
					if (err) throw err;
					res.json({ message: 'Product created!' });
					io.emit('products', products);
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


		connection.query( 'INSERT INTO comments SET ?', { author: req.body.author, text: req.body.text, product_id: req.body.product_id }, function(err, rows, fields) {
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

    	s = JSON.stringify(req.body, null, 2);

    	console.log(s);
        
        //REGISTER WEBHOOK
        connection.query('INSERT INTO webhooks SET ?',{params: s}, function(err, rows, fields) {
		  if (err) throw err;
		    res.json(rows);
		});

        //UPDATE PRODUCTS
        update_products();

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

		connection.query('INSERT INTO comments SET ?', {author: comment.author , text: comment.text, product_id: comment.product_id }, function(err, rows, fields) {
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

		connection.query('INSERT INTO products SET ? ', {name: product.name , description: product.description, photo: product.photo }, function(err, rows, fields) {
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

function update_products(){
   shopify.product.list({limit: 5})
  .then( 
  	products => {
  		products.forEach(function(entry) {
    		name = entry.title;
    		description = "";
    		if ( entry.body_html != undefined )
				description = entry.body_html;
    		shopify_id = entry.id ;
    		photo = "";
    		if (entry.image != undefined)
    			photo = entry.image.src;
    		variants = entry.variants.length;
    		price=0;
    		if (variants > 0)
    			price = entry.variants[0].price
    		shopify_updated = entry.updated_at;

    		//product = {name: name , description: description, photo: photo, shopify_id: shopify_id, variants: variants, price: price, shopify_updated: shopify_updated };

    		//console.log("PROD;:", product);

    		//Search

    		connection.query('SELECT count(*) as count, ? as name, ? as description, ? as shopify_id, ? as photo,? as variants, ? as price, ? as shopify_updated FROM products WHERE shopify_id = "'+shopify_id+'"',
    			[name,description,shopify_id,photo,variants,price,shopify_updated], function(err, products, fields) {
			  	if (err) throw err;
			  	console.log(products[0].shopify_id);
				if (products[0].count > 0){
					product_ = {name: products[0].name , description: products[0].description, photo: products[0].photo, shopify_id: products[0].shopify_id, variants: products[0].variants, price: products[0].price, shopify_updated: products[0].shopify_updated };
					connection.query('UPDATE products SET ? WHERE shopify_id = ?', 
						[product_, products[0].shopify_id], 
						function(err, rows, fields) {
						if (err) throw err;
					 	console.log("Product updated ",rows);
					});
				}else{
					product_ = {name: products[0].name , description: products[0].description, photo: products[0].photo, shopify_id: products[0].shopify_id, variants: products[0].variants, price: products[0].price, shopify_updated: products[0].shopify_updated };
					connection.query('INSERT INTO products SET ? ', 
						product_, 
						function(err, rows, fields) {
						if (err) throw err;
					 	console.log("Product created ",rows);
					});
				}

			});



    		
		});
  		//console.log("Shopify products",products[0]);
  	} 
  	
  )
  .catch( err => console.error(err));


}

update_products();

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