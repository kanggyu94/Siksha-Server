/**
 * Wednesday, August 24, 2016
 * Ilhyun Jo
 * 
 * define http verbs for rating a meal and retrieving rating info
 * 
 * TODO: Make some better names for routes 
 **/

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Meal = require('../models/meal.js').model;
var menu = require('../menu.js');

router.get('/all', function (req, res) {
	var db = mongoose.connect('mongodb://localhost/meal').connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		Meal.find(function(error, mealList) {
			if(error) console.error.bind(console, 'connection error:');
			else res.send(mealList);
			mongoose.disconnect();
		});;
	});
});

router.get('/view', function (req, res) {
	db = mongoose.connect('mongodb://localhost/meal').connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		menu.crawl(req.query.date, function(resultString) {
			var result = JSON.parse(resultString);
			var menuDict = {};
			var menuNames = [];
			var ratedMenu = [];
			for(var i in result.data) {
				var restaurant = result.data[i];
				for(var j in restaurant.foods) {
					var meal = restaurant.foods[j];
					menuNames.push(meal.name);
					menuDict[meal.name] = restaurant.restaurant;
				}
			}
			Meal.find({ name: {$in: menuNames} }, function (error,doc) {
				if(error) console.error.bind(console, 'Meal.findOne error:');
				else { 
					for(var k in doc) {
						if(doc[k].restaurant === menuDict[doc[k].name]) {
							ratedMenu.push(doc[k]);
						}
					}
					for(var l in ratedMenu) {
						var ratedMeal = ratedMenu[l];
						if(indexRestaurant(ratedMeal.restaurant, result.data) > -1) {
							var foodArray = result.data[indexRestaurant(ratedMeal.restaurant, result.data)].foods;
							console.log("indexRestaurant(ratedMeal.restaurant, result.data):"+indexRestaurant(ratedMeal.restaurant, result.data));
							console.log("foodArray[0]: " + foodArray[0]);
							if(indexFood(ratedMeal.name, foodArray) > -1) {
								var unratedMeal = foodArray[indexFood(ratedMeal.name, foodArray)];
								console.log(unratedMeal);
								unratedMeal["rating"] = ratedMenu[l].rating;
							}
						}
					}
					res.send(result);
					mongoose.disconnect();
				}
			});
		});
	});
});

function indexRestaurant(str, list) {
	for (var i in list) {
		console.log("restaurant: " + list[i].restaurant);
		if (list[i].restaurant === str) {
			return i;
		}
	}
	return -1;
}

function indexFood(str, list) {
	for (var i in list) {
		if(list[i].name === str) {
			return i;
		}
	}
	return -1;
}

router.get('/:restaurant', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		Meal.find({ restaurant: req.params.restaurant }, function(error, mealList) {
			if(error) console.error.bind(console, 'Meal.find error:');
			else res.send(mealList);
			mongoose.disconnect();
		});
	});
});

router.get('/:restaurant/:meal', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.on('open', function () {
		var rating;
		var numberOfRatings;
		Meal.findOne({ name: req.params.meal, restaurant: req.params.restaurant }, function (error, meal) {
			if(error) console.error.bind(console, 'Meal.findOne error:');
			else if(!meal) { rating = 0; numberOfRatings = 0 }
			else { rating = meal.rating; numberOfRatings = meal.numberOfRatings }
			console.log(meal);
			res.send({
				meal: req.params.meal,
				restaurant: req.params.restaurant,
				rating: rating,
				numberOfRatings: numberOfRatings
			});
			mongoose.disconnect();
		});
	});
});

router.post('/', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		Meal.findOne({ name: req.body.meal, restaurant: req.body.restaurant}, function (err, meal) {
			var rating;
			if(!meal) {
				var newMeal = new Meal({
					name: req.body.meal,
					restaurant: req.body.restaurant,
					rating: req.body.rating,
					numberOfRatings: '1'
				});
				newMeal.save( function( err, meal) {
					if(err) return console.error(err);
					console.dir(meal);
					mongoose.disconnect();
				});
				rating = newMeal.rating;
			} else {
				meal.rating = (Number(meal.numberOfRatings) * Number(meal.rating) + Number(req.body.rating)) / (Number(meal.numberOfRatings) + 1);
				meal.numberOfRatings += 1;
				meal.save(function (err, meal) {
					if(err) return console.error(err);
					mongoose.disconnect();
				});
				rating = meal.rating;
			}
			res.json( { rating: rating } );
		});
	});
});

module.exports = router;
