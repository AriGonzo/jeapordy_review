var dinger = {
	connectedTeams: [],
	categories: [],
	questions: [],
	finalJeopardy: {},
	templateContainer: $('#templateContainer'),
	connectToSocket: function(){
		var socket = io.connect('http://AriGonzo.local:8080');
		this.socket = socket;
		dinger.turnOnListeners();
		dinger.getTeams();
	},
	showTeamsAdmin: function(){
		dinger.templateContainer.loadTemplate("../views/teamsMain.html", {
			team_name: dinger.teamName
		}, {
			complete: function(){
				dinger.getTeams();
				dinger.addAllTeams();
			}
		});
	},
	addAllTeams: function(teams){
		if (!teams) { teams = dinger.connectedTeams}
		$('#teams').empty();
		console.log(dinger.connectedTeams)
		dinger.connectedTeams = teams;
		dinger.connectedTeams.forEach(function(team){
			dinger.addTeam(team);
		});
	},
	showQuestionsAdmin: function(){
		dinger.templateContainer.loadTemplate("../views/questionsPage.html", {
			category0: dinger.categories[0],
			category1: dinger.categories[1],
			category2: dinger.categories[2],
			category3: dinger.categories[3],
			category4: dinger.categories[4],
			category5: dinger.categories[5],
			finalJeopardyCategory: dinger.finalJeopardy.category
		} , {
			complete: function(){
				$('.editQuestions').on('click', function(){
					var index = $(this).attr('data-index');
					dinger.editQuestions(dinger.questions[index], index);
				});
				$('#finalJeopardyEdit').on('click', dinger.editFinalJeopardy)
			}
		})
	},
	editQuestions: function(questionArray, index){
		if (!questionArray) { questionArray = []; }
		$('#modalContainer').loadTemplate("../views/modalQuestionsEdit.html", {
			category: dinger.categories[index],
			question1: questionArray[0] ? questionArray[0].text : "",
			question2: questionArray[1] ? questionArray[1].text : "",
			question3: questionArray[2] ? questionArray[2].text : "",
			question4: questionArray[3] ? questionArray[3].text : "",
			question5: questionArray[4] ? questionArray[4].text : ""
		}, {
			complete: function(){
				$('#modalBtn').click();
				$('#saveChanges').on('click', function(){
					var questions = [{
						text: $('#question1').val().trim(),
						value: 100
					}, { 
						text: $('#question2').val().trim(), 
						value: 200
					}, { 
						text: $('#question3').val().trim(), 
						value: 300 
					}, { 
						text: $('#question4').val().trim(),
						value: 400 
					}, { 
						text: $('#question5').val().trim(), 
						value: 500 
					}];
					dinger.categories[index] = $('#categoryName').val();
					dinger.questions[index] = questions;
					dinger.saveQuestions();
				});
			}
		});
	},
	turnOnListeners: function(){
		$('#resetBtn').on('click', dinger.resetBtns);
		$('#teamsButton').on('click', dinger.showTeamsAdmin);
		$('#questionsButton').on('click', dinger.showQuestionsAdmin);
		$('#finalJeopardyBtn').on('click', dinger.triggerFinalJeopardy);
		dinger.socket.on('new team added', function(teamObj){
			dinger.connectedTeams = teamObj.teams;
			dinger.addTeam(teamObj.newTeam);
		});
		dinger.socket.on('team buzzed', dinger.handleTeamBuzz);
		dinger.socket.on('updateQuestions', dinger.updateQuestions);
		dinger.socket.on('currentQuestion', dinger.setCurrentQuestion);
		dinger.socket.on('emit score update', dinger.addAllTeams);
		dinger.socket.on('final jeopardy array', dinger.updateFinal);
		dinger.socket.on('relay final', dinger.evaluateAnswer);
	},
	handleTeamBuzz: function(teamObj){
		$('#modalContainer').loadTemplate("../views/modalDing.html", {
			team_name: teamObj.name
		},{
			complete: function(){
				$('#modalBtn').click();
				$('#wrongAnswer').on('click', function(){
					dinger.adjustScore(false, teamObj);
				});
				$('#rightAnswer').on('click', function(){
					dinger.adjustScore(true, teamObj);
				});
			}
		});
	},
	saveQuestions: function(){
		dinger.socket.emit('saveQuestions', {categories: dinger.categories, questions: dinger.questions, finalJeopardy: dinger.finalJeopardy});
		setTimeout(function(){
			$('#questionsButton').click();
		}, 300)
	},
	updateQuestions: function(questionsObj){
		dinger.questions = questionsObj.questions;
		dinger.categories = questionsObj.categories;
		dinger.finalJeopardy = questionsObj.finalJeopardy;
	},
	resetBtns: function(){
		dinger.socket.emit('reset');
	},
	getTeams: function(){
		dinger.socket.emit('grab teams');
		dinger.socket.on('send teams', function(teamArray){
			dinger.connectedTeams = teamArray
		});
	},
	addTeam: function(teamObj) {
		$('#teams').append("<div class='col-md-3 text-center'><h2>"+teamObj.name+"</h2><h3>"+teamObj.score+"</h3></div>");
	},
	setCurrentQuestion: function(questionsObj){
		dinger.currentQuestion = questionsObj;
		console.log(dinger.currentQuestion)
	},
	adjustScore: function(correctAnswer, teamObj){
		if (correctAnswer) {
			teamObj.score += dinger.currentQuestion.value;
		} else {
			teamObj.score -= dinger.currentQuestion.value;
			dinger.resetBtns();
		}
		dinger.socket.emit('update score', teamObj);
	},
	triggerFinalJeopardy: function(){
		dinger.socket.emit('final jeopardy');
	},
	editFinalJeopardy: function(){
		$('#modalContainer').loadTemplate("../views/modalFinalJeopardyEdit.html", {
			category: dinger.finalJeopardy.category,
			question: dinger.finalJeopardy.question,
		}, {
			complete: function(){
				$('#modalBtn').click();
				$('#saveChanges').on('click', function(){
					var finalJeopardy = {
						category: $('#category').val().trim(),
						question: $('#question').val().trim(),
					}
					dinger.finalJeopardy = finalJeopardy;
					dinger.saveQuestions();
				});
			}
		})
	},
	updateFinal: function(finalArray){
		dinger.finalArray = finalArray;
	},
	evaluateAnswer: function(finalJeopardyObj){
		console.log(finalJeopardyObj);
	}
}

dinger.connectToSocket();