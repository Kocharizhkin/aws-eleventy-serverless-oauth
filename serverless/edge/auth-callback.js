const cookie = require("cookie");
const querystring = require("querystring");
const { OAuth, tokens, getCookie } = require("./util/auth.js");

exports.handler = async (event, context) => {

  // Handle both AWS Lambda and serverless-offline query params
  const queryParams = event.queryStringParameters || event.query;

  // Exit early if queryStringParameters (or query) are missing
  if (!queryParams) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'Not authorized',
      })
    };
  }

  // Extract code and state from the query parameters
  const code = queryParams.code;
  const state = querystring.parse(queryParams.state);

  console.log("[auth-callback]", 'event', event)

  try {
    // Check if the cookie header exists
    if (!event.headers || !event.headers.Cookie) {
      throw new Error("No cookies present in the request.");
    }

    // Parse the cookies
    let cookies = cookie.parse(event.headers.Cookie || event.headers.cookie);

    // Check the CSRF token
    if (cookies._11ty_oauth_csrf !== state.csrf) {
      throw new Error("Missing or invalid CSRF token.");
    }
    if(cookies._11ty_oauth_csrf !== state.csrf) {
      throw new Error("Missing or invalid CSRF token.");
    }

    let oauth = new OAuth(state.provider, secureHost = 'https://l1f6bhxot5.execute-api.eu-north-1.amazonaws.com/dev/');
    let config = oauth.config;

    // Take the grant code and exchange for an accessToken
    const accessToken = await oauth.authorizationCode.getToken({
      code: code,
      redirect_uri: config.redirect_uri,
      client_id: config.clientId,
      client_secret: config.clientSecret
    });

    const token = accessToken.token.access_token;
    console.log( "[auth-callback]", { token } );

    // The noop key here is to workaround Netlify keeping query params on redirects
    // https://answers.netlify.com/t/changes-to-redirects-with-query-string-parameters-are-coming/23436/11
    const URI = state.url;
    // console.log( "[auth-callback]", { URI });

    /* Redirect user to authorizationURI */
    return {
      statusCode: 302,
      headers: {
        Location: URI,
        'Cache-Control': 'no-cache' // Disable caching of this response
      },
      multiValueHeaders: {
        'Set-Cookie': [
          // This cookie *must* be HttpOnly
          getCookie("_11ty_oauth_token", tokens.encode(token), oauth.config.sessionExpiration),
          getCookie("_11ty_oauth_provider", state.provider, oauth.config.sessionExpiration),
          getCookie("_11ty_oauth_csrf", "", -1),
        ]
      },
      body: '' // return body for local dev
    }

  } catch (e) {
    console.log("[auth-callback]", 'Access Token Error', e.message)
    console.log("[auth-callback]", e)
    return {
      statusCode: e.statusCode || 500,
      body: JSON.stringify({
        error: e.message,
      })
    }
  }
}
