const {
  Client,
  Events,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  GatewayIntentBits
} = require('discord.js');

const config = require('./config');

// Cliente optimizado: solo los intents necesarios
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bot listo
client.on(Events.ClientReady, () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
  client.user.setActivity('Legítimo WoW | !help', { type: 'WATCHING' });
});

// Función para crear embed de bienvenida
function createWelcomeEmbed(member, role, guild) {
  const welcomeMessage = `🛡️✨ ¡Bienvenido **${member.user.username}** al servidor LEGÍTIMO WoW! ✨🛡️

Has cruzado el portal hacia un mundo de gloria, camaradería y aventura.
Aquí, los héroes se forjan en batalla, los aliados se encuentran en cada rincón,
y la comunidad te recibe con los brazos abiertos y las alas desplegadas.

⚔️ Prepárate para luchar, explorar y conquistar.
🌟 Este es tu reino. Este es tu legado.
🔥 ¡Que comience la leyenda!`;

  return new EmbedBuilder()
    .setDescription(welcomeMessage)
    .setColor('#7B3FF2')
    .setImage('https://i.imgur.com/gMZndEc.png')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Miembro #${guild.memberCount} | Rol: ${role.name}` })
    .setTimestamp();
}

// Nuevo miembro
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const guild = member.guild;
    const role = guild.roles.cache.get(config.autoRoleId);

    if (!role) return console.log(`❌ Rol no encontrado: ${config.autoRoleId}`);

    await member.roles.add(role);
    console.log(`✅ Rol '${role.name}' asignado a ${member.user.tag}`);

    const channel = guild.channels.cache.get(config.welcomeChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    if (!channel.permissionsFor(guild.members.me)?.has('SendMessages')) return;

    const embed = createWelcomeEmbed(member, role, guild);
    await channel.send({ content: `${member}`, embeds: [embed] });

  } catch (error) {
    console.error(`❌ Error en bienvenida: ${error.message}`);
  }
});

// Comandos
client.on(Events.MessageCreate, async (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    if (command === 'ping') {
      return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    }

    if (command === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('📋 Comandos disponibles')
        .setDescription('**Soy el asistente oficial de Legítimo WoW.**\n\nMantengo el orden, guío a los aventureros y te ayudo a navegar todo lo relacionado con el servidor.')
        .setColor('#7B3FF2')
        .setThumbnail('https://i.imgur.com/gMZndEc.png')
        .addFields(
          { name: '⚔️ Comandos', value: '━━━━━━━━━━━━━━━━━━' },
          { name: '!ping', value: 'Verifica la latencia del bot' },
          { name: '!help', value: 'Muestra este mensaje' },
          { name: '!test', value: 'Testea la bienvenida y autorol (Admin)' },
          { name: '🛡️ Automático', value: 'El bot asigna automáticamente el rol al unirse' }
        )
        .setFooter({ text: 'Legítimo WoW - Bot Oficial' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (command === 'test') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Solo administradores pueden usar este comando');
      }

      const guild = message.guild;
      const member = message.member;
      const role = guild.roles.cache.get(config.autoRoleId);

      if (!role) return message.reply(`❌ Rol no encontrado: ${config.autoRoleId}`);

      const botRole = guild.members.me.roles.highest;

      if (botRole.position <= role.position) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Error de Jerarquía de Roles')
          .setColor('#ff0000')
          .setDescription(
            `El rol **${botRole.name}** debe estar arriba de **${role.name}**.\n\n` +
            `**Solución:**\n1. Configuración del Servidor > Roles\n2. Arrastra **${botRole.name}** arriba de **${role.name}**`
          );

        return message.reply({ embeds: [embed] });
      }

      if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply('❌ El bot no tiene permiso para **Manage Roles**');
      }

      await member.roles.add(role);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Test Exitoso')
        .setColor('#00ff00')
        .setDescription(`Rol **${role.name}** asignado a ${member}`);

      await message.reply({ embeds: [successEmbed] });

      const channel = guild.channels.cache.get(config.welcomeChannelId);
      if (channel && channel.type === ChannelType.GuildText) {
        const embed = createWelcomeEmbed(member, role, guild);
        await channel.send({ embeds: [embed] });
      }
    }

  } catch (error) {
    console.error(`❌ Error en comando: ${error.message}`);
    message.reply('❌ Error al ejecutar el comando').catch(() => {});
  }
});

// Manejo de errores
client.on('error', err => console.error('❌ Error del cliente:', err));
process.on('unhandledRejection', err => console.error('❌ Rechazo no manejado:', err));

// Login
client.login(config.token);
