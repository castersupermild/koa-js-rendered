
var config = require('config'),
    logger = require('./log');

var conf = config.redis;
var redisClient = require('redis').createClient(
    conf.port,
    conf.host,
    conf.options
);
var coRedis = require('co-redis')(redisClient);

// for redis re-connect.
coRedis.on('error', function(err) {
    logger.error('error occured in redis...');
});

coRedis.setWithPrefix = function *(key, value) {
    var redisKey = conf.keyPrefix + key;
    var targetValue = value;
    if (yield this.set(redisKey, targetValue)) {
        return yield this.expire(redisKey, conf.expire);
    }
    return false;
};

coRedis.getWithPrefix = function *(key) {
    var redisKey = conf.keyPrefix + key;
    return yield this.get(redisKey);
};

module.exports = coRedis;

