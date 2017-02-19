var Discord = require('discord.io');
var CronJob = require('cron').CronJob;
var XMLHttpRequest = require('xhr2');

var token = require("./token.json");
var show = require("./show.json");

// Version
var version = "v1.0.2";

// Server Channels
var channels = {};
channels["announcements"] 	= "277568055393910785";
channels["gotn"] 			= "277568155344175104";
channels["general"] 		= "277563243050827776";
channels["luna"] 			= "277572380442886146";
channels["music"] 			= "277840722592399362";
channels["offtopic"] 		= "277573384496480257";
channels["thorinair"]		= "81244981343297536";

var url_nowplaying = "https://ponyvillefm.com/data/nowplaying";

var timeout_nowplaying = 5;

var jobs = [];

var started = false;

var bot;
var np = "";
var toggle_np = false;

function parseTime(date) {
	var string = "";

	if (date.days != null && date.days != 0) {
		string += date.days + " day";
		if (date.days > 1)
			string += "s";
	}

	if ((date.days != null && date.days != 0) && (date.hours != null && date.hours != 0) && (date.minutes == null || date.minutes == 0))
		string += " and ";
	else if ((date.days != null && date.days != 0) && (date.hours != null && date.hours != 0) && (date.minutes != null && date.minutes != 0))
		string += ", ";

	if (date.hours != null && date.hours != 0) {
		string += date.hours + " hour";
		if (date.hours > 1)
			string += "s";
	}

	if ((date.hours != null && date.hours != 0) && (date.minutes != null && date.minutes != 0))
		string += " and ";
	else if ((date.days != null && date.days != 0) && (date.hours == null || date.hours == 0) && (date.minutes != null && date.minutes != 0))
		string += " and ";

	if (date.minutes != null && date.minutes != 0) {
		string += date.minutes + " minute";
		if (date.minutes > 1)
			string += "s";
	}

	return string;
}

function send(id, message) {
	var channel = "unknown";
	for (var k in channels) {
		if (channels.hasOwnProperty(k) && channels[k] == id) {
			channel = k;
		}
	}
	console.log("Sending message to #" + channel + ": \"" + message + "\"");
	bot.sendMessage({
        "to": id,
        "message": message
    });	
}

function loadAnnouncements() {

	// Long Message
	var partsLong = show.announce.long.split(':');
	var long = (parseInt(partsLong[0]) * 60 + parseInt(partsLong[1])) * 60000;

	var dateLong = {};
	dateLong.hours 	 = parseInt(partsLong[0]);
	dateLong.minutes = parseInt(partsLong[1]);

	// Short Message
	var partsShort = show.announce.short.split(':');
	var short = (parseInt(partsShort[0]) * 60 + parseInt(partsShort[1])) * 60000;

	var dateShort = {};
	dateShort.hours   = parseInt(partsShort[0]);
	dateShort.minutes = parseInt(partsShort[1]);

	// After Message
	var partsAfter = show.announce.after.split(':');
	var after = - (parseInt(partsAfter[0]) * 60 + parseInt(partsAfter[1])) * 60000;

	var messageLong  = "@everyone, a new episode of Glory of The Night starts in " + parseTime(dateLong) + "! Don't forget to tune in to PonyvilleFM! <https://ponyvillefm.com>";
	var messageShort = "@everyone, Glory of The Night begins in only " + parseTime(dateShort) + "! Tune in to PonyvilleFM now! I suggest using the OGG stream for best sound quality. https://ponyvillefm.com/player";
	var messageNow   = "@everyone, Glory of The Night is now live! Tune in to PonyvilleFM using the link above!";
	var messageAfter = "@everyone, The show is over for tonight. Thank you all who joined in! You can relisten to the show as soon as Thorinair uploads it to his Mixcloud.";

	show.dates.forEach(function(d, i) {

		var partsDate = d.split('-');
		var partsTime = show.time.split(':');

		var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
		console.log("  Loading air date: " + date);

		// Long air-time announcement.
		var jobLong = new CronJob(new Date(date - long), function() {
				send(channels["announcements"], messageLong);
			}, function () {}, true);
		//console.log("  Long:  " + new Date(date - long));

		// Short air-time announcement.
		var jobShort = new CronJob(new Date(date - short), function() {
				send(channels["announcements"], messageShort);
			}, function () {}, true);
		//console.log("  Short: " + new Date(date - short));

		// Now air-time announcement.
		var jobNow = new CronJob(new Date(date), function() {
				send(channels["announcements"], messageNow);
				toggle_np = true;
			}, function () {}, true);
		//console.log("  Now:   " + new Date(date));

		// After air-time announcement.
		var jobAfter = new CronJob(new Date(date - after), function() {
				send(channels["announcements"], messageAfter);
				toggle_np = false;
			}, function () {}, true);
		//console.log("  After: " + new Date(date - after));

		jobs.push(jobLong);
		jobs.push(jobShort);
		jobs.push(jobNow);
		jobs.push(jobAfter);
	});
}

function loadBot() {
	bot = new Discord.Client({
	    "token": token.value,
	    "autorun": true
	});
	 
	bot.on('ready', function() {
	    console.log(bot.username + " - (" + bot.id + ") Started.");
	    if (!started) {
	    	started = true;
	    	send(channels["thorinair"], "Hey Thori, I'm back! My current version is " + version + ".");

	    	loopNowPlaying();
	    }
	});

	bot.on('guildMemberAdd', function(user) {
		console.log("New user: " + user.username + " Promoting them to Children of The Night!");
		send(channels["general"], "**My children, welcome <@!" + user.id + "> to our beautiful night!**");
		bot.addToRole( {
			"serverID": user.guild_id,
			"userID": user.id,
			"roleID": "277564526940127243"
		}, function(err, response) {
	  		if (err) console.error(err);
		});
	});

	bot.on('message', function(user, userID, channelID, message, event) {
	    if (message == "!gotn") {
			var now = new Date();
			var next = false;

			show.dates.forEach(function(d, i) {
				if (!next) {
					var partsDate = d.split('-');
					var partsTime = show.time.split(':');

					var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
					if (date > now) {

						var diff = (date - now) / 60000;
						var time = {};

						time.minutes = Math.floor(diff % 60);
						diff = Math.floor(diff / 60);
						time.hours = Math.floor(diff % 24);
						time.days = Math.floor(diff / 24);

	    				send(channelID, "<@!" + userID + ">, next episode of Glory of The Night airs in " + parseTime(time) + " on " + date.toDateString() + " at " + show.time + " (UTC).");
						next = true;
					}
				}
			});	  
	    }
	    else if (message == "!np") {
	    	send(channelID, "<@!" + userID + ">, the track currently playing is: "+ np);
	    }
	    else if (message == "!toggle np") {
	    	if (userID == channels["thorinair"]) {
	    		toggle_np = !toggle_np;
	    		send(channels["thorinair"], "Thori, I've changed the Now Playing listing to **" + toggle_np + "**.");
	    	}
	    }
	});

	bot.on('disconnect', function(erMsg, code) {
	    console.log('Disconnected from Discord with code ' + code + ' for reason: ' + erMsg);
	    bot.connect();
	});
}


function loopNowPlaying() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url_nowplaying, true);

	xhr.onreadystatechange = function () { 
	    if (xhr.readyState == 4 && xhr.status == 200) {
	        var response = JSON.parse(xhr.responseText);
	        if (np != response.free.nowplaying) {
	        	np = response.free.nowplaying;
	        	if (toggle_np)
	    			send(channels["gotn"], "**Now playing:** " + np);
	        }
	    }
	}

	xhr.send();
	setTimeout(loopNowPlaying, timeout_nowplaying * 1000);
}

loadAnnouncements();
loadBot();