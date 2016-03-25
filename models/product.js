var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ProductSchema   = new Schema({
    name: String,
    comments: [{ body: String, date: Date }],
  	date: { type: Date, default: Date.now },
  	meta: {
    	votes: Number,
    	favs:  Number
  	}
});

module.exports = mongoose.model('Product', ProductSchema);