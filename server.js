var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var _ = require('underscore');

server.listen(8080);

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
		teams.push(teamObj);
		io.emit('new team added', {teams: teams, newTeam: teamObj});
	});

	socket.on('ding', function(data){
		if (!dung) {
			var teamObj = _.findWhere(teams, {name: data});
			io.emit('team buzzed', teamObj)
			dung = true;
		}
	});

	socket.on('reset', function(){
		dung = false;
	});

	socket.emit('updateQuestions', {categories: categories, questions: questions});
	socket.on('saveQuestions', function(questionsObj){
		console.log('received questions', questionsObj)
		categories = questionsObj.categories
		questions = questionsObj.questions
	});

});