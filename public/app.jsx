var CommentBox = React.createClass({
	getInitialState: function () {
		return {
			comments: null
		};
	},
	loadCommentsFromServer: function() {
	    $.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {
	        this.setState({comments: data});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
  	},
  	componentDidMount2: function() {
    	this.loadCommentsFromServer();
    	setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  	},
  	componentDidMount: function() {
  		var that = this;
		this.socket = io();
		this.socket.on('comments', function (comments) {
			that.setState({ comments: comments });
		});
		this.socket.emit('fetchComments',{product_id:this.props.product});
	},
	submitComment: function (comment, callback) {
		var that = this;
		this.socket = io();
		this.socket.emit('newComment', comment, function (err) {
			if (err)
				return console.error('New comment error:', err);
			callback();
		});
	},
	render: function() {
		return (
			<div className="commentBox">
				<h3>Comments:</h3>
				<CommentList comments={this.state.comments}/>
				<CommentForm submitComment={this.submitComment} product={this.props.product}/>
			</div>
		);
	}
});
var CommentList = React.createClass({
	render: function () {
		var Comments = (<div>Loading comments...</div>);
		if (this.props.comments) {
			Comments = this.props.comments.map(function (comment) {
				return (<Comment comment={comment} />);
			});
		}
		return (
			<div className="commentList">
				{Comments}
			</div>
		);
	}
});
var Comment = React.createClass({
	render: function () {
		return (
			<div className="comment">
				<span className="author">{this.props.comment.author}</span> said:<br/>
				<div className="body">{this.props.comment.text}</div>
			</div>
		);
	}
});
var CommentForm = React.createClass({
	handleSubmit: function (e) {
		console.log("product",this.props.product);
		e.preventDefault();
		var that = this;
		var author = this.refs.author.getDOMNode().value;
		var text = this.refs.text.getDOMNode().value;
		var comment = { author: author, text: text , product_id: this.props.product };
		console.log("Saving ", comment);
		var submitButton = this.refs.submitButton.getDOMNode();
		submitButton.innerHTML = 'Posting comment...';
		submitButton.setAttribute('disabled', 'disabled');
		this.props.submitComment(comment, function (err) {
			that.refs.author.getDOMNode().value = '';
			that.refs.text.getDOMNode().value = '';
			submitButton.innerHTML = 'Post comment';
			submitButton.removeAttribute('disabled');
		});
	},
	render: function () {
		return (
			<form className="commentForm" onSubmit={this.handleSubmit}>
				<input type="text" name="author" ref="author" placeholder="Name" required /><br/>
				<textarea name="text" ref="text" placeholder="Comment" required></textarea><br/>
				<button type="submit" ref="submitButton">Post comment</button>
			</form>
		);
	}
});

/*
React.render(
	<CommentBox />,
	document.getElementById('content')
);
*/
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ProductBox = React.createClass({
	getInitialState: function () {
		return {
			products: null
		};
	},
	componentDidMount: function () {
		var that = this;
		this.socket = io();
		this.socket.on('products', function (products) {
			that.setState({ products: products });
		});
		this.socket.emit('fetchProducts');
	},
	submitProduct: function (product, callback) {
		this.socket.emit('newProduct', product, function (err) {
			if (err)
				return console.error('New product error:', err);
			callback();
		});
	},
	render: function() {
		return (
			<div className="commentBox">
				<h3>Products:</h3>
				<ProductList products={this.state.products}/>
				<ProductForm submitProduct={this.submitProduct}/>
			</div>
		);
	}
});
var ProductList = React.createClass({
	render: function () {
		var Products = (<div>Loading products...</div>);
		if (this.props.products) {
			Products = this.props.products.map(function (product) {
				return (<Product product={product} />);
			});
		}
		return (
			<div className="commentList">
				{Products}
			</div>
		);
	}
});
var Product = React.createClass({
	render: function () {
		return (
			<div className="comment">
				<img src={this.props.product.photo} width="100px" />
				<span className="author">{this.props.product.name}</span><br/>
				<div className="body">Price: {this.props.product.price} </div>
				<div dangerouslySetInnerHTML={{__html: this.props.product.description}} />
				<CommentBox product={this.props.product.id} />
			</div>
		);
	}
});
var ProductForm = React.createClass({
	handleSubmit: function (e) {
		e.preventDefault();
		var that = this;
		var name = this.refs.name.getDOMNode().value;
		var photo = this.refs.photo.getDOMNode().value;
		var description = this.refs.description.getDOMNode().value;
		var product = { name: name, description: description, photo: photo };
		var submitButton = this.refs.submitButton.getDOMNode();
		submitButton.innerHTML = 'Posting product...';
		submitButton.setAttribute('disabled', 'disabled');
		this.props.submitProduct(product, function (err) {
			that.refs.name.getDOMNode().value = '';
			that.refs.description.getDOMNode().value = '';
			that.refs.photo.getDOMNode().value = '';
			submitButton.innerHTML = 'Post product';
			submitButton.removeAttribute('disabled');
		});
	},
	render: function () {
		return (
			<form className="commentForm" onSubmit={this.handleSubmit}>
				<input type="text" name="name" ref="name" placeholder="Name" required /><br/>
				<input type="text" name="photo" ref="photo" placeholder="Photo URL" required /><br/>
				<textarea name="text" ref="description" placeholder="Description" required></textarea><br/>
				<button type="submit" ref="submitButton">Post product</button>
			</form>
		);
	}
});

React.render(
	<ProductBox/>,
	document.getElementById('content2')
);