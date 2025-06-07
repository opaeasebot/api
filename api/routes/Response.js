const { Router } = require("express");
const express = require("express");
const router = Router();
const requestIp = require("request-ip");
const axios = require("axios");
const path = require('path');

const { getUserInfo, updateUserRoles } = require("../utils/discord");
const { loadConfig, loadConfig2, saveConfig2 } = require('../utils/config');

router.use('/static', express.static(path.join(__dirname, '../pages/static')));

async function getTokens({ code, refreshToken, grantType, redirectUri }) {
    const config = loadConfig();
    let body;
  
    if (grantType === "authorization_code") {
      if (!code) throw new Error("cod. de autorização não informado");
      body = `client_id=${config.clientid}&client_secret=${config.secret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}&scope=identify`;
    } else if (grantType === "refresh_token") {
      if (!refreshToken) throw new Error("refresh token não informado");
      body = `client_id=${config.clientid}&client_secret=${config.secret}&refresh_token=${refreshToken}&grant_type=refresh_token&redirect_uri=${redirectUri}&scope=identify`;
    } else {
      throw new Error("grant inválido");
    }
  
    const response = await axios.post(
      "https://discord.com/api/oauth2/token",
      body,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data;
}

router.get("/callback", async (req, res) => {
    config = loadConfig()
    const ip = requestIp.getClientIp(req);
    const { code } = req.query;

    if (!code) return res.status(400).json({ message: "está faltando query", status: 400 });

    res.sendFile(path.join(__dirname, '../pages/dashboard.html'));
    const redirectUri = `${config.url.replace(/\/$/, '')}/auth/callback`;
    console.log(redirectUri)
    try {
        const token = await getTokens({
          code: code,
          grantType: "authorization_code",
          redirectUri: redirectUri
        });
    
        const user = await getUserInfo(token.access_token);
        if (!user) return;
    
        const email = user.email || "não encontrado";
    
        await updateUserRoles(config.guild_id, user.id, config.role, config.token);
    
        const config2 = loadConfig2();
        config2[user.id] = {
          username: user.username,
          acessToken: token.access_token,
          refreshToken: token.refresh_token,
          email: email,
          ip: ip,
          code: code,
        };
    
        saveConfig2(config2);
      } catch (error) {
        console.error("Erro no /callback:", error.response?.data || error.message);
        return;
      }
    });

module.exports = router;