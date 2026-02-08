const { Client, Events, EmbedBuilder, ChannelType, PermissionFlagsBits, GatewayIntentBits } = require('discord.js');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

// Evento: Bot conectado
client.on(Events.ClientReady, () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log(`📊 Sirviendo a ${client.guilds.cache.size} servidor(es)`);
  client.user.setActivity('!help para más info', { type: 'WATCHING' });
});

// Evento: Nuevo miembro se une
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const guild = member.guild;
    const role = guild.roles.cache.get(config.autoRoleId);

    if (!role) {
      console.log(`❌ No se encontró el rol con ID ${config.autoRoleId}`);
      return;
    }

    // Asignar rol
    await member.roles.add(role);
    console.log(`✅ Rol '${role.name}' asignado a ${member.user.tag}`);

    // Enviar mensaje de bienvenida
    if (config.welcomeChannelId) {
      const channel = guild.channels.cache.get(config.welcomeChannelId);
      if (channel && channel.type === ChannelType.GuildText) {
        const welcomeMessage = `🛡️✨ ¡Bienvenido **${member.user.username}** al servidor LEGÍTIMO WoW! ✨🛡️

Has cruzado el portal hacia un mundo de gloria, camaradería y aventura.
Aquí, los héroes se forjan en batalla, los aliados se encuentran en cada rincón,
y la comunidad te recibe con los brazos abiertos y las alas desplegadas.

⚔️ Prepárate para luchar, explorar y conquistar.
🌟 Este es tu reino. Este es tu legado.
🔥 ¡Que comience la leyenda!`;

        const embed = new EmbedBuilder()
          .setDescription(welcomeMessage)
          .setColor('#7B3FF2')
          .setImage('https://i.imgur.com/gMZndEc.png')
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: `Miembro #${guild.memberCount} | Rol: ${role.name}` })
          .setTimestamp();

        await channel.send({ content: `${member.toString()}`, embeds: [embed] });
        console.log(`📨 Mensaje de bienvenida épico enviado a ${member.user.tag}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error al procesar la bienvenida: ${error.message}`);
  }
});

// Eventos de mensajes (para comandos)
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    // Comando !ping
    if (command === 'ping') {
      await message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    }

    // Comando !help
    if (command === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('📋 Comandos disponibles')
        .setDescription('Lista de comandos del bot')
        .setColor('#0099ff')
        .addFields(
          { name: '!ping', value: 'Verifica la latencia del bot', inline: false },
          { name: '!help', value: 'Muestra este mensaje', inline: false },
          { name: '!test', value: 'Testea la bienvenida y autorol (Admin)', inline: false },
          { name: 'Automático', value: 'El bot asigna automáticamente el rol cuando te unes', inline: false }
        );
      await message.reply({ embeds: [embed] });
    }

    // Comando !test (solo administradores)
    if (command === 'test') {
      console.log(`[TEST] Usuario: ${message.author.tag}, Guild: ${message.guild.id}`);
      
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await message.reply('❌ Solo administradores pueden usar este comando');
      }

      try {
        const guild = message.guild;
        const member = message.member;
        const botRole = guild.members.me.roles.highest;
        
        console.log(`[TEST] Buscando rol con ID: ${config.autoRoleId}`);
        const role = guild.roles.cache.get(config.autoRoleId);

        if (!role) {
          console.error(`[TEST] ❌ Rol no encontrado: ${config.autoRoleId}`);
          return await message.reply(`❌ Rol no encontrado con ID: ${config.autoRoleId}`);
        }

        console.log(`[TEST] Rol encontrado: ${role.name} (Posición: ${role.position})`);
        console.log(`[TEST] Rol del bot: ${botRole.name} (Posición: ${botRole.position})`);

        // Verificar jerarquía
        if (botRole.position <= role.position) {
          console.error(`[TEST] ❌ El rol del bot no está arriba del rol a asignar`);
          const embed = new EmbedBuilder()
            .setTitle('❌ Error de Jerarquía de Roles')
            .setColor('#ff0000')
            .setDescription(
              `El rol **${botRole.name}** (posición ${botRole.position}) no está arriba del rol **${role.name}** (posición ${role.position}).\n\n` +
              `**Solución:**\n` +
              `1. Ve a Configuración del Servidor > Roles\n` +
              `2. Arrastra **${botRole.name}** ARRIBA de **${role.name}**\n` +
              `3. Guarda los cambios`
            );
          return await message.reply({ embeds: [embed] });
        }

        // Verificar permisos
        const botPermissions = guild.members.me.permissions;
        if (!botPermissions.has(PermissionFlagsBits.ManageRoles)) {
          console.error(`[TEST] ❌ El bot no tiene permiso ManageRoles`);
          return await message.reply('❌ El bot no tiene permiso para **Manage Roles** en este servidor');
        }

        console.log(`[TEST] ✅ Jerarquía y permisos OK`);

        // Asignar rol
        try {
          console.log(`[TEST] Asignando rol a ${member.user.tag}...`);
          await member.roles.add(role);
          console.log(`[TEST] ✅ Rol asignado exitosamente`);
          
          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Test Exitoso')
            .setColor('#00ff00')
            .setDescription(`Rol **${role.name}** asignado a ${member.toString()}`);
          
          await message.reply({ embeds: [successEmbed] });

          // Enviar mensaje en canal de bienvenida
          if (config.welcomeChannelId) {
            const channel = guild.channels.cache.get(config.welcomeChannelId);
            if (channel && channel.type === ChannelType.GuildText) {
              const welcomeMessage = `🛡️✨ ¡Bienvenido **${member.user.username}** al servidor LEGÍTIMO WoW! ✨🛡️

Has cruzado el portal hacia un mundo de gloria, camaradería y aventura.
Aquí, los héroes se forjan en batalla, los aliados se encuentran en cada rincón,
y la comunidad te recibe con los brazos abiertos y las alas desplegadas.

⚔️ Prepárate para luchar, explorar y conquistar.
🌟 Este es tu reino. Este es tu legado.
🔥 ¡Que comience la leyenda!`;

              const testEmbed = new EmbedBuilder()
                .setDescription(welcomeMessage)
                .setColor('#7B3FF2')
                .setImage('https://i.imgur.com/gMZndEc.png')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Miembro #${guild.memberCount} | Rol: ${role.name} | TEST` })
                .setTimestamp();
              
              await channel.send({ embeds: [testEmbed] }).catch(err => {
                console.error(`[TEST] No puede escribir en el canal:`, err.message);
              });
            }
          }
        } catch (error) {
          console.error(`[TEST] Error al asignar rol:`, error.message);
          await message.reply(`❌ Error: ${error.message}`);
        }
      } catch (error) {
        console.error(`[TEST] Error general:`, error);
        await message.reply(`❌ Error: ${error.message}`).catch(() => {});
      }
    }
  } catch (error) {
    console.error(`❌ Error en comando: ${error.message}`);
    await message.reply('❌ Error al ejecutar el comando').catch(() => {});
  }
});

// Evento: Error
client.on('error', error => {
  console.error('❌ Error del cliente:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Rechazo no manejado:', error);
});

// Conectar bot
client.login(config.token);
