const AWS = require('aws-sdk');
const nunjucks = require('nunjucks');
const cookie = require('cookie');
const { OAuth, tokens } = require("./util/auth.js");
require('dotenv').config();
const s3 = require('./s3.js');

// Configure Nunjucks (no need for local template directory since we fetch templates from S3)
nunjucks.configure({ autoescape: true });

async function handler(event, context) {
  let path = event.path;
  let authToken;
  let provider;
  let secureHost = 'https://' + event.headers.Host + '/dev/'


  // Parse cookies for authentication tokens
  if (event.headers && (event.headers.cookie || event.headers.Cookie)) {
    let cookies = cookie.parse(event.headers.Cookie || event.headers.cookie);
    if (cookies._11ty_oauth_token) {
      authToken = tokens.decode(cookies._11ty_oauth_token);
    }
    if (cookies._11ty_oauth_provider) {
      provider = cookies._11ty_oauth_provider;
    }
  }

  // authentification if tokens are presented, if not redirect to /
  let user;
  let authError;
  try {
    if (authToken && provider) {
      let oauth = new OAuth(provider, secureHost = secureHost);
      user = await oauth.getUser(authToken);
    }
  } catch (e) {
    authError = e;
    console.error("Error during authentication:", e);
  }

  // Handle the root path ("/")
  if (path === '/' || path === '') {
    try {
      const indexHtml = await s3.fetchFileFromS3('index.html');

      return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
        },
        body: indexHtml
      };
    } catch (error) {
      console.error("Error fetching index.html from S3:", error);
      return {
        isBase64Encoded: false,
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: "Failed to load index.html from S3" })
      };
    }
  }

  // Handle secure path
  if (path === '/secure') {
    if (authError || !user) {
      return {
        isBase64Encoded: false,
        statusCode: 302,
        headers: {
          Location: "/dev",
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    }

    try {
      
      const secureNunjucksTemplate = await s3.fetchFileFromS3('secure.njk');
      //render njk template with user info
      const html = nunjucks.renderString(secureNunjucksTemplate, { user });

      return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
        },
        body: html
      };
    } catch (error) {
      return {
        isBase64Encoded: false,
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: "Failed to render secure page" })
      };
    }
  }

  // Default response for unhandled paths
  return {
    isBase64Encoded: false,
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ error: "Not Found" })
  };
}

exports.handler = handler;
