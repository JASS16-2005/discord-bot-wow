require('dotenv').config();

const config = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID ? String(process.env.GUILD_ID) : null,
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID ? String(process.env.WELCOME_CHANNEL_ID) : null,
  autoRoleId: process.env.AUTO_ROLE_ID ? String(process.env.AUTO_ROLE_ID) : null
};

// Validar configuración
if (!config.token) throw new Error('❌ DISCORD_TOKEN no configurado en .env');
if (!config.guildId) throw new Error('❌ GUILD_ID no configurado en .env');
if (!config.autoRoleId) throw new Error('❌ AUTO_ROLE_ID no configurado en .env');

console.log('⚙️ Configuración cargada:');
console.log(`  Token: ${config.token.slice(0, 20)}...`);
console.log(`  Guild ID: ${config.guildId}`);
console.log(`  Welcome Channel ID: ${config.welcomeChannelId}`);
console.log(`  Auto Role ID: ${config.autoRoleId}`);

module.exports = config;
