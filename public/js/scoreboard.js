var dinger = {
	firebase: firebase.database(),
	scoreboardSquare: $('.scoreboardSquare'),
	connectedTeams: [],
	categories: [],
	questions: [],
	finalTimer: 60,
	connectToSocket: function(){
		var socket = io.connect('https://sheltered-bayou-67211.herokuapp.com');
		// var socket = io.connect('http://localhost:8080');
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
		// dinger.socket.on('updateQuestions', dinger.updateQuestions)
		dinger.firebase.ref('questions/').on('value', function(data){
			dinger.categories = data.val().categories;
			dinger.questions = data.val().questions;
			dinger.updateCategories();
		});
		dinger.updateCategories();
		dinger.socket.on('emit score update', dinger.addAllTeams);
		dinger.socket.on('team buzzed', dinger.highlightDinger);
		dinger.socket.on('unhighlight', dinger.unhighlightDinger);
		dinger.socket.on('trigger final jeopardy', dinger.triggerFinalJeopardy)
		dinger.socket.on('final jeopardy array', dinger.updateFinal);
	},
	highlightDinger: function(teamObj){
		$('#teams div[data-id="'+ teamObj.id +'"]').css('background', '#EAA77E');
		dinger.startCounterBars()
	},
	unhighlightDinger: function(teamObj){
		$('#teams div[data-id="'+ teamObj.id +'"]').css('background', 'inherit');
		dinger.resetCounter();
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
				dinger.socket.emit('question selected', question);
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
		$('#teams').append("<div class='col-md-2 text-center' data-id='" + teamObj.id +"'><h2>"+teamObj.name+"</h2><h3>"+teamObj.score+"</h3></div>");
	},
	updateCategories: function(){
		dinger.categories.forEach(function(category, index){
			if(category) {
				$('#category'+index).text(category);
			}
		})
	},
	addAllTeams: function(teams){
		$('#teams').empty();
		dinger.connectedTeams = teams;
		dinger.connectedTeams.forEach(function(team){
			dinger.addTeam(team);
		});
		dinger.unhighlightDinger();
	},
	triggerFinalJeopardy: function(finalJeopardyObj){
		$('#modalContainer').loadTemplate("../views/modalFinal.html", {
			category: finalJeopardyObj.category,
			question: finalJeopardyObj.question
		},{
			complete: function(){
				var step = 1;
				$('.modalBtn').click();
				$(document).keydown(function(e){
			    if (e.keyCode == 32) {
						e.preventDefault()
						if (step == 1){
							$('#questionContent').css('height', 'initial');
				    	$('#finalCategory').hide();
				    	$('#finalQuestion').removeClass('hide');
						} else if (step == 2) {
							var audio = new Audio('../audio/finalJep.mp3');
							audio.play();
							dinger.triggerTimer = setInterval(function(){
								dinger.startTimer(dinger.finalTimer);
							}, 1000)
						} else if (step == 3) {
							dinger.showFinalJeopardyAnswers(0);
						}
			    	step++
			    }
				});
			}
		});
	},
	updateFinal: function(finalArray){
		dinger.finalArray = finalArray;
	},
	showFinalJeopardyAnswers: function(index){
		$('.modal-backdrop').hide(); 
		$('#questionModal').hide()
		$('#modalContainer').empty();
		var finalObj = dinger.finalArray[index]
		$('#modalContainer').loadTemplate("../views/modalFinalShow.html", {
			answer: finalObj.solution, //answer goes here
			wager: finalObj.wager //wager goes here
		}, {
			complete: function(){
				var step = 1;
				$('.modalBtn').click();
				$(document).keydown(function(e){
			    if (e.keyCode == 32) {
						e.preventDefault()
						if (step == 1){
							$('#finalWager').removeClass('hide');
							dinger.socket.emit('evaluate final answer', finalObj)
							step++
						} else if (step == 2) {
							dinger.nextFinal(index)
							step = 1
						} else {
							return
						}
			    }
				});
			}
		})
	},
	nextFinal: function(currentIndex){
		currentIndex++
		console.log(dinger.finalArray.length)
		if (currentIndex == dinger.finalArray.length) {
			dinger.finalWinner();
		} else {
			dinger.showFinalJeopardyAnswers(currentIndex);
		}
	},
	finalWinner: function(){
		$('.modal-backdrop').hide(); 
		$('#questionModal').modal('hide');
		$('#questionModal').hide();
		var sortByWinners = _.sortBy(dinger.connectedTeams, 'score');
		console.log(sortByWinners)
		$('#modalContainer').loadTemplate("../views/modalFinalShow.html", {
			answer: "Winning Team is: " + sortByWinners[sortByWinners.length - 1].name
		}, {
			complete: function(){
				$('.modalBtn').click();
			}
		})
	},
	startTimer: function(time){
		if (time == 0) {
			clearInterval(dinger.triggerTimer);
			return
		}
		time--
		dinger.finalTimer = time;
		$('#timer').text(time)
	},
	startCounterBars: function(){
		var count = 5;
		dinger.barsCounter = setInterval(function(){
			$('#'+count).css('visibility', 'hidden');
			count--;
			if (count == 0) {
				var audio = new Audio('../audio/timeup.mp3');
				audio.play();
				dinger.socket.emit('times up');
			}
		}, 1250);
	},
	resetCounter: function(){
		$('.countdownBars').css('visibility', 'visible');
		clearInterval(dinger.barsCounter);
	}
}

dinger.connectToSocket();