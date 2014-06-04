var config = require('config'),
    log4js = require('log4js');

log4js.configure({
    "appenders": config.log.appenders}
);
var logger = log4js.getLogger(config.log.type);
logger.setLevel(config.log.level);

module.exports = logger;