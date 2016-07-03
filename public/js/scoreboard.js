var dinger = {
	scoreboardSquare: $('.scoreboardSquare'),
	connectedTeams: [],
	categories: [],
	questions: [],
	connectToSocket: function(){
		var socket = io.connect('http://localhost:8080');
		this.socket = socket;
		dinger.turnOnListeners();
		dinger.getTeams();
	},
	turnOnListeners: function(){
		dinger.socket.on('new team added', function(teamObj){
			teamObj.points = 0;
			dinger.connectedTeams.push(teamObj);
			dinger.addTeam(teamObj.newTeam);
		});
		this.scoreboardSquare.on('click', dinger.scoreboardSquareShow);
		dinger.socket.on('updateQuestions', dinger.updateQuestions)
		dinger.updateCategories();
	},
	scoreboardSquareShow: function(){
		var thatJquery = $(this);
		var column = $(this).data('column');
		var row = $(this).data('row');
		var question = dinger.questions[column][row];
		$('#modalContainer').loadTemplate("../views/modalQuestion.html", {
			question: question.text
		},{
			complete: function(){
				$('.modalBtn').click();
				thatJquery.children().css('visibility', 'hidden');
			}
		});
	},
	updateQuestions: function(questionsObj){
		dinger.questions = questionsObj.questions;
		dinger.categories = questionsObj.categories;
		dinger.updateCategories();
	},
	getTeams: function(){
		dinger.socket.emit('grab teams');
		dinger.socket.on('send teams', function(teamArray){
			dinger.connectedTeams = teamArray
			dinger.connectedTeams.forEach(function(team){
					dinger.addTeam(team);
				});
		});
	},
	addTeam: function(teamObj) {
		$('#teams').append("<div class='col-md-2 text-center'><h2>"+teamObj.name+"</h2><h3>"+teamObj.score+"</h3></div>");
	},
	updateCategories: function(){
		dinger.categories.forEach(function(category, index){
			if(category) {
				$('#category'+index).text(category);
			}
		})
	}
}

dinger.connectToSocket();