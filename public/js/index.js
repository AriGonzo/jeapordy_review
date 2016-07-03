var dinger = {
	connectToSocket: function(){
		var socket = io.connect('http://localhost:8080');
		this.socket = socket;
		dinger.showSignUp();
	},
	emitCall: function(callName){
		this.socket.on(callName, function (data) {
		  console.log(data);
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
	templateContainer: $('#templateContainer'),
}

dinger.connectToSocket();