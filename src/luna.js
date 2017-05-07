// Version
const version = "v1.9.2";

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
const gotn    = require("./gotn.json");
const mlp     = require("./mlp.json");

// Commands
var commands = {};

// Command: !gotn
commands.gotn = function(data) {
	var now = new Date();
	var found = false;

	gotn.dates.forEach(function(d) {
		if (!found) {
			var partsDate = d.split(config.separators.date);
			var partsTime = gotn.time.split(config.separators.time);

			var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
			if (date > now) {
				send(data.channelID, util.format(
					strings.commands.gotn.message, 
					mention(data.userID), 
					getTimeLeft(now, date)
				), true);
				found = true;
			}
		}
	});	
};

// Command: !mlp
commands.mlp = function(data) {
	var now = new Date();
	var found = false;

	mlp.episodes.forEach(function(e) {
		if (!found) {
			var partsDate = e.date.split(config.separators.date);
			var partsTime = e.time.split(config.separators.time);

			var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
			if (date > now) {
				send(data.channelID, util.format(
					strings.commands.mlp.message, 
					mention(data.userID),
					e.name,
					getTimeLeft(now, date),
					mlp.channel
				), true);
				found = true;
			}
		}
	});	
};

// Command: !np
commands.np = function(data) {
	var station = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (station == "" || station == config.options.commandsymbol + data.command)
		station = config.options.defstation;

	if (np[station] != undefined) {
		if (np[station].artist != undefined && np[station].title != undefined)
			send(data.channelID, util.format(
				strings.commands.np.message, 
				mention(data.userID),
				station,
				np[station].artist + config.separators.track + np[station].title
			), true);
		else
			send(data.channelID, util.format(
				strings.commands.np.error, 
				mention(data.userID),
				station
			), true);
	}
	else {
		send(data.channelID, util.format(
			strings.commands.np.missing, 
			mention(data.userID)
		), true);
	}
};

// Command: !lyrics
commands.lyrics = function(data) {
	var param = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (param == "" || param == config.options.commandsymbol + data.command)
		param = config.options.defstation;

	if (param == "list") {

		sendLargeMessage(data, Object.keys(lyrics).sort(), util.format(
			strings.commands.lyrics.list,
			mention(data.userID)
		));

	}
	else if (lyrics[param] != undefined) {

		sendLargeMessage(data, lyrics[param].split("\n"), util.format(
			strings.commands.lyrics.message,
			mention(data.userID)
		));

	}
	else if (np[param] != undefined) {
		var track = np[param].artist + config.separators.track + np[param].title;
		if (lyrics[track] != undefined) {

			sendLargeMessage(data, lyrics[track].split("\n"), util.format(
				strings.commands.lyrics.radio,
				mention(data.userID),
				param
			));

		}
		else {
			send(data.channelID, util.format(
				strings.commands.lyrics.errorB,
				mention(data.userID),
				param
			), true);
		}
	}
	else {
		send(data.channelID, util.format(
			strings.commands.lyrics.errorA,
			mention(data.userID)
		), true);
	}
};

// Command: !phase
commands.phase = function(data) {
	var dateNow = new Date();
	var message;
	var phaseNext;

	var found = false;
	phases.forEach(function(p) {
		if (!found) {

			var datePhase = new Date(p.date + " " + p.time);
			if (datePhase > dateNow) {

				config.phases.forEach(function(n, i) {
					if (n.name == p.phase)
						phaseNext = config.phases[i].name;
				});

				message = util.format(
					strings.commands.phase.messageA, 
					mention(data.userID), 
					getPhaseString(p.phase, -1), 
					getPhaseString(p.phase, 0),
					getTimeLeft(dateNow, datePhase)
				);

		    	found = true;
			}
		}
	});

	if (found) {

		if (phaseNext != config.options.fullmoon) {
			found = false;
			phases.forEach(function(p) {
				if (!found) {

					var datePhase = new Date(p.date + " " + p.time);
					if (datePhase > dateNow && p.phase == config.options.fullmoon) {

						message += util.format(
							" " + strings.commands.phase.messageB,
							getPhaseString(config.options.fullmoon, 0),
							getTimeLeft(dateNow, datePhase)
						);
				    	
				    	found = true;
					}
				}
			});
		}
	}

	if (!found) {
		send(data.channelID, util.format(
			strings.commands.phase.error,
			mention(data.userID)
		), true);
	}
	else {
		send(data.channelID, message, true);
	}
};

// Command: !moon
commands.moon = function(data) {
	send(data.channelID, util.format(
		strings.commands.moon.messageA,
		mention(data.userID)
	), true);

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
	doMultiCommand(data);
};

// Command: !kiss
commands.kiss = function(data) {
	doMultiCommand(data);
};

// Command: !boop
commands.boop = function(data) {
	doMultiCommand(data);
};

// Command: !learn
commands.learn = function(data) {
	var text = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (text == "" || text == config.options.commandsymbol + data.command) {
		send(parseChannel(config.options.channels.private), strings.commands.learn.error, false);
	}
	else {
		brain.addMass(text.replace(/<.*>/g, ""));
	    messages.push(text);
		send(parseChannel(config.options.channels.private), strings.commands.learn.message, false);
	}
};

// Command: !togglenp
commands.togglenp = function(data) {
	toggle_np = !toggle_np;
	send(parseChannel(config.options.channels.private), util.format(
		strings.commands.togglenp.message, 
		toggle_np
	), false);
};

// Command: !addlyrics
commands.addlyrics = function(data) {
	var lines = data.message.split("\n");

	var track = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
	if (track == "" || track == config.options.commandsymbol + data.command) {
		send(parseChannel(config.options.channels.private), strings.commands.addlyrics.errorA, false);
	}
	else {
		var lyriclines = "";
		lines.forEach(function(l, i) {
			if (i != 0) {
				lyriclines += l + "\n"; 
			}
		});

		if (lyriclines != "") {

			if (lyrics[track] == undefined)
				lyrics[track] = lyriclines;
			else
				lyrics[track] += lyriclines;

			fs.writeFileSync(config.options.lyricspath, JSON.stringify(lyrics), "utf-8");

			send(parseChannel(config.options.channels.private), util.format(
				strings.commands.addlyrics.message, 
				track
			), false);
		}
		else {
			send(parseChannel(config.options.channels.private), strings.commands.addlyrics.errorB, false);
		}
	}
};

// Command: !dellyrics
commands.dellyrics = function(data) {
	var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (track == "" || track == config.options.commandsymbol + data.command) {
		send(parseChannel(config.options.channels.private), strings.commands.dellyrics.errorA, false);
	}
	else {
		if (lyrics[track] != undefined) {
			delete lyrics[track];

			fs.writeFileSync(config.options.lyricspath, JSON.stringify(lyrics), "utf-8");

			send(parseChannel(config.options.channels.private), util.format(
				strings.commands.dellyrics.message, 
				track
			), false);
		}
		else {
			send(parseChannel(config.options.channels.private), strings.commands.dellyrics.errorB, false);
		}
	}
};

// Command: !reboot
commands.reboot = function(data) {
	send(parseChannel(config.options.channels.private), strings.commands.reboot.message, false);
	saveBrain();
	setTimeout(function() {
		console.log(strings.debug.stopped);
		process.exit();
	}, config.options.reboottime * 1000);
};

// Command: !help
commands.help = function(data) {
	var reply = "";

	reply += util.format(
		strings.commands.help.messageA, 
		mention(data.userID)
	);
	config.commands.forEach(function(c) {
		if (!c.private)
			reply += util.format(
				strings.commands.help.messageB, 
				config.options.commandsymbol,
				c.command,
				c.help
			);
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
var np        = {};

// Persistant Objects
var bot;
var brain;
var lyrics;

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
 * Sends a large message to some chat using multiple messages. Used for lyrics.
 * @param  data     Data of the message.
 * @param  list     List to be sent.
 * @param  message  Initial message string.
 */
function sendLargeMessage(data, list, message) {

	var length = message.length;
	var multi = [];

	list.forEach(function(l, i) {
		var line = l + "\n";
		if (length + line.length >= config.options.maxlength) {
			multi.push(message);
			length = line.length;
			message = line;
		}
		else {
			length += line.length;
			message += line;
		}
	});

	if (message != "")
		multi.push(message);

	multi.forEach(function(m, i){
    	setTimeout(function() {
			send(data.channelID, m, true);
    	}, i * 1000);			
	});
}

/*
 * Executes a command on one person or more people.
 * @param  data  Data of the message.
 */
function doMultiCommand(data) {
	if (data.data.d.mentions[0] != null) {
		if (isMentioned(bot.id, data.data)) {
			send(data.channelID, strings.commands[data.command].self, true);
		}
		else {
			if (data.data.d.mentions.length <= 1) {
				send(data.channelID, util.format(
					strings.commands[data.command].single, 
					mention(data.data.d.mentions[0].id)
				), true);
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

				send(data.channelID, util.format(
					strings.commands[data.command].multiple,
					mentions
				), true);
			}
		}
	}
	else {
		send(data.channelID, util.format(
			strings.commands[data.command].single, 
			mention(data.userID)
		), true);
	}
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
 * Converts a given date to a more readable format.
 * @param  date  The input date, this is not the JS Date object.
 * @return       Formatted string.
 */
function getTimeString(date) {
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
function getTimeLeft(start, stop) {
	var diff = (stop - start) / 60000;
	var time = {};

	time.minutes = Math.floor(diff % 60);
	diff = Math.floor(diff / 60);
	time.hours = Math.floor(diff % 24);
	time.days = Math.floor(diff / 24);

	return util.format(
		strings.misc.left, 
		getTimeString(time), 
		stop.toDateString(), 
		expand(stop.getHours()), 
		expand(stop.getMinutes())
	);
}

/*
 * Parses the phase list to return a string compatible with Discord chat.
 * @param  name    Name of the Moon phse to look for.
 * @param  offset  Offset of the phase.
 * @return         String compatible with Discord chat.
 */
function getPhaseString(name, offset) {
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

	return config.phases[id].name + " " + config.phases[id].icon;
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
			console.log(util.format(
				strings.debug.message,
				channel,
				message
			));
			bot.sendMessage(msg);
    	}, config.options.typetime * 1000);	
    }
    else {
		console.log(util.format(
			strings.debug.message,
			channel,
			message
		));
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
			console.log(util.format(
				strings.debug.embed,
				channel,
				message,
				msg.filename,
				msg.file
			));
			bot.uploadFile(msg);
    	}, config.options.typetime * 1000);	
    }
    else {
		console.log(util.format(
			strings.debug.embed,
			channel,
			message,
			msg.filename,
			msg.file
		));
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
		console.log(util.format(
			strings.debug.brain.error, 
			err
		));
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
	var partsLong = gotn.announce.long.split(config.separators.time);
	var long = (parseInt(partsLong[0]) * 60 + parseInt(partsLong[1])) * 60000;

	var dateLong = {};
	dateLong.hours 	 = parseInt(partsLong[0]);
	dateLong.minutes = parseInt(partsLong[1]);

	// Short Message
	var partsShort = gotn.announce.short.split(config.separators.time);
	var short = (parseInt(partsShort[0]) * 60 + parseInt(partsShort[1])) * 60000;

	var dateShort = {};
	dateShort.hours   = parseInt(partsShort[0]);
	dateShort.minutes = parseInt(partsShort[1]);

	// After Message
	var partsAfter = gotn.announce.after.split(config.separators.time);
	var after = - (parseInt(partsAfter[0]) * 60 + parseInt(partsAfter[1])) * 60000;

	console.log(strings.debug.announcements.load);

	gotn.dates.forEach(function(d) {

		var partsDate = d.split(config.separators.date);
		var partsTime = gotn.time.split(config.separators.time);

		var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
		console.log(util.format(
			strings.debug.announcements.item,
			date
		));

		// Long air-time announcement.
		var jobLong = new CronJob(new Date(date - long), function() {
				send(parseChannel(config.options.channels.announcements), util.format(
					strings.announcements.gotn.long,
					getTimeString(dateLong)
				), true);
			}, function () {}, true);

		// Short air-time announcement.
		var jobShort = new CronJob(new Date(date - short), function() {
				send(parseChannel(config.options.channels.announcements), util.format(
					strings.announcements.gotn.short,
					getTimeString(dateShort)
				), true);
			}, function () {}, true);

		// Now air-time announcement.
		var jobNow = new CronJob(new Date(date), function() {
				send(parseChannel(config.options.channels.announcements), strings.announcements.gotn.now, true);
			    setTimeout(function() {
			    	toggle_np = true;
					send(parseChannel(config.options.channels.private), util.format(
						strings.commands.togglenp.message, 
						toggle_np
					), false);
			    }, config.options.starttime * 1000);
			}, function () {}, true);

		// After air-time announcement.
		var jobAfter = new CronJob(new Date(date - after), function() {
				send(parseChannel(config.options.channels.announcements), strings.announcements.gotn.after, true);
				toggle_np = false;
				send(parseChannel(config.options.channels.private), util.format(
					strings.commands.togglenp.message, 
					toggle_np
				), false);
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
				console.log(util.format(
					strings.debug.phases.item,
					date,
					p.phase
				));

				if (p.phase == config.options.fullmoon) {
					message = util.format(
						strings.announcements.phases.full, 
						getPhaseString(p.phase, 0)
					);
				}
				else {
					message = util.format(
						strings.announcements.phases.else, 
						getPhaseString(p.phase, 0)
					);
				}

				var job = new CronJob(date, function() {
		    			send(parseChannel(config.options.channels.phases), message, true);
					}, function () {}, true);
				jobs.push(job);
			});

			console.log(strings.debug.phases.done);

			loadBrain();
			loadLyrics();
			loadBot();
	    }
	}
	xhr.onerror = function(err) {
	    console.log(util.format(
	    	strings.debug.phases.error,
	    	err.target.status
	    ));
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
 * Loads the lyrics data, or creates new.
 */
function loadLyrics() {
	lyrics = {};

	if (fs.existsSync(config.options.lyricspath)) {
		console.log(strings.debug.lyrics.old);
		lyrics = JSON.parse(fs.readFileSync(config.options.lyricspath, "utf8"));
		console.log(strings.debug.lyrics.done);
	}
	else {
	    fs.writeFileSync(config.options.lyricspath, JSON.stringify(lyrics), "utf-8");
		console.log(strings.debug.lyrics.new);
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
	    console.log(util.format(
	    	strings.debug.join,
	    	bot.username,
	    	bot.id
	    ));
	    if (!started) {
	    	started = true;
	    	send(parseChannel(config.options.channels.private), util.format(
	    		strings.misc.load,
	    		version
	    	), false);

	    	loopNowPlaying();
	    	loopBrainSave();
	    }
	});

	bot.on("guildMemberAdd", function(user) {
		if (user.guild_id == config.options.serverid) {
			console.log(util.format(
				strings.debug.welcome,
				user.username
			));
			send(parseChannel(config.options.channels.welcome), util.format(
				strings.misc.welcome,
				mention(user.id)
			), true);
			bot.addToRole( {
				"serverID": user.guild_id,
				"userID": user.id,
				"roleID": config.options.roleid
			}, function(err, response) {
		  		if (err) 
		  			console.error(util.format(
		  				strings.debug.welcomefail, 
		  				err
		  			));
			});
		}
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
		    packed.command   = command.replace(config.options.commandsymbol, "");

		    config.commands.forEach(function(c) {
		    	if (command == config.options.commandsymbol + c.command && nocommand) {
		    		if (c.private) {
		    			if (userID == parseChannel(config.options.channels.private)) {
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
			    send(channelID, util.format(
			    	strings.commands.error,
			    	mention(userID)
			    ), true);
		}
		else {
		    // When the bot is mentioned.
		    if (isMentioned(bot.id, data)) {
				console.log(util.format(
					strings.debug.chatting,
					user,
					message
				));
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
	        if (np.one == undefined || np.one.nowplaying != response.one.nowplaying) {
	        	if (toggle_np)
	    			send(parseChannel(config.options.channels.nowplaying), util.format(
	    				strings.announcements.nowplaying,
	    				response.one.artist + config.separators.track + response.one.title
	    			), true);
	        }
	        np = response;
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