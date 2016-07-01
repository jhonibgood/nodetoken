var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
    name: String,
    email: String,
    password: String,
    dateAdded: {
        type: String,
        default: function() {
            return moment.utc().format();
        }
    }
});

UserSchema.pre('save', function(next) {
    var user = this;
    if (!this.isModified('password')) return next();
    bcrypt.genSalt(10, function(err, salt) {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, ()=>{}, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    })
});

UserSchema.methods.verify = function(password, callback) {
    try {
        bcrypt.compare(password, this.password, function(err, match) {
            if (err) return callback(err);
            callback(null, match);
        });
    } catch(e) {
        callback(e);
    }
};

module.exports = mongoose.model('User', UserSchema);
