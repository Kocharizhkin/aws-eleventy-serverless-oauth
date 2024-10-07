const { AuthorizationCode } = require('simple-oauth2');
const cookie = require("cookie");
const fetch = require('node-fetch');

const providers = require('./providers.js');

class OAuth {
  constructor(provider, secureHost) {
    this.provider = provider;
    this.secureHost = secureHost; // Assign secureHost from constructor
    
    let config = this.config;
    this.authorizationCode = new AuthorizationCode({
      client: {
        id: config.clientId,
        secret: config.clientSecret
      },
      auth: {
        tokenHost: config.tokenHost,
        tokenPath: config.tokenPath,
        authorizePath: config.authorizePath
      }
    });
  }

  get config() {
    const cfg = {
      secureHost: this.secureHost, // Use the secureHost passed via constructor
      sessionExpiration: 60 * 60 * 8, // in seconds, this is 8 hours

      /* redirect_uri is the callback url after successful signin */
      redirect_uri: (new URL('auth_callback', this.secureHost)).toString(), // Use secureHost instead of SITE_URL
    };

    if (this.provider === "netlify") {
      Object.assign(cfg, providers.netlify);
    } else if (this.provider === "github") {
      Object.assign(cfg, providers.github);
    } else if (this.provider === "gitlab") {
      Object.assign(cfg, providers.gitlab);
    } else if (this.provider === "slack") {
      Object.assign(cfg, providers.slack);
    } else if (this.provider === "linkedin") {
      Object.assign(cfg, providers.linkedin);
    } else {
      throw new Error("Invalid provider passed to OAuth. Currently only `netlify`, `github`, `gitlab`, `slack` or `linkedin` are supported.");
    }

    cfg.clientId = process.env[cfg.clientIdKey];
    cfg.clientSecret = process.env[cfg.clientSecretKey];

    if (!cfg.clientId || !cfg.clientSecret) {
      throw new Error(`MISSING REQUIRED ENV VARS. ${cfg.clientIdKey} and ${cfg.clientSecretKey} are required.`);
    }

    return cfg;
  }

  async getUser(token) {
    if (!token) {
      throw new Error("Missing authorization token.");
    }

    const response = await fetch(this.config.userApi, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status !== 200) {
      throw new Error(`Error ${await response.text()}`);
    }

    const data = await response.json();
    return data;
  }
}

function getCookie(name, value, expiration, secureHost) {
  let options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: '/',
    maxAge: expiration,
  };

  /*
  // no strict cookies on localhost for local dev
  if (secureHost.startsWith("http://localhost:8080")) {
    delete options.sameSite;
  }
  */

  return cookie.serialize(name, value, options);
}

function generateCsrfToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); // eslint-disable-line
    return v.toString(16);
  });
}

module.exports = {
  OAuth,
  tokens: {
    encode: function(token) {
      return Buffer.from(token, "utf8").toString("base64");
    },
    decode: function(token) {
      return Buffer.from(token, "base64").toString("utf8");
    }
  },
  getCookie,
  generateCsrfToken,
};
