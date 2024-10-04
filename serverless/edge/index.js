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

  console.log("Event received:", JSON.stringify(event));

  // Parse cookies for authentication tokens
  if (event.headers && (event.headers.cookie || event.headers.Cookie)) {
    let cookies = cookie.parse(event.headers.Cookie || event.headers.cookie);
    if (cookies._11ty_oauth_token) {
      authToken = tokens.decode(cookies._11ty_oauth_token);
      console.log("Auth token decoded:", authToken);
    }
    if (cookies._11ty_oauth_provider) {
      provider = cookies._11ty_oauth_provider;
      console.log("OAuth provider:", provider);
    }
  }

  let user;
  let authError;
  try {
    if (authToken && provider) {
      console.log("Attempting to authenticate user...", secureHost);
      let oauth = new OAuth(provider, secureHost = secureHost);
      user = await oauth.getUser(authToken);
      console.log("User authenticated:", user);
    }
  } catch (e) {
    authError = e;
    console.error("Error during authentication:", e);
  }

  // Handle the root path ("/")
  if (path === '/' || path === '') {
    try {
      console.log("Fetching index.html from S3...");
      const indexHtml = await s3.fetchFileFromS3('index.html');
      console.log("index.html successfully fetched from S3");

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
      console.log('Redirecting to root due to authError or missing user');
      return {
        isBase64Encoded: false,
        statusCode: 302,
        headers: {
          Location: "/dev",
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    } else {
      console.log('User is authenticated, no errors');
    }

    try {
      console.log("Fetching secure.njk from S3...");
      const secureNunjucksTemplate = await s3.fetchFileFromS3('secure.njk');
      console.log("secure.njk successfully fetched from S3");

      console.log("Rendering secure page using Nunjucks...");
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
      console.error("Error rendering secure.njk:", error);
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
  console.log(`Unhandled path: ${path}`);
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
