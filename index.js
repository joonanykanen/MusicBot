// Load environment variables
require('dotenv').config();

const { Client, Intents } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const scdl = require('soundcloud-downloader').default;
const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.MESSAGE_CONTENT,
    ],
  });
  
  

const prefix = '!'; // Change this to your desired prefix

const queue = new Map();

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.on('messageCreate', async message => {
    console.log('Message received:', message.content); // Log the received message
  
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
  
    console.log('Processing command'); // Log when processing a command

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else {
    message.channel.send('Invalid command!');
  }
});


async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannelId = message.member.voice.channelId;
  if (!voiceChannelId) {
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  }

  const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9-_]{11})$/;
  if (!args[1].match(youtubeUrlRegex)) {
    return message.channel.send("Please provide a valid YouTube video link!");
  }

  let songInfo, songUrl;
  try {
    songInfo = await ytdl.getInfo(args[1]);
    songUrl = songInfo.videoDetails.video_url;
  } catch (error) {
    console.error(error);
    return message.channel.send("An error occurred while trying to fetch the video information.");
  }

  const song = {
    title: songInfo.videoDetails.title,
    url: songUrl,
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannelId: voiceChannelId,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannelId,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}



  function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
      return message.channel.send("You have to be in a voice channel to skip the music!");
    }
  
    if (!serverQueue) {
      return message.channel.send("There is no song that I could skip!");
    }
  
    if (serverQueue.connection && serverQueue.connection.dispatcher) {
      serverQueue.connection.dispatcher.end();
    }
  
    // remove the current song from the queue
    serverQueue.songs.shift();
  
    // play the next song in the queue, if there is one
    if (serverQueue.songs.length > 0) {
      play(message.guild, serverQueue.songs[0]);
    }
  }
  
  

  async function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
      return message.channel.send("You have to be in a voice channel to stop the music!");
    }
  
    if (!serverQueue) {
      return message.channel.send("There is no song that I could stop!");
    }
  
    serverQueue.songs = [];
  
    if (serverQueue.connection && serverQueue.connection.dispatcher) {
      serverQueue.connection.dispatcher.end();
    }
  
    if (serverQueue.connection && serverQueue.connection.destroy) {
      serverQueue.connection.destroy();
    }
  
    queue.delete(message.guild.id);
  }
  
  
  
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.connection.destroy();
      queue.delete(guild.id);
      return;
    }
  
    const resource = createAudioResource(ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }));
    const player = createAudioPlayer();
  
    player.play(resource);
    serverQueue.connection.subscribe(player);
  
    player.on(AudioPlayerStatus.Idle, () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    });
  
    player.on('error', (error) => {
      console.error(`Error while playing audio: ${error}`);
      serverQueue.textChannel.send(`Error while playing audio: ${error}`);
    });
  
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }
  

client.login(process.env.BOT_TOKEN);
