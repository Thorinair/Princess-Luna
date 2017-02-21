// Version
const version = "v1.3.1";

// Modules
const fs             = require("fs");
const readline       = require("readline");
const Discord        = require("discord.io");
const CronJob        = require("cron").CronJob;
const XMLHttpRequest = require("xhr2");
const jsmegahal      = require("jsmegahal");

// Load file data
const token  = require("./token.json");
const config = require("./config.json");

// Commands
var commands = {};

// Command: !gotn
commands.gotn = function(data) {
	var now = new Date();
	var found = false;

	config.show.dates.forEach(function(d) {
		if (!found) {
			var partsDate = d.split("-");
			var partsTime = config.show.time.split(":");

			var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
			if (date > now) {

				var diff = (date - now) / 60000;
				var time = {};

				time.minutes = Math.floor(diff % 60);
				diff = Math.floor(diff / 60);
				time.hours = Math.floor(diff % 24);
				time.days = Math.floor(diff / 24);

				send(data.channelID, "<@!" + data.userID + ">, next episode of Glory of The Night airs in " + parseTime(time) + " on " + date.toDateString() + " at " + config.show.time + " (UTC).");
				found = true;
			}
		}
	});	
};

// Command: !np
commands.np = function(data) {
	send(data.channelID, "<@!" + data.userID + ">, the track currently playing on PonyvilleFM is:\n*" + np + "*");
};

// Command: !hug
commands.hug = function(data) {
	if (data.data.d.mentions[0] != null && !isMentioned(bot.id, data.data)) {
		send(data.channelID, "*Gives <@!" + data.data.d.mentions[0].id + "> a big warm hug!*");
	}
	else {
		send(data.channelID, "*Gives <@!" + data.userID + "> a big warm hug!*");
	}
};

// Command: !togglenp
commands.togglenp = function(data) {
	toggle_np = !toggle_np;
	send(parseChannel("thorinair"), "Thori, I've changed the Now Playing listing to **" + toggle_np + "**.");
};

// Command: !reboot
commands.reboot = function(data) {
	send(parseChannel("thorinair"), "I'm just going to go quickly reboot myself. Be right back, Thori!");
	saveBrain();
	setTimeout(function() {
		console.log("<STOPPED>");
		process.exit();
	}, config.options.reboot.timeout * 1000);
};

// Command: !help
commands.help = function(data) {
	var reply = "";

	reply += "<@!" + data.userID + ">, here are some of the commands you can use:";
	config.commands.forEach(function(c) {
		if (!c.private)
			reply += "\n`" + c.command + "` " + c.help;
	});
	reply += "\nYou can also talk with me by mentioning me in the chat.";

	send(data.channelID, reply);
};

// Status Variables
var jobs      = [];
var messages  = [];
var started   = false;
var toggle_np = false;
var np        = "";

// Persistant Objects
var bot;
var brain;

/*
 * Parses a given channel name to retrieve the correct ID.
 * @param  name  The input name to look for.
 * @return       ID of the channel.
 */
function parseChannel(name) {
	var found = false;
	var id = null;

	config.channels.forEach(function(c) {
		if (c.name == name && !found) {
			id = c.id;
		}
	});

	return id;
}

/*
 * Parses a given date to a more readable format.
 * @param  date  The input date, this is not the JS Date object.
 * @return       Formatted string.
 */
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

/*
 * Sends a message to a channel on Discord.
 * @param  id       ID of the channel to send to.
 * @param  message  String message to send.
 */
function send(id, message) {
	var channel = "unknown";
	config.channels.forEach(function(c) {
		if (c.id == id) {
			channel = c.name;
		}
	});
	console.log("> I'm sending the following message to #" + channel + ": \"" + message + "\"");
	bot.sendMessage({
        "to": id,
        "message": message
    });	
}

/*
 * Parses whether a certain ID was mentioned.
 * @param  id    ID to check the mentions of.
 * @param  data  Discord's event data.
 * @return       Boolean whether the ID was mentioned.
 */
function isMentioned(id, data) {
	var mentioned = false;
	data.d.mentions.forEach(function(m) {
		if (m.id == id)
			mentioned = true;
	});
	return mentioned;
}

/*
 * Processes the channel whitelist and checks if the channel is whitelisted.
 * @param  channelID    ID of the channel to check whitelist of.
 * @param  doWhitelist  Whether the processing should even be done.
 * @return              Boolean whether the channel is whitelisted.
 */
function processWhitelist(channelID, doWhitelist) {
	if (!doWhitelist) {
		return true;
	}
	var okay = false;
	config.whitelist.list.forEach(function(c) {
		if (parseChannel(c) == channelID)
			okay = true;
	});
	return okay;
}

/*
 * Opens the brain data from a file.
 */
function openBrain() {
	if (fs.existsSync(config.brain.path)) {
		readline.createInterface({
		    "input": fs.createReadStream(config.brain.path),
		    "terminal": false
		}).on("line", function(line) {
			messages.push(line);
			brain.addMass(line.replace(/<.*>/g, ""));
		});
	}
}

/*
 * Saves the brain data to a file.
 */
function saveBrain() {
	var file = fs.createWriteStream(config.brain.path);

	file.on("error", function(err) {
		console.log("I am having some trouble saving my brain. Here is more info: " + err);
	});

	messages.forEach(function(m) {
		file.write(m + "\n", "utf-8");
	});

	file.end();
}

/*
 * Loads all announcements from the config.
 */
function loadAnnouncements() {

	// Long Message
	var partsLong = config.show.announce.long.split(":");
	var long = (parseInt(partsLong[0]) * 60 + parseInt(partsLong[1])) * 60000;

	var dateLong = {};
	dateLong.hours 	 = parseInt(partsLong[0]);
	dateLong.minutes = parseInt(partsLong[1]);

	// Short Message
	var partsShort = config.show.announce.short.split(":");
	var short = (parseInt(partsShort[0]) * 60 + parseInt(partsShort[1])) * 60000;

	var dateShort = {};
	dateShort.hours   = parseInt(partsShort[0]);
	dateShort.minutes = parseInt(partsShort[1]);

	// After Message
	var partsAfter = config.show.announce.after.split(":");
	var after = - (parseInt(partsAfter[0]) * 60 + parseInt(partsAfter[1])) * 60000;

	var messageLong  = "@everyone, a new episode of Glory of The Night starts in " + parseTime(dateLong) + "! Don't forget to tune in to PonyvilleFM! <https://ponyvillefm.com>";
	var messageShort = "@here, Glory of The Night begins in only " + parseTime(dateShort) + "! Tune in to PonyvilleFM now! I suggest using the OGG stream for best sound quality. https://ponyvillefm.com/player";
	var messageNow   = "@here, Glory of The Night is now live! Tune in to PonyvilleFM using the link above!";
	var messageAfter = "@here, the show is over for tonight. Thank you all who joined in! You can relisten to the show as soon as Thorinair uploads it to his Mixcloud.";

	console.log("I'm loading all of the upcoming show dates...");
	config.show.dates.forEach(function(d) {

		var partsDate = d.split("-");
		var partsTime = config.show.time.split(":");

		var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
		console.log("- Loading air date: " + date);

		// Long air-time announcement.
		var jobLong = new CronJob(new Date(date - long), function() {
				send(parseChannel("announcements"), messageLong);
			}, function () {}, true);
		//console.log("  Long:  " + new Date(date - long));

		// Short air-time announcement.
		var jobShort = new CronJob(new Date(date - short), function() {
				send(parseChannel("announcements"), messageShort);
			}, function () {}, true);
		//console.log("  Short: " + new Date(date - short));

		// Now air-time announcement.
		var jobNow = new CronJob(new Date(date), function() {
				send(parseChannel("announcements"), messageNow);
				toggle_np = true;
			}, function () {}, true);
		//console.log("  Now:   " + new Date(date));

		// After air-time announcement.
		var jobAfter = new CronJob(new Date(date - after), function() {
				send(parseChannel("announcements"), messageAfter);
				toggle_np = false;
			}, function () {}, true);
		//console.log("  After: " + new Date(date - after));

		jobs.push(jobLong);
		jobs.push(jobShort);
		jobs.push(jobNow);
		jobs.push(jobAfter);
	});
}

/*
 * Loads the brain data, or creates new.
 */
function loadBrain() {
	brain = new jsmegahal(config.brain.markov, config.brain.default);

	if (fs.existsSync(config.brain.path)) {
		console.log("A brain already seems to exit. Loading it now...");
		openBrain();
		console.log("I've finished loading my brain.");
	}
	else {
		saveBrain();
		console.log("I don't seem to have a brain. I have created a new one.");
	}
}

/*
 * Loads the discord bot.
 */
function loadBot() {
	bot = new Discord.Client({
	    "token": token.value,
	    "autorun": true
	});
	 
	bot.on("ready", function() {
		bot.setPresence(config.opts);
	    console.log("I've successfully joined Discord. My name is " + bot.username + " with ID #" + bot.id + ".");
	    if (!started) {
	    	started = true;
	    	send(parseChannel("thorinair"), "Hey Thori, I'm back! My current version is " + version + ".");

	    	loopNowPlaying();
	    	loopBrainSave();
	    }
	});

	bot.on("guildMemberAdd", function(user) {
		console.log("New user, \"" + user.username + "\" has joined our server! I'm promoting them to Children of The Night!");
		send(parseChannel("general"), "**My children, welcome <@!" + user.id + "> to our beautiful night!**");
		bot.addToRole( {
			"serverID": user.guild_id,
			"userID": user.id,
			"roleID": "277564526940127243"
		}, function(err, response) {
	  		if (err) console.error("Something bad has happened during the promotion. Here is more info: " + err);
		});
	});

	bot.on("message", function(user, userID, channelID, message, data) {

	    var packed = {};
	    packed.user      = user;
	    packed.userID    = userID;
	    packed.channelID = channelID;
	    packed.message   = message;
	    packed.data      = data;

	    var nocommand = true;
	    var command = message.replace(/ <.*>/g, "");

	    config.commands.forEach(function(c) {
	    	if (command == c.command && nocommand) {
	    		if (c.private) {
	    			if (userID == parseChannel("thorinair")) {
			    		commands[c.method](packed);
			    		nocommand = false;
	    			}
	    		}
	    		else {
		    		commands[c.method](packed);
		    		nocommand = false;
		    	}
	    	}
	    });

	    if (nocommand) {
		    // When the bot is mentioned.
		    if (isMentioned(bot.id, data)) {
		    	send(channelID, "<@!" + userID + "> " + brain.getReplyFromSentence(message));
		    }
		    // All other messages.
		    else if (data.d.author.id != bot.id) {
		    	if (processWhitelist(channelID, config.whitelist.do)) {
		    		brain.addMass(message.replace(/<.*>/g, ""));
		    		messages.push(message);
		    	}
		    }
		}
	});

	bot.on("disconnect", function(erMsg, code) {
	    console.log("I seem to have disconnected from Discord... Reconnecting.");
	    bot.connect();
	});
}

/*
 * Loops to continuously retrieve now playing data.
 */
function loopNowPlaying() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", config.nowplaying.url, true);

	xhr.onreadystatechange = function () { 
	    if (xhr.readyState == 4 && xhr.status == 200) {
	        var response = JSON.parse(xhr.responseText);
	        if (np != response.one.nowplaying) {
	        	np = response.one.nowplaying;
	        	if (toggle_np)
	    			send(parseChannel("gotn"), "**Now playing:** " + np);
	        }
	    }
	}

	xhr.send();
	setTimeout(loopNowPlaying, config.nowplaying.timeout * 1000);
}

/*
 * Loops to continuously save brain data.
 */
function loopBrainSave() {
	saveBrain();
	setTimeout(loopBrainSave, config.brain.timeout * 1000);
}

// Start the bot.
console.log("<STARTED>");
loadAnnouncements();
loadBrain();
loadBot();