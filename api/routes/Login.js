const express = require("express");
const router = express.Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const { loadConfig, saveConfig } = require('../utils/config');

module.exports = router;

router.get("/", (req, res) => {
    const config = loadConfig();

    try {
        if (!config.clientid || !config.secret || !config.url) {
            throw new Error("mal configuração");
        }

        try {
            // Garantir que não haja barras extras no redirectUri
            const redirectUri = `${config.url.replace(/\/$/, '')}/auth/callback`; // Remove barra final, se houver

            const authUrl = oauth.generateAuthUrl({
                clientId: config.clientid,
                clientSecret: config.secret,
                scope: ["identify", "guilds.join", "email"],
                redirectUri: redirectUri
            });

            res.status(200).json({ authUrl });

        } catch(err) {
            res.status(500).json({
                message: `${err.message}`,
                status: 500
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "mal config",
            err: error.message
        });
    }
});
