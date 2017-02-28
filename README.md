# Princess Luna
Princess Luna is a Discord bot designed for Thorinair's official Glory of The Night Discord server. The bot features multiple different commands, automatic announcements, server role management, now playing information during Thorinair's show and a chatbot.

## Features
* Announces the upcoming show airtime and when the show ends.
* Promotes and greets new members.
* Announces the Full Moon phase.
* Sends info about tracks playing on PonyvilleFM during the show.
* Features a chatbot which learns from the messages sent in the server.
* Features a variety of commands:
    - `!gotn` Lists the time left until the next GOTN episode.
    - `!np` Lists the currently playing track on a PonyvilleFM station. Use "one", "two" or "free". Defaults to "one".
    - `!lyrics` Lists lyrics of a specified track. Also functions similar like previous command to list lyrics of tracks on PonyvilleFM. Use "list" parameter to list all known lyrics.
    - `!phase` Lists info about the Moon phases.
    - `!moon` Sends an image of the Moon as it is right now.
    - `!hug` Makes her hug the user. Mentioning someone will hug them instead. You can mention multiple people.
    - `!kiss` Makes her kiss the user. Mentioning someone will kiss them instead. You can mention multiple people.
    - `!help` Lists all available commands.
* Internal commands for the admin:
    - `!togglenp` Manually toggles the automatic listing of now playing info.
    - `!addlyrics` Adds lyrics to the database. Specify a track name after the command, and lyrics in the lines below.
    - `!dellyrics` Removes lyrics from the database. Specify a track name after the command.
    - `!reboot` Reboots the bot.
