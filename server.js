var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var _ = require('underscore');

console.log('starting')
server.listen(process.env.PORT || 8080);

app.use(express.static('public'));

app.get('/', function (req, res) {
	console.log('requested')
  res.sendFile(path.join(__dirname, 'public', '/index.html'));
});

app.get('/admin', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', '/admin.html'));
});

app.get('/scoreboard', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', '/scoreboard.html'));
});

var teams = [];
var questions = [];
var categories = [];
var finalJeopardySubmissions = [];
var finalJeopardy = {};
var dung = false;

io.on('connection', function (socket) {
	
	socket.on('grab teams', function(){
		socket.emit('send teams', teams)
	});
	socket.on('team_submitted', function(data){
		var teamObj = {
			id: teams.length,
			name: data,
			score: 0
		}
		if (!_.findWhere(teams, {name: data})) {
			teams.push(teamObj);
			io.emit('new team added', {teams: teams, newTeam: teamObj});
		}
	});

	socket.on('ding', function(data){
		console.log('dinged', data)
		var teamObj = _.findWhere(teams, {name: data});
		io.emit('team buzzed', teamObj)
	});

	socket.on('open question', function(){
		dung = false;
	});

	socket.on('reset', function(){
		dung = false;
		teams = [];
		questions = [];
		categories = [];
		finalJeopardySubmissions = [];
		finalJeopardy = {};
	});

	// socket.emit('updateQuestions', {categories: categories, questions: questions, finalJeopardy: finalJeopardy});

	socket.on('saveQuestions', function(questionsObj){
		console.log('received questions', questionsObj)
		categories = questionsObj.categories;
		questions = questionsObj.questions;
		finalJeopardy = questionsObj.finalJeopardy;
	});

	socket.on('question selected', function(questionObj){
		io.emit('currentQuestion', questionObj);
	});

	socket.on('update score', function(teamObj){
		teams.forEach(function(team){
			if (team.name == teamObj.name) {
				team.score = teamObj.score
			}
		});
		io.emit('emit score update', teams);
		io.emit('unhighlight', teamObj);
	});

	socket.on('final jeopardy', function(fj){
		io.emit('trigger final jeopardy', fj)
	});

	socket.on('submit final', function(finalJeopardyObj){
		var team = _.findWhere(teams, {name: finalJeopardyObj.team});
		finalJeopardyObj.id = team.id;
		finalJeopardyObj.score = team.score;
		finalJeopardySubmissions.push(finalJeopardyObj);
		finalJeopardySubmissionsCompress = _.uniq(finalJeopardySubmissions, function(item, key, id) { 
    	return item.id;
		});
		finalJeopardySubmissionsCompress = _.sortBy(finalJeopardySubmissionsCompress, 'id')
		io.emit('final jeopardy array', finalJeopardySubmissionsCompress);
	});

	socket.on('evaluate final answer', function(finalJeopardyObj){
		io.emit('relay final', finalJeopardyObj);
	});


});