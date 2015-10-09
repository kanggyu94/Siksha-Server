var express = require('express');
var router = express.Router();

var menu = require('../menu.js');
var information = require('../information.js');
var version = require('../version.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/menus/view', function(req, res, next) {
    menu.crawl(req, res);
});

router.get('/menus/update', function(req, res, next) {
    menu.update(req, res);
});

router.get('/menus/latest', function(req, res, next) {
    menu.latest(req, res);
});

// For android client
router.get('/version', function(req, res, next) {
    version.check(req, res);
});

router.get('/informations/view', function(req, res, next) {
    information.view(req, res);
});

router.get('/informations/update', function(req, res, next) {
    information.update(req, res);
});

router.get('/informations/latest', function(req, res, next) {
    information.latest(req, res);
});

module.exports = router;
