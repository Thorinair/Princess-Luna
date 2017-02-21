// Version
const version = "v1.2.5";

// Modules
const fs             = require('fs');
const Discord        = require('discord.io');
const CronJob        = require('cron').CronJob;
const XMLHttpRequest = require('xhr2');
const jsmegahal      = require('jsmegahal');

// Load file data
const token  = require("./token.json");
const config = require("./config.json");

// Server Channels
var channels = {};
channels["announcements"] = "277568055393910785";
channels["gotn"]          = "277568155344175104";
channels["general"]       = "277563243050827776";
channels["luna"]          = "277572380442886146";
channels["music"]         = "277840722592399362";
channels["offtopic"]      = "277573384496480257";
channels["thorinair"]     = "81244981343297536";

// Status Variables
var jobs = [];
var started = false;
var np = "";
var toggle_np = false;
var messages = [];

var bot;
var brain;

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

function isMentioned(id, data) {
	var mentioned = false;
	data.d.mentions.forEach(function(m) {
		if (m.id == id)
			mentioned = true;
	});
	return mentioned;
}

function processWhitelist(channelID, doWhitelist) {
	if (!doWhitelist) {
		return true;
	}
	var okay = false;
	config.whitelist.list.forEach(function(c) {
		if (channels[c] == channelID)
			okay = true;
	});
	return okay;
}

function loadAnnouncements() {

	// Long Message
	var partsLong = config.show.announce.long.split(':');
	var long = (parseInt(partsLong[0]) * 60 + parseInt(partsLong[1])) * 60000;

	var dateLong = {};
	dateLong.hours 	 = parseInt(partsLong[0]);
	dateLong.minutes = parseInt(partsLong[1]);

	// Short Message
	var partsShort = config.show.announce.short.split(':');
	var short = (parseInt(partsShort[0]) * 60 + parseInt(partsShort[1])) * 60000;

	var dateShort = {};
	dateShort.hours   = parseInt(partsShort[0]);
	dateShort.minutes = parseInt(partsShort[1]);

	// After Message
	var partsAfter = config.show.announce.after.split(':');
	var after = - (parseInt(partsAfter[0]) * 60 + parseInt(partsAfter[1])) * 60000;

	var messageLong  = "@everyone, a new episode of Glory of The Night starts in " + parseTime(dateLong) + "! Don't forget to tune in to PonyvilleFM! <https://ponyvillefm.com>";
	var messageShort = "@here, Glory of The Night begins in only " + parseTime(dateShort) + "! Tune in to PonyvilleFM now! I suggest using the OGG stream for best sound quality. https://ponyvillefm.com/player";
	var messageNow   = "@here, Glory of The Night is now live! Tune in to PonyvilleFM using the link above!";
	var messageAfter = "@here, the show is over for tonight. Thank you all who joined in! You can relisten to the show as soon as Thorinair uploads it to his Mixcloud.";

	config.show.dates.forEach(function(d) {

		var partsDate = d.split('-');
		var partsTime = config.show.time.split(':');

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

function loadBrain() {
	brain = new jsmegahal(config.brain.markov, config.brain.default);

	if (fs.existsSync(config.brain.path)) {
		console.log("Loading an existing brain...");

		messages = JSON.parse(fs.readFileSync(config.brain.path, 'utf8'));
		messages.forEach(function(message) {
			brain.addMass(message.replace(/<.*>/g, ""));
		});

		console.log("Finished loading.");
	}
	else {
	    fs.writeFileSync(config.brain.path, JSON.stringify(messages), 'utf-8');
		console.log("Initialized a new brain.");
	}
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

	bot.on('message', function(user, userID, channelID, message, data) {
		// Command: !gotn
		if (message == "!gotn") {
			var now = new Date();
			var next = false;

			config.show.dates.forEach(function(d) {
				if (!next) {
					var partsDate = d.split('-');
					var partsTime = config.show.time.split(':');

					var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
					if (date > now) {

						var diff = (date - now) / 60000;
						var time = {};

						time.minutes = Math.floor(diff % 60);
						diff = Math.floor(diff / 60);
						time.hours = Math.floor(diff % 24);
						time.days = Math.floor(diff / 24);

	    				send(channelID, "<@!" + userID + ">, next episode of Glory of The Night airs in " + parseTime(time) + " on " + date.toDateString() + " at " + config.show.time + " (UTC).");
						next = true;
					}
				}
			});	  
	    }
	    // Command: !np
	    else if (message == "!np") {
	    	send(channelID, "<@!" + userID + ">, the track currently playing on PonyvilleFM is:\n*" + np + "*");
	    }
	    // Command: !help
	    else if (message == "!help") {
	    	send(channelID, "<@!" + userID + ">, here are some of the commands you can use: " +
	    		"\n`!gotn` Ask me about the time left until the next GOTN episode." +
				"\n`!np` Ask me which is the currently playing track on PonyvilleFM." +
				"\n`!help` Ask me to repeat this messsage." +
				"\nYou can also talk with me by mentioning me in the chat.");
	    }
	    // Command: !toggle np
	    else if (message == "!toggle np") {
	    	if (userID == channels["thorinair"]) {
	    		toggle_np = !toggle_np;
	    		send(channels["thorinair"], "Thori, I've changed the Now Playing listing to **" + toggle_np + "**.");
	    	}
	    }
	    // When the bot is mentioned.
	    else if (isMentioned(bot.id, data)) {
	    	send(channelID, "<@!" + userID + "> " + brain.getReplyFromSentence(message));
	    }
	    // All other messages.
	    else if (data.d.author.id != bot.id) {
	    	if (processWhitelist(channelID, config.whitelist.do)) {
	    		brain.addMass(message);
	    		messages.push(message);
	    		fs.writeFileSync(config.brain.path, JSON.stringify(messages), 'utf-8');
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
	xhr.open("GET", config.nowplaying.url, true);

	xhr.onreadystatechange = function () { 
	    if (xhr.readyState == 4 && xhr.status == 200) {
	        var response = JSON.parse(xhr.responseText);
	        if (np != response.one.nowplaying) {
	        	np = response.one.nowplaying;
	        	if (toggle_np)
	    			send(channels["gotn"], "**Now playing:** " + np);
	        }
	    }
	}

	xhr.send();
	setTimeout(loopNowPlaying, config.nowplaying.timeout * 1000);
}

loadAnnouncements();
loadBrain();
loadBot();