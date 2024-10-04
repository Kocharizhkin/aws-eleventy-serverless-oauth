const { OAuth, getCookie, generateCsrfToken } = require("./util/auth.js");
const providers = require('./util/providers.js');

/* Do initial auth redirect */
exports.handler = async (event, context) => {

  if (!event.queryStringParameters) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'No token found',
      })
    }
  }

  const csrfToken = generateCsrfToken();
  const provider = event.queryStringParameters.provider;
  const secureHost = event.headers.Referer
  
  let oauth = new OAuth(provider, secureHost);
  let config = oauth.config;

  console.log(event)

  const redirectUrl = (new URL(event.multiValueQueryStringParameters.securePath, config.secureHost)).toString();

  console.log("Redirect URI from auth before: ", redirectUrl);
  console.log("Redirect URI from auth: ", config.redirect_uri);

  /* Generate authorizationURI */
  const authorizationURI = oauth.authorizationCode.authorizeURL({
    redirect_uri: config.redirect_uri,
    /* Specify how your app needs to access the user’s account. */
    scope: providers[provider].scope || '',
    /* State helps mitigate CSRF attacks & Restore the previous state of your app */
    state: `url=${redirectUrl}&csrf=${csrfToken}&provider=${provider}`,
  });

  // console.log( "[auth-start] SETTING COOKIE" );

  /* Redirect user to authorizationURI */
  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': getCookie("_11ty_oauth_csrf", csrfToken, 60*2), // 2 minutes
      Location: authorizationURI,
      'Cache-Control': 'no-cache' // Disable caching of this response
    },
    body: '' // return body for local dev
  }
}