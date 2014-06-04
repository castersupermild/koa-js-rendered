var config = require('config'),
    Spooky = require('spooky'),
    logger = require('../util/log'),
    redisClient = require('../util/redis');

var casperConf = config.casper;

function Rendered() {
    this.maxRetry = config.maxRetry;
}

Rendered.prototype._getHtml = function (url) {
    return function(next) {
        var start = new Date();
        var spooky = new Spooky({
            child: {
                transport: 'http'
            },
            casper: {
                logLevel: casperConf.logLevel,
                timeout: casperConf.timeout
            }
        }, function (err) {
            logger.info('spooky start: ' + url);
            spooky.start(url);
            spooky.then(function () {
                this.emit('complete', this.getHTML());
            });
            spooky.run();
        });

        spooky.on('error', function (err, stack) {
            logger.error(err);
            // TODO 本来は第1引数にエラーオブジェクトをセットして例外を発生させるのが正しいはず.
            next(null, null);
            this.removeAllListeners();
            // TODO exitすると終了してしまう..
            // this.exit();
        });

        spooky.on('complete', function (html) {
            next(null, html);
            this.removeAllListeners();
            logger.info('spooky end: ' + url + ', time spent: ' + (new Date() - start) + 'ms.');
            this.exit();
        });
    };
};

Rendered.prototype.normalizeUrl = function (url) {
    var array = url.split('?');
    if (array.length === 1) {
        return url;
    }
    return array[0] + '?' + array[1].split('&').sort().join('&');
};

var EMPTY_RESPONSE = '<html><head></head><body></body></html>';
Rendered.prototype.getHtml = function *(url) {
    var normalizedUrl = this.normalizeUrl(url);
    var cache = yield redisClient.getWithPrefix(normalizedUrl);
    if (cache) {
        logger.info('get html from redis, url: ' + normalizedUrl);
        return cache;
    }

    var html;
    for (var i=0; i < this.maxRetry; i++) {
        logger.info('get html from www, url: ' + normalizedUrl + ', count: ' + (i + 1));
        html = yield this._getHtml(normalizedUrl);
        if (html && html !== EMPTY_RESPONSE) {
            break;
        }
    }
    if (!html || html === EMPTY_RESPONSE) {
        logger.info('failed to get html from www, url: ' + normalizedUrl);
        return;
    }
    yield redisClient.setWithPrefix(normalizedUrl, html);
    return html;
};

module.exports = new Rendered();