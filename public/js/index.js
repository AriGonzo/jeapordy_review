var dinger = {
	templateContainer: $('#templateContainer'),
	connectToSocket: function(){
		var socket = io.connect('https://sheltered-bayou-67211.herokuapp.com');
		// var socket = io.connect('http://localhost:8080');
		this.socket = socket;
		dinger.showSignUp();
		dinger.socket.on('trigger final jeopardy', dinger.triggerFinalJeopardy)
	},
	emitCall: function(callName){
		this.socket.on(callName, function (data) {
		  dinger.socket.emit('my other event', { my: 'data' });
		});
	},
	showSignUp: function(){
		this.templateContainer.loadTemplate("../views/signup.html")
		$(document).on('click', '#submitTeam', dinger.submitTeam)
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
		$('#finalJeopardy').fadeIn();
		$('#dingBtn').addClass('hide');
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
		$('#thanks').fadeIn()
		console.log(finalJeopardyObj)
		dinger.socket.emit('submit final', finalJeopardyObj);
	}
}

dinger.connectToSocket();