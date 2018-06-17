// Modules
const util           = require("util")
const fs             = require("fs");
const request        = require("request");
const readline       = require("readline");

// 3rd Party Modules
const Discord        = require("discord.io");
const CronJob        = require("cron").CronJob;
const moment         = require("moment-timezone");
const XMLHttpRequest = require("xhr2");
const archiver       = require("archiver");
const jsmegahal      = require("jsmegahal");
const tradfrilib     = require('node-tradfri');
const color          = require('c0lor');

const package  = require("./package.json");

// Load file data
var token    = require("./config/token.json");
var config   = require("./config/config.json");
var commands = require("./config/commands.json");
var strings  = require("./config/strings.json");
var gotn     = require("./config/gotn.json");
var mlp      = require("./config/mlp.json");
var channels = require("./config/channels.json");
var varipass = require("./config/varipass.json");
var printer  = require("./config/printer.json");
var dtls     = require("./config/dtls.json");
var tradfri  = require("./config/tradfri.json");

// Commands
var comm = {};

// Command: !gotn
comm.gotn = function(data) {
	var now = new Date();
	var found = false;

	var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (timezone == "" || timezone == config.options.commandsymbol + data.command)
		timezone = "UTC";

	if (moment.tz.zone(timezone)) {
		gotn.dates.forEach(function(d) {
			if (!found) {
				var partsDate = d.split(config.separators.date);
				var partsTime = gotn.time.split(config.separators.time);

				var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
				if (date > now) {
					send(data.channelID, util.format(
						strings.commands.gotn.message, 
						mention(data.userID), 
						getTimeLeft(now, date, timezone)
					), true);
					found = true;
				}
			}
		});	
	}
	else {
		send(data.channelID, util.format(
			strings.commands.gotn.error, 
			mention(data.userID)
		), true);
	}
};

// Command: !mlp
comm.mlp = function(data) {
	var now = new Date();
	var found = false;

	var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (timezone == "" || timezone == config.options.commandsymbol + data.command)
		timezone = "UTC";

	if (moment.tz.zone(timezone)) {
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
						getTimeLeft(now, date, timezone),
						mlp.channel
					), true);
					found = true;
				}
			}
		});	
		if (!found)
			send(data.channelID, util.format(
				strings.commands.mlp.errorA, 
				mention(data.userID)
			), true);			
	}
	else {
		send(data.channelID, util.format(
			strings.commands.mlp.errorB, 
			mention(data.userID)
		), true);
	}
};

// Command: !time
comm.time = function(data) {
	var now = new Date();
	var found = false;

	var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");

	var useEq = (
		timezone == "QST" || 
		timezone == "Equestria" ||
		timezone == "Equestria/Canterlot" ||
		timezone == "Equestria/Ponyville" ||
		timezone == "Equestria/Manehattan" ||
		timezone == "Equestria/Fillydelphia" ||
		timezone == "Equestria/Crystal_Empire" ||
		timezone == "Equestria/Cloudsdale"
		)

	if (timezone == "" || timezone == config.options.commandsymbol + data.command || useEq)
		timezone = "UTC";

	if (moment.tz.zone(timezone)) {

		if (useEq) {
			var momentTime = moment.tz(now / 8760 + 93*365*24*60*60*1000 + 11*60*60*1000, timezone);
			send(data.channelID, util.format(
				strings.commands.time.message, 
				mention(data.userID),
				momentTime.format("ddd MMM DD, YYYY"),
				momentTime.format("HH:mm:ss") + " (QST)"
			), true);
		}
		else {
			var momentTime = moment.tz(now, timezone);
			send(data.channelID, util.format(
				strings.commands.time.message, 
				mention(data.userID),
				momentTime.format("ddd MMM DD, YYYY"),
				momentTime.format("HH:mm:ss (z)")
			), true);
		}
	}
	else {
		send(data.channelID, util.format(
			strings.commands.time.error, 
			mention(data.userID)
		), true);
	}
};

// Command: !np
comm.np = function(data) {
	if (np.nowplaying != undefined)
		send(data.channelID, util.format(
			strings.commands.np.message, 
			mention(data.userID),
			np.nowplaying
		), true);
	else
		send(data.channelID, util.format(
			strings.commands.np.error, 
			mention(data.userID)
		), true);
};

// Command: !lyrics
comm.lyrics = function(data) {
	var param = data.message.replace(config.options.commandsymbol + data.command + " ", "");

	if (param == "" || param == config.options.commandsymbol + data.command) {
		if (lyrics[np.nowplaying] != undefined) {

			sendLargeMessage(data, lyrics[np.nowplaying].split("\n"), util.format(
				strings.commands.lyrics.radio,
				mention(data.userID)
			), true);

		}
		else {

			send(data.channelID, util.format(
				strings.commands.lyrics.errorB,
				mention(data.userID)
			), true);

		}
	}
	else if (param == "list") {
		if (bot.channels[data.channelID] != undefined)	
			send(data.channelID, util.format(
				strings.commands.lyrics.listA, 
				mention(data.userID)
			), true);

		data.channelID = data.userID;
		sendLargeMessage(data, Object.keys(lyrics).sort(), util.format(
			strings.commands.lyrics.listB
		), false);
	}
	else if (lyrics[param] != undefined) {

		sendLargeMessage(data, lyrics[param].split("\n"), util.format(
			strings.commands.lyrics.message,
			mention(data.userID)
		), true);

	}
	else {
		send(data.channelID, util.format(
			strings.commands.lyrics.errorA,
			mention(data.userID)
		), true);
	}
};

// Command: !artwork
comm.artwork = function(data) {
	var param = data.message.replace(config.options.commandsymbol + data.command + " ", "");

	if (param == "" || param == config.options.commandsymbol + data.command) {
		if (artwork[np.nowplaying] != undefined) {

			send(data.channelID, util.format(
				strings.commands.artwork.load,
				mention(data.userID)
			), true);

			download(artwork[np.nowplaying], config.options.artimg, function() {
				console.log(strings.debug.download.stop);
				embed(data.channelID, strings.commands.artwork.radio, config.options.artimg, np.nowplaying + ".png", true, true);
			});

		}
		else {

			send(data.channelID, util.format(
				strings.commands.artwork.errorB,
				mention(data.userID)
			), true);

		}
	}
	else if (param == "list") {
		if (bot.channels[data.channelID] != undefined)	
			send(data.channelID, util.format(
				strings.commands.artwork.listA, 
				mention(data.userID)
			), true);

		data.channelID = data.userID;
		sendLargeMessage(data, Object.keys(artwork).sort(), util.format(
			strings.commands.artwork.listB
		), false);
	}
	else if (artwork[param] != undefined) {

		send(data.channelID, util.format(
			strings.commands.artwork.load,
			mention(data.userID)
		), true);

		download(artwork[param], config.options.artimg, function() {
			console.log(strings.debug.download.stop);
			embed(data.channelID, strings.commands.artwork.message, config.options.artimg, param + ".png", true, true);
		});

	}
	else {
		send(data.channelID, util.format(
			strings.commands.artwork.errorA,
			mention(data.userID)
		), true);
	}
};

// Command: !phase
comm.phase = function(data) {
	var dateNow = new Date();
	var message;
	var phaseNext;

	var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (timezone == "" || timezone == config.options.commandsymbol + data.command)
		timezone = "UTC";

	if (moment.tz.zone(timezone)) {

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
						getTimeLeft(dateNow, datePhase, timezone)
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
								getTimeLeft(dateNow, datePhase, timezone)
							);
					    	
					    	found = true;
						}
					}
				});
			}
		}

		if (!found) {
			send(data.channelID, util.format(
				strings.commands.phase.errorA,
				mention(data.userID)
			), true);
		}
		else {
			send(data.channelID, message, true);
		}

	}
	else {
		send(data.channelID, util.format(
			strings.commands.phase.errorB, 
			mention(data.userID)
		), true);
	}

};

// Command: !moon
comm.moon = function(data) {
	send(data.channelID, util.format(
		strings.commands.moon.messageA,
		mention(data.userID)
	), true);

	download(config.options.moonurl, config.options.moonimg, function() {
		console.log(strings.debug.download.stop);
		embed(data.channelID, strings.commands.moon.messageB, config.options.moonimg, "Moon " + (new Date()) + ".png", true, true);
	});
};

// Command: !room
comm.room = function(data) {

	var payload = {
			"key": varipass.key,
			"action": "all"
		};

	var xhr = new XMLHttpRequest();
	xhr.open("POST", config.options.varipassurl, true);
	xhr.setRequestHeader("Content-type", "application/json");

	xhr.onreadystatechange = function () { 
	    if (xhr.readyState == 4 && xhr.status == 200) {
	        var vpData = JSON.parse(xhr.responseText);
			console.log(strings.debug.varipass.done);

			var diff = (vpData.current - vpData.list[0].history[0].time);
			var time = {};

			time.seconds = Math.floor(diff % 60);
			diff = Math.floor(diff / 60);
			time.minutes = Math.floor(diff % 60);
			diff = Math.floor(diff / 60);
			time.hours = Math.floor(diff % 24);
			time.days = Math.floor(diff / 24);

			send(data.channelID, util.format(
				strings.commands.room.message, 
				mention(data.userID),
				getTimeString(time),
				time.seconds,
				findVariable(vpData, varipass.ids.temperature).history[0].value,
				findVariable(vpData, varipass.ids.humidity).history[0].value,
				findVariable(vpData, varipass.ids.pressure).history[0].value,
				findVariable(vpData, varipass.ids.magnitude).history[0].value,
				findVariable(vpData, varipass.ids.inclination).history[0].value,
				findVariable(vpData, varipass.ids.counts).history[0].value,
				findVariable(vpData, varipass.ids.dose).history[0].value
			), true);
	    }
	}
	xhr.onerror = function(err) {
	    console.log(util.format(
	    	strings.debug.varipass.error,
	    	err.target.status
	    ));
	    xhr.abort();
	}
	xhr.ontimeout = function() {
	    console.log(strings.debug.varipass.timeout);
	    xhr.abort();
	}

	console.log(strings.debug.varipass.load);
	xhr.send(JSON.stringify(payload));
};

// Command: !printer
comm.printer = function(data) {

	send(data.channelID, util.format(
		strings.commands.printer.messageA, 
		mention(data.userID)
	), true);

	download(printer.webcam, printer.printerimg, function() {

		var xhr = new XMLHttpRequest();
		xhr.open("GET", printer.api, true);

		xhr.onreadystatechange = function () { 
		    if (xhr.readyState == 4 && xhr.status == 200) {
		        var response = JSON.parse(xhr.responseText);
		        if (response.progress.completion != null && response.state == "Printing") {

		        	var left = response.progress.printTimeLeft;
					var time = {};

					time.seconds = Math.floor(left % 60);
					left = Math.floor(left / 60);
					time.minutes = Math.floor(left % 60);
					left = Math.floor(left / 60);
					time.hours = Math.floor(left % 24);
					time.days = Math.floor(left / 24);


					embed(data.channelID, util.format(
						strings.commands.printer.messageC, 
						response.job.file.name,
						response.progress.completion.toFixed(1),
						getTimeString(time)
					), printer.printerimg, "Nightmare Rarity Webcam.jpg", true, true);
		        }
		        else {
					embed(data.channelID, strings.commands.printer.messageB, printer.printerimg, "Nightmare Rarity Webcam.jpg", true, true);
		        }
		    }
		}

		xhr.onerror = function(err) {
		    send(data.channelID, strings.commands.printer.error, true);
		    xhr.abort();
		}
		xhr.ontimeout = function() {
		    send(data.channelID, strings.commands.printer.error, true);
		    xhr.abort();
		}

		xhr.send();
	});
};

// Command: !blacklist
comm.blacklist = function(data) {
	if (blacklist[data.userID] == undefined) {
		blacklist[data.userID] = true;
		send(data.channelID, util.format(
			strings.commands.blacklist.messageA, 
			mention(data.userID)
		), true);

		console.log(util.format(
			strings.debug.blacklist.add,
			data.userID
		));
	}
	else {
		delete blacklist[data.userID];
		send(data.channelID, util.format(
			strings.commands.blacklist.messageB, 
			mention(data.userID)
		), true);

		console.log(util.format(
			strings.debug.blacklist.remove,
			data.userID
		));
	}

	fs.writeFileSync(config.options.blacklistpath, JSON.stringify(blacklist), "utf-8");
};

// Command: !stats
comm.stats = function(data) {
	var dateNow = new Date();

	var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (timezone == "" || timezone == config.options.commandsymbol + data.command)
		timezone = "UTC";

	if (moment.tz.zone(timezone)) {

		var diff = (dateNow - startTime) / 1000;
		var time = {};

		time.seconds = Math.floor(diff % 60);
		diff = Math.floor(diff / 60);
		time.minutes = Math.floor(diff % 60);
		diff = Math.floor(diff / 60);
		time.hours = Math.floor(diff % 24);
		time.days = Math.floor(diff / 24);

		var momentTime = moment.tz(startTime, timezone);

		var canLearn;
		if (processWhitelist(data.channelID))
			canLearn = strings.commands.stats.learnyes;
		else
			canLearn = strings.commands.stats.learnno;

		send(data.channelID, util.format(
			strings.commands.stats.message,
			mention(data.userID),
			package.version,
			momentTime.format("ddd MMM DD, YYYY"),
			momentTime.format("HH:mm (z)"),
			getTimeString(time),
			time.seconds,
			channelIDToBrain(data.channelID),
			messages[channelIDToBrain(data.channelID)].length,
			canLearn
		), true);

	}
	else {
		send(data.channelID, util.format(
			strings.commands.stats.error, 
			mention(data.userID)
		), true);
	}
};

// Command: !about
comm.about = function(data) {
	send(data.channelID, util.format(
		strings.commands.about.message, 
		mention(data.userID),
		package.homepage
	), true);
};

// Command: !help
comm.help = function(data) {
	var reply = "";

	reply += strings.commands.help.messageA;

	commands.list.forEach(function(c) {
		if (c.type == "public")
			reply += util.format(
				strings.commands.help.messageB, 
				config.options.commandsymbol,
				c.command,
				c.help
			);
	});

	send(data.userID, reply, true);


	setTimeout(function() {
		var reply = "";

		commands.list.forEach(function(c) {
			if (c.type == "dj")
				reply += util.format(
					strings.commands.help.messageB, 
					config.options.commandsymbol,
					c.command,
					c.help
				);
		});

		var interractionCommands = ""
		commands.list.forEach(function(c) {
			if (c.type == "interraction") {
				if (interractionCommands != "")
					interractionCommands += ", ";
				interractionCommands += util.format(
					strings.commands.help.messageC, 
					config.options.commandsymbol,
					c.command
				);
			}
		});

		reply += util.format(
			strings.commands.help.messageD,
			interractionCommands
		);

		reply += strings.commands.help.messageE;

		send(data.userID, reply, true);
	}, 1000);

	if (bot.channels[data.channelID] != undefined)	
		send(data.channelID, util.format(
			strings.commands.help.message, 
			mention(data.userID)
		), true);
};



// Interraction commands are called dynamically by type.



// Command: !nptoggle
comm.nptoggle = function(data) {
	if (nptoggles[data.channelID] == undefined) {
		nptoggles[data.channelID] = true;
		send(data.channelID, util.format(
			strings.commands.nptoggle.messageA, 
			mention(data.userID)
		), true);

		console.log(util.format(
			strings.debug.nptoggles.add,
			channelIDToName(data.channelID),
			data.channelID
		));

		setTimeout(function() {
			send(data.channelID, util.format(
				strings.announcements.nowplaying,
				np.nowplaying
			), true);
	    }, 1000);		
	}
	else {
		delete nptoggles[data.channelID];
		send(data.channelID, util.format(
			strings.commands.nptoggle.messageB, 
			mention(data.userID)
		), true);

		console.log(util.format(
			strings.debug.nptoggles.remove,
			channelIDToName(data.channelID),
			data.channelID
		));
	}

	fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");
};



// Command: !send
comm.send = function(data) {	
	var lines = data.message.split("\n");

	var channel = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
	if (channel == "" || channel == config.options.commandsymbol + data.command) {
		send(channelNameToID(config.options.channels.private), strings.commands.send.errorA, false);
	}
	else {
		var text = "";
		lines.forEach(function(l, i) {
			if (i != 0) {
				text += l + "\n";
			}
		});

		if (text != "") {
			send(channelNameToID(config.options.channels.private), strings.commands.send.message, false);
			send(channelNameToID(channel), text, true);
		}
		else {
			send(channelNameToID(config.options.channels.private), strings.commands.send.errorB, false);
		}
	}
};

// Command: !learn
comm.learn = function(data) {
	var lines = data.message.split("\n");


	var brain = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
	if (brain == "" || brain == config.options.commandsymbol + data.command) {
		send(data.channelID, strings.commands.learn.errorA, false);
	}
	else {
		if (brains[brain] != null) {
			var text = "";
			lines.forEach(function(l, i) {
				if (i != 0) {
					text += l + "\n"; 
				}
			});

			if (text != "") {
				brains[brain].addMass(text.replace(/<.*>/g, ""));
		    	messages[brain].push(text);
				send(data.channelID, strings.commands.learn.message, false);
			}
			else {
				send(data.channelID, strings.commands.learn.errorC, false);
			}
		}
		else {
			send(data.channelID, strings.commands.learn.errorB, false);
		}
	}
};

// Command: !npoverride
comm.npoverride = function(data) {
	var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (track == "" || track == config.options.commandsymbol + data.command) {
		send(data.channelID, strings.commands.npoverride.error, false);
	}
	else {
		send(data.channelID, util.format(
			strings.commands.npoverride.message, 
			track
		), false);

		np.nowplaying = track;

		Object.keys(nptoggles).forEach(function(n, i) {
    		if (nptoggles[n])
    			send(n, util.format(
    				strings.announcements.nowplaying,
    				np.nowplaying
    			), true);
    	});		
	}
};

// Command: !npstatus
comm.npstatus = function(data) {
	if (Object.keys(nptoggles).length == 0)
		send(channelNameToID(config.options.channels.private), strings.commands.npstatus.error, false);
	else {
		var message = strings.commands.npstatus.messageA;
		Object.keys(nptoggles).forEach(function(n, i) {
			var type = "Public";

			if (bot.channels[n] == undefined)
				type = "Private";

			message += util.format(
				strings.commands.npstatus.messageB, 
				channelIDToName(n),
				type
			);
		});
		send(channelNameToID(config.options.channels.private), message, false);
	}
};

// Command: !nppurge
comm.nppurge = function(data) {
	if (Object.keys(nptoggles).length == 0)
		send(data.channelID, strings.commands.nppurge.error, false);
	else {
		Object.keys(nptoggles).forEach(function(n, i) {
    		if (nptoggles[n])
    			send(n, strings.commands.nppurge.notify, true);
    	});    	
		nptoggles = {};

		fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");
		send(data.channelID, strings.commands.nppurge.message, false);
	}
};

// Command: !lyricsadd
comm.lyricsadd = function(data) {
	var lines = data.message.split("\n");

	var track = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
	if (track == "" || track == config.options.commandsymbol + data.command) {
		send(data.channelID, strings.commands.lyricsadd.errorA, false);
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

			send(data.channelID, util.format(
				strings.commands.lyricsadd.message, 
				track
			), false);
		}
		else {
			send(data.channelID, strings.commands.lyricsadd.errorB, false);
		}
	}
};

// Command: !lyricsdel
comm.lyricsdel = function(data) {
	var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (track == "" || track == config.options.commandsymbol + data.command) {
		send(data.channelID, strings.commands.lyricsdel.errorA, false);
	}
	else {
		if (lyrics[track] != undefined) {
			delete lyrics[track];

			fs.writeFileSync(config.options.lyricspath, JSON.stringify(lyrics), "utf-8");

			send(data.channelID, util.format(
				strings.commands.lyricsdel.message, 
				track
			), false);
		}
		else {
			send(data.channelID, strings.commands.lyricsdel.errorB, false);
		}
	}
};

// Command: !artworkadd
comm.artworkadd = function(data) {
	var lines = data.message.split("\n");

	var track = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
	if (track == "" || track == config.options.commandsymbol + data.command) {
		send(data.channelID, strings.commands.artworkadd.errorA, false);
	}
	else {
		if (lines[1] != undefined) {
			var url = lines[1];

			if (artwork[track] == undefined) {				
				artwork[track] = url;
				fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");
				send(data.channelID, util.format(
					strings.commands.artworkadd.messageA, 
					track
				), false);
			}
			else {
				artwork[track] = url;
				fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");
				send(data.channelID, util.format(
					strings.commands.artworkadd.messageB, 
					track
				), false);
			}			
		}
		else {
			send(data.channelID, strings.commands.artworkadd.errorB, false);
		}
	}
};

// Command: !artworkdel
comm.artworkdel = function(data) {
	var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (track == "" || track == config.options.commandsymbol + data.command) {
		send(data.channelID, strings.commands.artworkdel.errorA, false);
	}
	else {
		if (artwork[track] != undefined) {
			delete artwork[track];

			fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");

			send(data.channelID, util.format(
				strings.commands.artworkdel.message, 
				track
			), false);
		}
		else {
			send(data.channelID, strings.commands.artworkdel.errorB, false);
		}
	}
};

// Command: !h
comm.h = function(data) {
	if (Object.keys(hTrack).length == 0)
		send(channelNameToID(config.options.channels.private), strings.commands.h.error, false);
	else {
		var message = strings.commands.h.messageA;
		Object.keys(hTrack).forEach(function(h, i) {
			var status = "Cooldown";

			if (moment() - hTrack[h] >= config.options.htimeout * 1000)
				status = "Expired";

			message += util.format(
				strings.commands.h.messageB, 
				channelIDToName(h),
				moment.tz(new Date(hTrack[h]), "UTC").format("YYYY-MM-DD, HH:mm:ss"),
				status
			);
		});
		send(channelNameToID(config.options.channels.private), message, false);
	}
};

// Command: !mood
comm.mood = function(data) {
	var name = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (name == "" || name == config.options.commandsymbol + data.command) {
		var message = strings.commands.mood.messageA;
		tradfri.moods.forEach(function(m) {
			message += util.format(
				strings.commands.mood.messageB, 
				m.name
			);
		});
		send(data.channelID, message, false);
	}
	else {		
		var found = false;

		tradfri.moods.forEach(function(m) {		
			if (m.name == name) {
				found = true;	
				send(data.channelID, util.format(
					strings.commands.mood.messageC, 
					m.name
				), false);
				setMood(m.name);
			}
		});

		if (!found)
			send(data.channelID, strings.commands.mood.error, false);
	}
};

// Command: !bulb
comm.bulb = function(data) {
	var lines = data.message.split("\n");

	var name = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
	if ((name == "" || name == config.options.commandsymbol + data.command) && lines.length <= 1) {
		refreshTradfriDevices(function() {
			var message = strings.commands.bulb.messageA;
			devices.forEach(function(d) {
				var color = d.color;
				if (color == "0")
					color = "custom";
				message += util.format(
					strings.commands.bulb.messageB, 
					d.name,
					color
				);
			});
			send(data.channelID, message, false);
		});
	}
	else {
		var found = false;
		var id;
		devices.forEach(function(d) {
			if (d.name == name) {				
				found = true;
				id = d.id;
			}			
		});
		if (found) {
			var bulb = {};
			if (lines.length == 3) {

				bulb.transitionTime = parseInt(lines[2]);

				var rgb = color.RGB().hex(lines[1]);
				rgb.r = rgb.R;
				rgb.g = rgb.G;
				rgb.b = rgb.B;

				var cie = color.space.rgb['CIE-RGB'];
				var XYZ = cie.XYZ(rgb);

				var xyY = XYZ.xyY();

				bulb.colorX     = xyY.x;
				bulb.colorY     = xyY.y;
				bulb.brightness = xyY.Y;

				setBulb(bulb, id);

				send(data.channelID, strings.commands.bulb.messageC, false);
			}
			else if (lines.length == 5) {

				bulb.colorX         = parseFloat(lines[1]);
				bulb.colorY         = parseFloat(lines[2]);
				bulb.brightness     = parseFloat(lines[3]);
				bulb.transitionTime = parseInt(lines[4]);

				setBulb(bulb, id);

				send(data.channelID, strings.commands.bulb.messageC, false);
			}
			else {
				send(data.channelID, strings.commands.bulb.errorA + strings.commands.bulb.errorB + strings.commands.bulb.errorC, false);
			}
		}
		else {
			send(channelNameToID(config.options.channels.private), strings.commands.bulb.errorD, false);
		}
	}
};

// Command: !toggle
comm.toggle = function(data) {
	var name = data.message.replace(config.options.commandsymbol + data.command + " ", "");
	if (name == "" || name == config.options.commandsymbol + data.command) {
		refreshTradfriDevices(function() {
			var message = strings.commands.toggle.messageA;
			devices.forEach(function(d) {
				var on = d.on;
				if (on == true)
					on = "on";
				else
					on = "off";
				message += util.format(
					strings.commands.toggle.messageB, 
					d.name,
					on
				);
			});
			send(data.channelID, message, false);
		});
	}
	else {		
		var found = false;

		devices.forEach(function(d) {		
			if (d.name == name) {
				found = true;	
				send(data.channelID, strings.commands.toggle.messageC, false);
				hub.toggleDevice(d.id);
			}
		});

		if (!found)
			send(data.channelID, strings.commands.toggle.error, false);
	}
};

// Command: !reboot
comm.reboot = function(data) {	
    Object.keys(nptoggles).forEach(function(n, i) {
		if (nptoggles[n])
			send(n, strings.announcements.npreboot, true);
	});
	send(data.channelID, strings.commands.reboot.message, false);
	saveAllBrains();
	setTimeout(function() {
		console.log(strings.debug.stopped);
		process.exit();
	}, config.options.reboottime * 1000);
};

// Command: !reload
comm.reload = function(data) {	
	token    = JSON.parse(fs.readFileSync(config.options.configpath + "token.json", "utf8"));
	config   = JSON.parse(fs.readFileSync(config.options.configpath + "config.json", "utf8"));
	commands = JSON.parse(fs.readFileSync(config.options.configpath + "commands.json", "utf8"));
	strings  = JSON.parse(fs.readFileSync(config.options.configpath + "strings.json", "utf8"));
	gotn     = JSON.parse(fs.readFileSync(config.options.configpath + "gotn.json", "utf8"));
	mlp      = JSON.parse(fs.readFileSync(config.options.configpath + "mlp.json", "utf8"));
	channels = JSON.parse(fs.readFileSync(config.options.configpath + "channels.json", "utf8"));
	varipass = JSON.parse(fs.readFileSync(config.options.configpath + "varipass.json", "utf8"));
	printer  = JSON.parse(fs.readFileSync(config.options.configpath + "printer.json", "utf8"));
	dtls     = JSON.parse(fs.readFileSync(config.options.configpath + "dtls.json", "utf8"));
	tradfri  = JSON.parse(fs.readFileSync(config.options.configpath + "tradfri.json", "utf8"));

    send(data.channelID, strings.commands.reload.message, false);
};

// Command: !backup
comm.backup = function(data) {
	console.log(strings.debug.backup.start);
	send(data.channelID, strings.commands.backup.messageA, false);

	var output = fs.createWriteStream(config.backup.output.path);
	var archive = archiver("zip", {
		"zlib": { "level": config.backup.compression }
	});

	output.on('close', function() {
		console.log(util.format(
			strings.debug.backup.done,
			archive.pointer()
		));

		embed(channelNameToID(config.options.channels.private), strings.commands.backup.messageB, config.backup.output.path, util.format(
			config.backup.output.file,
			moment.tz(new Date(), "UTC").format("YYYY-MM-DD_HH-mm")
		), false, true);
	});

	archive.on('warning', function(err) {
		console.log(util.format(
			strings.debug.backup.error,
			"Warning: " + err
		));
		send(channelNameToID(config.options.channels.private), util.format(
			strings.commands.backup.error,
			"Warning: " + err			
		), false);
	});

	archive.on('error', function(err) {
		console.log(util.format(
			strings.debug.backup.error,
			"Error: " + err
		));
		send(channelNameToID(config.options.channels.private), util.format(
			strings.commands.backup.error,
			"Error: " + err			
		), false);
	});

	archive.pipe(output);

	config.backup.input.entries.forEach(function(e) {
		archive.directory(config.backup.input.path + e + "/", e);
	});

	archive.finalize();
};

// Status Variables
var jobs      = [];
var phases    = [];
var started   = false;
var apifail   = false;
var filefail  = false;
var npstarted = false;
var isplushie = false;
var npradio   = {};
var np        = {};
var brains    = {};
var messages  = {};
var hTrack    = {};
var startTime;

// Persistant Objects
var bot;
var hub;
var devices;
var lyrics;
var artwork;
var nptoggles;
var blacklist;

// Callback for downloading of files. 
var download = function(uri, filename, callback) {
		request.head(uri, function(err, res, body) {
			console.log(strings.debug.download.start);

			request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
		});
	};

/*
 * Formats a mention string.
 * @param  id  ID to mention.
 * @return     String usable by Discord as a mention.
 */
function mention(id) {
	return util.format(config.options.mention, id);
}

/*
 * Formats a role mention string.
 * @param  id  ID to mention.
 * @return     String usable by Discord as a mention.
 */
function mentionRole(id) {
	return util.format(config.options.mentionrole, id);
}

/*
 * Sends a large message to some chat using multiple messages. Used for lyrics.
 * @param  data     Data of the message.
 * @param  list     List to be sent.
 * @param  message  Initial message string.
 */
function sendLargeMessage(data, list, message, format) {

	var length = message.length;
	var multi = [];

	list.forEach(function(l, i) {
		var line = l;
		if (format && line.length > 0) {
			while (line[line.length - 1] == " ")
				line = line.slice(0, -1);
			line = config.options.lyricformat + line + config.options.lyricformat;
		}
		line += "\n";

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
 * Executes an interraction command on one person or more people.
 * @param  data  Data of the message.
 */
function doInterraction(data) {
	if (!isplushie) {
		if (data.data.d.mentions[0] != null) {
			if (isMentioned(bot.id, data.data)) {
				if (data.command == "unplushie") {
					send(data.channelID, strings.commands[data.command].error, true);
				}
				else {
					if (data.command == "plushie")
						isplushie = true;

					send(data.channelID, strings.commands[data.command].self, true);
				}
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
	else {
		if (data.command == "unplushie" && isMentioned(bot.id, data.data)) {
			isplushie = false;
			send(data.channelID, util.format(
				strings.commands[data.command].self, 
				mention(data.userID)
			), true);
		}
		else
			send(data.channelID, strings.commands["plushie"].error, true);
	}
}

/*
 * Parses a given channel name to retrieve the correct ID.
 * @param  name  The input name to look for.
 * @return       ID of the channel.
 */
function channelNameToID(name) {
	var found = false;
	var id = null;

	channels.list.forEach(function(c) {
		if (c.name == name && !found)
			id = c.id;
	});

	return id;
}

/*
 * Parses a given channel ID to retrieve the correct name.
 * @param  id  The input ID to look for.
 * @return     Name of the channel.
 */
function channelIDToName(id) {
	var found = false;
	var name = "unknown";

	channels.list.forEach(function(c) {
		if (c.id == id && !found)
			name = c.name;
	});

	return name;
}

/*
 * Parses a given channel ID to retrieve the correct brain.
 * @param  id  The input ID to look for.
 * @return     Brain of the channel.
 */
function channelIDToBrain(id) {
	var found = false;
	var brain = null;

	channels.list.forEach(function(c) {
		if (c.id == id && !found)
			brain = c.brain;
	});

	if (brain == null)
		brain = channels.default.brain;

	return brain;
}

/*
 * Parses VariPass data to return a certain variable.
 * @param  data  VariPass data to search in.
 * @param  id    The ID of the variable to look for.
 * @return       The VariPass variable with all the data.
 */
function findVariable(data, id) {
	var found    = false;
	var variable = null;

	data.list.forEach(function(v) {
		if (v.id == id && !found)
			variable = v;
	});

	return variable;
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
 * @param  start    Starting date.
 * @param  stop     Final date.
 * @param  timezone The timezone to calculate for.
 * @return          String of time left and final time.
 */
function getTimeLeft(start, stop, timezone) {
	var diff = (stop - start) / 60000;
	var time = {};

	time.minutes = Math.floor(diff % 60);
	diff = Math.floor(diff / 60);
	time.hours = Math.floor(diff % 24);
	time.days = Math.floor(diff / 24);

	var momentTime = moment.tz(stop, timezone);

	return util.format(
		strings.misc.left, 
		getTimeString(time),  
		momentTime.format("ddd MMM DD, YYYY"),
		momentTime.format("HH:mm (z)")
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
 * h
 * @param  channelID h
 */
function h(channelID) {
	if (hTrack[channelID] == undefined)	{		
		hTrack[channelID] = moment();
		setTimeout(function() {
			send(channelID, strings.misc.h, true);
    	}, config.options.hmessage * 1000);
	}
	else if (moment() - hTrack[channelID] >= config.options.htimeout * 1000) {
		hTrack[channelID] = moment();
		setTimeout(function() {
			send(channelID, strings.misc.h, true);
    	}, config.options.hmessage * 1000);
	}
	else {
		hTrack[channelID] = moment();
	}
}

/*
 * Sends a message to a channel on Discord.
 * @param  id       ID of the channel to send to.
 * @param  message  String message to send.
 * @param  typing   Whether the typing delay should be added.
 */
function send(id, message, typing) {
	var channel = channelIDToName(id);

	var msg = {
		"to": id,
		"message": message
    };

    if (typing) {
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
 * @param  typing  	 Whether the typing delay should be added.
 * @param  del  	 Whether the file will be deleted after embedding.
 */
function embed(id, message, file, filename, typing, del) {
	var channel = channelIDToName(id);

	var msg = {
		"to": id,
		"file": file,
		"filename": filename,
		"message": message
    };

    if (typing) {
    	setTimeout(function() {
			console.log(util.format(
				strings.debug.embed,
				channel,
				message,
				msg.filename,
				msg.file
			));
			bot.uploadFile(msg);

		    if (del && fs.existsSync(file)) {
				fs.unlinkSync(file);
		    }
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

		if (del && fs.existsSync(file)) {
			fs.unlinkSync(file);
	    }	
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
 * @param  channelID  ID of the channel to check whitelist of.
 * @return            Boolean whether the channel is whitelisted.
 */
function processWhitelist(channelID) {
	var okay = false;
	channels.list.forEach(function(c) {
		if (c.id == channelID && c.learn)
			okay = true;
	});
	return okay;
}

function processBlacklist(userID) {
	var okay = true;
	if (blacklist[userID] != undefined) {
		okay = false;
	};
	return okay;
}

function setMood(name) {
	tradfri.moods.forEach(function(m) {	
		if (m.name == name) {
			found = true;	
			refreshTradfriDevices(function() {
				m.devices.forEach(function(d1) {
					devices.forEach(function(d2) {
						if (d1.name == d2.name) {
							setBulb(d1.config, d2.id);
						}
					});
				});	
			});
		}
	});	
}

function setBulb(bulb, id) {
	var newBulb = normalize(bulb);	

	hub.setDeviceState(id, newBulb).then((result) => {

	}).catch((error) => {
		console.log(strings.debug.tradfri.errorB);
		setBulb(bulb, id);
	});
}

function normalize(bulb) {	
	var newBulb = Object.assign({}, bulb);
	if (newBulb.colorX != undefined) {
		newBulb.colorX = Math.round(newBulb.colorX * 65535);
	}
	if (newBulb.colorY != undefined) {
		newBulb.colorY = Math.round(newBulb.colorY * 65535);
	}
	if (newBulb.brightness != undefined) {
		newBulb.brightness = Math.round(newBulb.brightness * 254);
	}
	return newBulb;
}

/*
 * Opens brain data from a file.
 * @param  name  Name of the brain.
 */
function openBrain(name) {
	var path = config.brain.path + name;

	if (fs.existsSync(path)) {
		readline.createInterface({
		    "input": fs.createReadStream(path),
		    "terminal": false
		}).on("line", function(line) {
			messages[name].push(line);
			brains[name].addMass(line.replace(/<.*>/g, ""));
		});
	}
}

/*
 * Saves brain data to a file.
 * @param  name  Name of the brain.
 */
function saveBrain(name) {
	if (messages[name].length > config.brain.maxlines)
		messages[name].splice(0, messages[name].length - config.brain.maxlines);

	var path = config.brain.path + name;

	var file = fs.createWriteStream(path + ".new");

	file.on("error", function(err) {
		console.log(util.format(
			strings.debug.brain.error, 
			err
		));
	});

	messages[name].forEach(function(m) {
		file.write(m + "\n", "utf-8");
	});

	file.end();

	setTimeout(function() {
		fs.rename(path + ".new", path, function(e) {
		});
    }, 1000);		
}

/*
 * Saves all brain data.
 */
function saveAllBrains() {
	Object.keys(brains).forEach(function(b) {
		saveBrain(b);
	});
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
				send(channelNameToID(config.options.channels.announceA), util.format(
					strings.announcements.gotn.long,
					getTimeString(dateLong)
				), true);
			}, function () {}, true);

		// Short air-time announcement.
		var jobShort = new CronJob(new Date(date - short), function() {
				send(channelNameToID(config.options.channels.announceA), util.format(
					strings.announcements.gotn.shortA,
					getTimeString(dateShort)
				), true);
				send(channelNameToID(config.options.channels.announceB), util.format(
					strings.announcements.gotn.shortB,
					getTimeString(dateShort)
				), true);
			}, function () {}, true);

		// Now air-time announcement.
		var jobNow = new CronJob(new Date(date), function() {
				send(channelNameToID(config.options.channels.announceA), strings.announcements.gotn.nowA, true);
				send(channelNameToID(config.options.channels.announceB), util.format(
					strings.announcements.gotn.nowB,
					mentionRole(config.options.squadid)
				), true);
				setMood("gotn");

			    setTimeout(function() {

					send(channelNameToID(config.options.channels.private), strings.debug.nptoggles.autoon, false);
			    	config.options.channels.nowplaying.forEach(function(n, i) {
			    		nptoggles[channelNameToID(n)] = true;
			    	});
					fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");

			    }, config.options.starttime * 1000);
			}, function () {}, true);

		// After air-time announcement.
		var jobAfter = new CronJob(new Date(date - after), function() {
				send(channelNameToID(config.options.channels.announceA), strings.announcements.gotn.afterA, true);
				send(channelNameToID(config.options.channels.announceB), strings.announcements.gotn.afterB, true);
				setMood("norm");

				send(channelNameToID(config.options.channels.private), strings.debug.nptoggles.autooff, false);
		    	config.options.channels.nowplaying.forEach(function(n, i) {
		    		if (nptoggles[channelNameToID(n)] != undefined)
		    			delete nptoggles[channelNameToID(n)];
		    	});
				fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");

			}, function () {}, true);

		jobs.push(jobLong);
		jobs.push(jobShort);
		jobs.push(jobNow);
		jobs.push(jobAfter);
	});

	console.log(strings.debug.announcements.done);
}

/*
 * Processes the phase data for announcements.
 */
function processPhases() {
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
    			send(channelNameToID(config.options.channels.phases), message, true);
			}, function () {}, true);
		jobs.push(job);
	});
}

/*
 * Called if phases were successfully loaded.
 */
function phaseSuccess() {
	fs.writeFileSync(config.options.phasepath, JSON.stringify(phases), "utf-8");
	processPhases();
	console.log(strings.debug.phases.done);

	loadBrain();
	loadLyrics();
	loadArtwork();
	loadNPToggles();
	loadBlacklist();
	loadTimezones();
	loadTradfri();
	loadBot();
}

/*
 * Called if phases were not loaded.
 */
function phaseFail() {
    apifail = true;

	if (fs.existsSync(config.options.phasepath)) {
		console.log(strings.debug.phases.file);		
		phases = JSON.parse(fs.readFileSync(config.options.phasepath, "utf8"));
		processPhases();
		console.log(strings.debug.phases.filed);
	}
	else {
    	filefail = true;
		console.log(strings.debug.phases.no);
	}

	loadBrain();
	loadLyrics();
	loadArtwork();
	loadNPToggles();
	loadBlacklist();
	loadTimezones();
	loadTradfri();
	loadBot();
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

	        phaseSuccess();
	    }
	}
	xhr.onerror = function(err) {
	    console.log(util.format(
	    	strings.debug.phases.error,
	    	err.target.status
	    ));
	    xhr.abort();

	    phaseFail();
	}
	xhr.ontimeout = function() {
	    console.log(util.format(
	    	strings.debug.phases.timeout,
	    	err.target.status
	    ));
	    xhr.abort();

	    phaseFail();
	}

	xhr.send();
}

/*
 * Loads the brain data, or creates new.
 */
function loadBrain() {
	channels.list.forEach(function(c) {
		if (brains[c.brain] == undefined) {
			brains[c.brain] = new jsmegahal(config.brain.markov, config.brain.default);
		}
		if (messages[c.brain] == undefined) {
			messages[c.brain] = [];
		}
	});

	Object.keys(brains).forEach(function(b) {
		if (fs.existsSync(config.brain.path + b)) {
			console.log(util.format(
				strings.debug.brain.old,
				b
			));
			openBrain(b);
			console.log(util.format(
				strings.debug.brain.done,
				b
			));
		}
		else {
			saveBrain(b);
			console.log(util.format(
				strings.debug.brain.new,
				b
			));
		}
	});	
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
 * Loads the artwork data, or creates new.
 */
function loadArtwork() {
	artwork = {};

	if (fs.existsSync(config.options.artworkpath)) {
		console.log(strings.debug.artwork.old);
		artwork = JSON.parse(fs.readFileSync(config.options.artworkpath, "utf8"));
		console.log(strings.debug.artwork.done);
	}
	else {
	    fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");
		console.log(strings.debug.artwork.new);
	}
}

/*
 * Loads the Now Playing toggle data, or creates new.
 */
function loadNPToggles() {
	nptoggles = {};

	if (fs.existsSync(config.options.nptogglespath)) {
		console.log(strings.debug.nptoggles.old);
		nptoggles = JSON.parse(fs.readFileSync(config.options.nptogglespath, "utf8"));
		console.log(strings.debug.nptoggles.done);
	}
	else {
	    fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");
		console.log(strings.debug.nptoggles.new);
	}
}

/*
 * Loads the blacklist toggle data, or creates new.
 */
function loadBlacklist() {
	blacklist = {};

	if (fs.existsSync(config.options.blacklistpath)) {
		console.log(strings.debug.blacklist.old);
		blacklist = JSON.parse(fs.readFileSync(config.options.blacklistpath, "utf8"));
		console.log(strings.debug.blacklist.done);
	}
	else {
	    fs.writeFileSync(config.options.blacklistpath, JSON.stringify(blacklist), "utf-8");
		console.log(strings.debug.blacklist.new);
	}
}

/*
 * Loads the timezone data.
 */
function loadTimezones() {
	console.log(strings.debug.timezones.load);

	var timezoneData = require("./node_modules/moment-timezone/data/packed/latest.json");
	moment.tz.load(timezoneData);

	console.log(strings.debug.timezones.done);
}

/*
 * Loads the Tradfri client.
 */
function loadTradfri() {

	hub = tradfrilib.create({
	    "coapClientPath": config.options.coappath,
	    "identity":       dtls.identity,
	    "preSharedKey":   dtls.preSharedKey,
	    "hubIpAddress":   dtls.hubIpAddress
	});

	refreshTradfriDevices(function() {
	});
}

function refreshTradfriDevices(callback) {
	console.log(strings.debug.tradfri.connect);

	hub.getDevices().then((result) => {

		devices = result.filter(function(d) {
	    	return d.color != undefined;
		});

		console.log(util.format(
		    strings.debug.tradfri.done,
		    devices.length
		));

		devices.forEach(function(d) {
			console.log(util.format(
			    strings.debug.tradfri.bulb,
			    d.name,
			    d.id,
			    d.type,
			    d.color,
			    d.brightness,
			    d.on
			));
		});

		callback();

	}).catch((error) => {
		console.log(strings.debug.tradfri.errorA);
		refreshTradfriDevices(callback);
	});
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
	    	if (apifail && filefail)
		    	send(channelNameToID(config.options.channels.private), util.format(
		    		strings.misc.filefail,
		    		package.version
		    	), false);
		    else if (apifail)
		    	send(channelNameToID(config.options.channels.private), util.format(
		    		strings.misc.apifail,
		    		package.version
		    	), false);
	    	else	
		    	send(channelNameToID(config.options.channels.private), util.format(
		    		strings.misc.load,
		    		package.version
		    	), false);

		    Object.keys(nptoggles).forEach(function(n, i) {
        		if (nptoggles[n])
        			send(n, strings.announcements.npback, true);
        	});

	    	loopNowPlaying();
	    	setTimeout(loopBrainSave, config.brain.timeout * 1000);
	    }
	});

	bot.on("guildMemberAdd", function(user) {
		if (user.guild_id == config.options.serverid) {
			console.log(util.format(
				strings.debug.welcome,
				user.username
			));
			send(channelNameToID(config.options.channels.welcome), util.format(
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

		    commands.list.forEach(function(c) {
		    	if (command == config.options.commandsymbol + c.command && nocommand) {
		    		if (c.type == "private") {
		    			if (userID == config.options.adminid) {
				    		comm[c.command](packed);
				    		nocommand = false;
		    			}
		    			else {
		    				send(channelID, util.format(
								strings.misc.noadmin,
								mention(userID)
							), true);
		    				nocommand = false;
		    			}
		    		}
		    		else if (c.type == "dj") {
		    			var roleFound = false;

		    			if (userID == config.options.adminid)
			    			roleFound = true;

		    			if (
		    				!roleFound &&
		    				bot.channels[channelID] != undefined &&
		    				bot.servers[bot.channels[channelID].guild_id] != undefined &&
		    				bot.servers[bot.channels[channelID].guild_id].members[userID] != undefined
		    				) {

			    			bot.servers[bot.channels[channelID].guild_id].members[userID].roles.forEach(function (r1, i) {
								config.options.djroles.forEach(function (r2, j) {
				    				if (r1 == r2) {
			    						roleFound = true;
					    			}
				    			});
			    			});
		    			}

	    				if (!roleFound && bot.channels[channelID] == undefined)	
	    					roleFound = true;

		    			if (roleFound) {
							comm[c.command](packed);
				    		nocommand = false; 			
		    			}
		    			else {
							send(channelID, util.format(
								strings.misc.noperm,
								mention(userID)
							), true);
		    			}
		    		}
		    		else if (c.type == "interraction") {
		    			doInterraction(packed);
		    		}
		    		else {
			    		comm[c.command](packed);
			    		nocommand = false;
			    	}
		    	}
		    });
		}
		else {
			if (message == "h")
				h(channelID);
		    // When the bot is mentioned.
		    if (isMentioned(bot.id, data)) {
				console.log(util.format(
					strings.debug.chatting,
					user,
					message
				));
		    	send(channelID, mention(userID) + " " + brains[channelIDToBrain(channelID)].getReplyFromSentence(message), true);
		    }
		    // All other messages.
		    if (data.d.author.id != bot.id && processWhitelist(channelID) && processBlacklist(userID)) {
	    		brains[channelIDToBrain(channelID)].addMass(message.replace(/<.*>/g, ""));
	    		messages[channelIDToBrain(channelID)].push(message);
		    }
		}
	});

	bot.on("disconnect", function(erMsg, code) {
	    console.error(strings.debug.disconnected);
	    // Wait for reconnect to prevent spamming.
	    setTimeout(function() {
			bot.connect();
    	}, config.options.reconnecttime * 1000);	    
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
	    	var response
	    	try {
				response = JSON.parse(xhr.responseText);
			}
			catch(error) {
			}
	        if (
	        	response != undefined && 
	        	response.icestats != undefined && 
	        	response.icestats.source != undefined
	        	) {
		        if (npradio == undefined || npradio.title != response.icestats.source.title || npradio.artist != response.icestats.source.artist) {        		
		        	npradio = JSON.parse(xhr.responseText).icestats.source;
		        	if (npradio.artist != undefined)
		        		npradio.nowplaying = npradio.artist + config.separators.track + npradio.title;
		        	else
		        		npradio.nowplaying = npradio.title;


		        	np = JSON.parse(xhr.responseText).icestats.source;
		        	if (np.artist != undefined)
		        		np.nowplaying = np.artist + config.separators.track + np.title;
		        	else
		        		np.nowplaying = np.title;

		        	if (npstarted)
			        	Object.keys(nptoggles).forEach(function(n, i) {
			        		if (nptoggles[n])
			        			send(n, util.format(
				    				strings.announcements.nowplaying,
				    				np.nowplaying
				    			), true);
			        	});
			        else
	        		npstarted = true;
		        }
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
	saveAllBrains();
	setTimeout(loopBrainSave, config.brain.timeout * 1000);
}

// Start the bot.
startTime = new Date();
console.log(strings.debug.started);
console.log(util.format(
	strings.debug.startedtime,
	moment.tz(startTime, "UTC").format("YYYY-MM-DD, HH:mm")
));
loadAnnouncements();
loadPhases();