// Load environment variables
require('dotenv').config();

const { Client, Intents } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
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
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
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
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to skip the music!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I could skip!");
    if (serverQueue.connection && serverQueue.connection.dispatcher) {
      serverQueue.connection.dispatcher.end();
    }
  }
  

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I could stop!");
    if (serverQueue.connection && serverQueue.connection.dispatcher) {
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.destroy(); // Use destroy() instead of end()
    }
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
