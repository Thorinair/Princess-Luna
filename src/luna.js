// Version
const version = "v1.7.0";

// Modules
const util           = require("util")
const fs             = require("fs");
const request        = require("request");
const readline       = require("readline");
const Discord        = require("discord.io");
const CronJob        = require("cron").CronJob;
const XMLHttpRequest = require("xhr2");
const jsmegahal      = require("jsmegahal");

// Load file data
const token   = require("./token.json");
const config  = require("./config.json");
const strings = require("./strings.json");

// Commands
var commands = {};

// Command: !gotn
commands.gotn = function(data) {
	var now = new Date();
	var found = false;

	config.show.dates.forEach(function(d) {
		if (!found) {
			var partsDate = d.split(config.separators.date);
			var partsTime = config.show.time.split(config.separators.time);

			var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
			if (date > now) {
				send(data.channelID, util.format(strings.commands.gotn.message, 
					mention(data.userID), 
					parseLeft(now, date)), true);
				found = true;
			}
		}
	});	
};

// Command: !np
commands.np = function(data) {
	if (np != undefined)
		send(data.channelID, util.format(strings.commands.np.message, 
			mention(data.userID), 
			np), true);
	else
		send(data.channelID, util.format(strings.commands.np.error, 
			mention(data.userID)), true);
};

// Command: !phase
commands.phase = function(data) {
	var dateNow = new Date();
	var message = "";
	var phaseNow;
	var phaseNext;

	var found = false;
	phases.forEach(function(p) {
		if (!found) {

			var datePhase = new Date(p.date + " " + p.time);
			if (datePhase > dateNow) {

				phaseNow  = parsePhase(p.phase, -1);
				phaseNext = parsePhase(p.phase, 0);

				message = util.format(strings.commands.phase.messageA, 
					mention(data.userID), 
					config.phases[phaseNow].name, 
					config.phases[phaseNow].icon,
					config.phases[phaseNext].name,
					config.phases[phaseNext].icon,
					parseLeft(dateNow, datePhase));

		    	found = true;
			}
		}
	});

	if (found) {

		if (config.phases[phaseNext].name != config.options.fullmoon) {
			found = false;
			phases.forEach(function(p) {
				if (!found) {

					var datePhase = new Date(p.date + " " + p.time);
					if (datePhase > dateNow && p.phase == config.options.fullmoon) {

						send(data.channelID, message + util.format(" " + strings.commands.phase.messageB,
							config.phases[parsePhase(config.options.fullmoon, 0)].name,
							config.phases[parsePhase(config.options.fullmoon, 0)].icon,
							parseLeft(dateNow, datePhase)), true);
				    	
				    	found = true;
					}
				}
			});
		}
	}

	if (!found) {
		send(data.channelID, util.format(strings.commands.phase.error,
			mention(data.userID)), true);
	}
};

// Command: !moon
commands.moon = function(data) {
	send(data.channelID, util.format(strings.commands.moon.messageA,
		mention(data.userID)), true);

	var download = function(uri, filename, callback) {
		request.head(uri, function(err, res, body) {
			console.log(strings.debug.commands.moon.start);

			request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
		});
	};

	download(config.options.moonurl, config.options.moonimg, function() {
		console.log(strings.debug.commands.moon.stop);

		embed(data.channelID, strings.commands.moon.messageB, config.options.moonimg, "Moon " + (new Date()) + ".png", true);
	});
};

// Command: !hug
commands.hug = function(data) {
	if (data.data.d.mentions[0] != null) {
		if (isMentioned(bot.id, data.data)) {
			send(data.channelID, strings.commands.hug.self, true);
		}
		else {
			if (data.data.d.mentions.length <= 1) {
				send(data.channelID, util.format(strings.commands.hug.single,
					mention(data.data.d.mentions[0].id)), true);
			}
			else {
				var mentions = "";
				var i;
				for (i = 0; i < data.data.d.mentions.length - 1; i++) {
					mentions += mention(data.data.d.mentions[i].id);
					if (i < data.data.d.mentions.length - 2) {
						mentions += config.separators.list;
					}
				}
				mentions += config.separators.lend + mention(data.data.d.mentions[i].id);

				send(data.channelID, util.format(strings.commands.hug.multiple,
					mentions), true);
			}
		}
	}
	else {
		send(data.channelID, util.format(strings.commands.hug.single, 
			mention(data.userID)), true);
	}
};

// Command: !kiss
commands.kiss = function(data) {
	if (data.data.d.mentions[0] != null) {
		if (isMentioned(bot.id, data.data)) {
			send(data.channelID, strings.commands.kiss.self, true);
		}
		else {
			if (data.data.d.mentions.length <= 1) {
				send(data.channelID, util.format(strings.commands.kiss.single, 
					mention(data.data.d.mentions[0].id)), true);
			}
			else {
				var mentions = "";
				var i;
				for (i = 0; i < data.data.d.mentions.length - 1; i++) {
					mentions += mention(data.data.d.mentions[i].id);
					if (i < data.data.d.mentions.length - 2) {
						mentions += config.separators.list;
					}
				}
				mentions += config.separators.lend + mention(data.data.d.mentions[i].id);

				send(data.channelID, util.format(strings.commands.kiss.multiple,
					mentions), true);
			}
		}
	}
	else {
		send(data.channelID, util.format(strings.commands.kiss.single, 
			mention(data.userID)), true);
	}
};

// Command: !togglenp
commands.togglenp = function(data) {
	toggle_np = !toggle_np;
	send(parseChannel("thorinair"), util.format(strings.commands.togglenp.message, 
		toggle_np), false);
};

// Command: !reboot
commands.reboot = function(data) {
	send(parseChannel("thorinair"), strings.commands.reboot.message, false);
	saveBrain();
	setTimeout(function() {
		console.log(strings.debug.stopped);
		process.exit();
	}, config.options.reboottime * 1000);
};

// Command: !help
commands.help = function(data) {
	var reply = "";

	reply += util.format(strings.commands.help.messageA, 
		mention(data.userID));
	config.commands.forEach(function(c) {
		if (!c.private)
			reply += util.format(strings.commands.help.messageB, 
				config.options.commandsymbol,
				c.command,
				c.help);
	});
	reply += strings.commands.help.messageC;

	send(data.channelID, reply, true);
};

// Status Variables
var jobs      = [];
var messages  = [];
var phases    = [];
var started   = false;
var toggle_np = false;
var np        = "";

// Persistant Objects
var bot;
var brain;

/*
 * Formats a mention string.
 * @param  id  ID to mention.
 * @return     String usable by Discord as a mention.
 */
function mention(id) {
	return util.format(config.options.mention, id);
}

/*
 * Expands a given number to 2 digits.
 * @param  num  Number to expand.
 * @return      String of the expanded number.
 */
function expand(num) {
	if (num < 10)
		return "0" + num;
	else
		return "" + num;
}

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

	if (string == "")
		string = "0 minutes";

	return string;
}

/*
 * Parses two given dates to return the time left and final time.
 * @param  start  Starting date.
 * @param  stop   Final date.
 * @return        String of time left and final time.
 */
function parseLeft(start, stop) {
	var diff = (stop - start) / 60000;
	var time = {};

	time.minutes = Math.floor(diff % 60);
	diff = Math.floor(diff / 60);
	time.hours = Math.floor(diff % 24);
	time.days = Math.floor(diff / 24);

	return util.format(strings.misc.left, parseTime(time), stop.toDateString(), expand(stop.getHours()), expand(stop.getMinutes()));
}

/*
 * Parses the moon list to return an ID of a given phase name.
 * @param  name    Name of the Moon phse to look for.
 * @param  offset  Offset of the phase ID.
 * @return         ID of the found moon phase.
 */
function parsePhase(name, offset) {
	var id = 0;
	config.phases.forEach(function(n, i) {
		if (n.name == name)
			id = i;
	});

	id += offset;
	if (id >= config.phases.length)
		id -= config.phases.length;
	else if (id < 0)
		id += config.phases.length;

	return id;
}

/*
 * Sends a message to a channel on Discord.
 * @param  id       ID of the channel to send to.
 * @param  message  String message to send.
 * @param  type  	Whether the typing delay should be added.
 */
function send(id, message, type) {
	var channel = "unknown";
	config.channels.forEach(function(c) {
		if (c.id == id) {
			channel = c.name;
		}
	});

	var msg = {
		"to": id,
		"message": message
    };

    if (type) {
    	bot.simulateTyping(id);
    	setTimeout(function() {
			console.log(util.format(strings.debug.message,
				channel,
				message));
			bot.sendMessage(msg);
    	}, config.options.typetime * 1000);	
    }
    else {
		console.log(util.format(strings.debug.message,
			channel,
			message));
		bot.sendMessage(msg);	
    }
}

/*
 * Sends a message with image to a channel on Discord.
 * @param  id        ID of the channel to send to.
 * @param  message   String message to send.
 * @param  file      Path to the image file.
 * @param  filename  Name of the image as seeon on Discord.
 * @param  type  	 Whether the typing delay should be added.
 */
function embed(id, message, file, filename, type) {
	var channel = "unknown";
	config.channels.forEach(function(c) {
		if (c.id == id) {
			channel = c.name;
		}
	});

	var msg = {
		"to": id,
		"file": file,
		"filename": filename,
		"message": message
    };

    if (type) {
    	setTimeout(function() {
			console.log(util.format(strings.debug.embed,
				channel,
				message,
				msg.filename,
				msg.file));
			bot.uploadFile(msg);
    	}, config.options.typetime * 1000);	
    }
    else {
		console.log(util.format(strings.debug.embed,
			channel,
			message,
			msg.filename,
			msg.file));
		bot.uploadFile(msg);	
    }
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
		console.log(util.format(strings.debug.brain.error, 
			err));
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

	console.log(strings.debug.announcements.load);

	config.show.dates.forEach(function(d) {

		var partsDate = d.split("-");
		var partsTime = config.show.time.split(":");

		var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
		console.log(util.format(strings.debug.announcements.item,
			date));

		// Long air-time announcement.
		var jobLong = new CronJob(new Date(date - long), function() {
				send(parseChannel("announcements"), util.format(strings.announcements.show.long,
					parseTime(dateLong)), true);
			}, function () {}, true);

		// Short air-time announcement.
		var jobShort = new CronJob(new Date(date - short), function() {
				send(parseChannel("announcements"), util.format(strings.announcements.show.short,
					parseTime(dateShort)), true);
			}, function () {}, true);

		// Now air-time announcement.
		var jobNow = new CronJob(new Date(date), function() {
				send(parseChannel("announcements"), strings.announcements.show.now, true);
				toggle_np = true;
			}, function () {}, true);

		// After air-time announcement.
		var jobAfter = new CronJob(new Date(date - after), function() {
				send(parseChannel("announcements"), strings.announcements.show.after, true);
				toggle_np = false;
			}, function () {}, true);

		jobs.push(jobLong);
		jobs.push(jobShort);
		jobs.push(jobNow);
		jobs.push(jobAfter);
	});

	console.log(strings.debug.announcements.done);
}

/*
 * Loads all moon phases from web.
 */
function loadPhases() {
	console.log(strings.debug.phases.load);

	var xhr = new XMLHttpRequest();
	xhr.open("GET", config.options.phaseurl, true);

	xhr.onreadystatechange = function () { 
	    if (xhr.readyState == 4 && xhr.status == 200) {
	        var response = JSON.parse(xhr.responseText);
	        phases = response.phasedata;

	        phases.forEach(function(p) {
				var date = new Date(p.date + " " + p.time);
				var message;
				console.log(util.format(strings.debug.phases.item,
					date,
					p.phase));

				if (p.phase == config.options.fullmoon) {
					message = util.format(strings.announcements.phases.full, 
						config.phases[parsePhase(p.phase, 0)].name,
						config.phases[parsePhase(p.phase, 0)].icon);
				}
				else {
					message = util.format(strings.announcements.phases.else, 
						config.phases[parsePhase(p.phase, 0)].name,
						config.phases[parsePhase(p.phase, 0)].icon);
				}

				var job = new CronJob(date, function() {
		    			send(parseChannel("general"), message, true);
					}, function () {}, true);
				jobs.push(job);
			});

			console.log(strings.debug.phases.done);

			loadBrain();
			loadBot();
	    }
	}
	xhr.onerror = function() {
	    console.log(strings.debug.phases.error);
	    setTimeout(function() {
	    	xhr.abort();
	    	loadPhases();
	    }, 1000);
	}
	xhr.ontimeout = function() {
	    console.log(strings.debug.phases.timeout);
	    setTimeout(function() {
	    	xhr.abort();
	    	loadPhases();
	    }, 1000);
	}

	xhr.send();
}

/*
 * Loads the brain data, or creates new.
 */
function loadBrain() {
	brain = new jsmegahal(config.brain.markov, config.brain.default);

	if (fs.existsSync(config.brain.path)) {
		console.log(strings.debug.brain.old);
		openBrain();
		console.log(strings.debug.brain.done);
	}
	else {
		saveBrain();
		console.log(strings.debug.brain.new);
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
		bot.setPresence({
	        "game": {
	        	"name": config.options.game
	        }
	    });
	    console.log(util.format(strings.debug.join,
	    	bot.username,
	    	bot.id));
	    if (!started) {
	    	started = true;
	    	send(parseChannel("thorinair"), util.format(strings.misc.load,
	    		version), false);

	    	loopNowPlaying();
	    	loopBrainSave();
	    }
	});

	bot.on("guildMemberAdd", function(user) {
		console.log(util.format(strings.debug.welcome,
			user.username));
		send(parseChannel("general"), util.format(strings.misc.welcome,
			mention(user.id)), true);
		bot.addToRole( {
			"serverID": user.guild_id,
			"userID": user.id,
			"roleID": config.options.roleid
		}, function(err, response) {
	  		if (err) 
	  			console.error(util.format(strings.debug.welcomefail, 
	  				err));
		});
	});

	bot.on("message", function(user, userID, channelID, message, data) {

	    if (message[0] == config.options.commandsymbol) {

	    	var nocommand = true;
	    	var command = message.split(" ")[0];

		    var packed = {};
		    packed.user      = user;
		    packed.userID    = userID;
		    packed.channelID = channelID;
		    packed.message   = message;
		    packed.data      = data;

		    config.commands.forEach(function(c) {
		    	if (command == config.options.commandsymbol + c.command && nocommand) {
		    		if (c.private) {
		    			if (userID == parseChannel("thorinair")) {
				    		commands[c.command](packed);
				    		nocommand = false;
		    			}
		    		}
		    		else {
			    		commands[c.command](packed);
			    		nocommand = false;
			    	}
		    	}
		    });

		    if (nocommand)
			    send(channelID, util.format(strings.commands.error,
			    	mention(userID)), true);
		}
		else {
		    // When the bot is mentioned.
		    if (isMentioned(bot.id, data)) {
				console.log(util.format(strings.debug.chatting,
					user,
					message));
		    	send(channelID, mention(userID) + " " + brain.getReplyFromSentence(message), true);
		    }
		    // All other messages.
		    if (data.d.author.id != bot.id && processWhitelist(channelID, config.whitelist.do)) {
	    		brain.addMass(message.replace(/<.*>/g, ""));
	    		messages.push(message);
		    }
		}
	});

	bot.on("disconnect", function(erMsg, code) {
	    console.error(strings.debug.disconnected);
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
	    			send(parseChannel("gotn"), util.format(strings.announcements.nowplaying,
	    				np), true);
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
console.log(strings.debug.started);
loadAnnouncements();
loadPhases();