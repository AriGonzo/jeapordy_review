var dinger = {
	connectedTeams: [],
	categories: [],
	questions: [],
	templateContainer: $('#templateContainer'),
	connectToSocket: function(){
		var socket = io.connect('http://localhost:8080');
		this.socket = socket;
		dinger.turnOnListeners();
		dinger.getTeams();
	},
	showTeamsAdmin: function(){
		dinger.templateContainer.loadTemplate("../views/teamsMain.html", {
			team_name: dinger.teamName
		}, {
			complete: function(){
				dinger.connectedTeams.forEach(function(team){
					dinger.addTeam(team);
				});
			}
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
		} , {
			complete: function(){
				$('.editQuestions').on('click', function(){
					var index = $(this).attr('data-index');
					dinger.editQuestions(dinger.questions[index], index);
				});
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
		dinger.socket.on('new team added', function(teamObj){
			dinger.connectedTeams = teamObj.teams;
			dinger.addTeam(teamObj.newTeam);
		});
		dinger.socket.on('team buzzed', dinger.handleTeamBuzz);
		$('#resetBtn').on('click', dinger.resetBtns);
		$('#teamsButton').on('click', dinger.showTeamsAdmin);
		$('#questionsButton').on('click', dinger.showQuestionsAdmin);
		dinger.socket.on('updateQuestions', dinger.updateQuestions)
	},
	handleTeamBuzz: function(teamObj){
		console.log(teamObj)
		$('#modalContainer').loadTemplate("../views/modalDing.html", {
			team_name: teamObj.name
		},{
			complete: function(){
				$('#modalBtn').click();
				$('#wrongAnswer').on('click', dinger.resetBtns)
				// $('#rightAnswer').on('click', )
			}
		});
	},
	saveQuestions: function(){
		dinger.socket.emit('saveQuestions', {categories: dinger.categories, questions: dinger.questions});
		setTimeout(function(){
			$('#questionsButton').click();
		}, 300)
	},
	updateQuestions: function(questionsObj){
		dinger.questions = questionsObj.questions;
		dinger.categories = questionsObj.categories;
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
	}
}

dinger.connectToSocket();