var dinger = {
	templateContainer: $('#templateContainer'),
	connectToSocket: function(){
		var socket = io.connect('https://sheltered-bayou-67211.herokuapp.com');
		// var socket = io.connect('http://localhost:8080');
		this.socket = socket;
		dinger.showSignUp();
		dinger.socket.on('trigger final jeopardy', dinger.triggerFinalJeopardy)
		dinger.socket.on('emit score update', dinger.updateScore);
	},
	updateScore: function(teams){
		teams.forEach(function (team) {
			if (team.name === dinger.teamName) {
				$('#currentScore').html(team.score)
			}
		})
	},
	emitCall: function(callName){
		this.socket.on(callName, function (data) {
		  dinger.socket.emit('my other event', { my: 'data' });
		});
	},
	showSignUp: function(){
		this.templateContainer.loadTemplate("../views/signup.html")
		$(document).on('click', '#submitTeam', dinger.submitTeam)
		$(document).on('keypress', '#teamName', function(e){
			if(e.which == 13) {
				e.preventDefault()
				dinger.submitTeam()
			}
		})
	},
	showTeamPage: function(){
		this.templateContainer.loadTemplate("../views/mainView.html", {
			team_name: dinger.teamName
		});
		$(document).on('click', '#dingBtn', dinger.dingding)
	},
	submitTeam: function(){
		var teamName = $('#teamName').val();
		dinger.teamName = teamName;
		dinger.socket.emit('team_submitted', dinger.teamName);
		dinger.showTeamPage();
	},
	dingding: function(){
		dinger.socket.emit('ding', dinger.teamName);
	},
	triggerFinalJeopardy: function(finalJeopardyObj){
		$('#finalWagerSubmitContainer').removeClass('hide');
		$('#dingBtn').addClass('hide');
		$('#submitWager').on('click', dinger.submitWager);
	},
	submitWager: function(){
		$('#finalWagerSubmitContainer').addClass('hide');
		$('#finalJeopardy').removeClass('hide');
		$('#submitFinal').on('click', dinger.submitFinalJeopardy);
	},
	submitFinalJeopardy: function(){
		var solution = $('#solutionInput').val();
		var wager = $('#wager').val().replace(/[^a-zA-Z0-9 ]/g, "");
		if (solution == "" || wager == "") {
			$('.modalBtn').click();
			return
		}
		var finalJeopardyObj = {
			team: dinger.teamName,
			solution: solution,
			wager: wager
		};
		$('#finalJeopardy').hide();
		$('#thanks').removeClass('hide')
		console.log(finalJeopardyObj)
		dinger.socket.emit('submit final', finalJeopardyObj);
	}
}

dinger.connectToSocket();