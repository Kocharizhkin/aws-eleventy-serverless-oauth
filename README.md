# demo-eleventy-serverless-oauth

A demo project using OAuth to secure some of your Eleventy Serverless routes.

* [Demo](https://demo-eleventy-serverless-oauth.netlify.app)

---

* [Blog post on zachleat.com](https://www.zachleat.com/web/eleventy-login/)
* [Walk-through on YouTube](https://www.youtube.com/watch?v=At19o2Ox57Y)

## Run locally

1. Install dependencies
```
npm install
```

2. Add the aws IAM user credentials to ".env" file:
  * `AWS_ACCESS_KEY_ID`
  * `AWS_SECRET_ACCESS_KEY`
  * `BUCKET_NAME`

3. Configure the aws cli
```
aws configure
```

4. Run in local mode
```
npm run dev
```

Navigate to http://localhost:3000/dev/edge

The full login flow is supported on localhost, assuming the Redirect URI set in your OAuth Application is configured correctly.

## OAuth Application Providers

This example includes Netlify, GitHub, and GitLab providers. If you only want a subset of these providers, just remove the Login buttons that you don’t want and don’t worry about the relevant environment variables for that provider.

1. Create one or more OAuth applications:
    * [Netlify OAuth](https://app.netlify.com/user/applications/new)
    * [GitHub OAuth](https://github.com/settings/applications/new)
    * [GitLab](https://gitlab.com/-/profile/applications)
    * [Slack](https://api.slack.com/apps) (Redirect URI must be specified in separate Oauth & Permissions section)
    * [LinkedIn](https://www.linkedin.com/developers/apps) (To enable this you _must_ 1. create a LinkedIn Company Page and 2. add the [_Sign In With LinkedIn_ product under the Products tab](https://stackoverflow.com/questions/53479131/unauthorized-scope-error-in-linkedin-oauth2-authentication))
2. Add the appropriate environment variables to your `.env` file:
    * Netlify: `NETLIFY_OAUTH_CLIENT_ID` and `NETLIFY_OAUTH_CLIENT_SECRET`
    * GitHub: `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET`
    * GitLab: `GITLAB_OAUTH_CLIENT_ID` and `GITLAB_OAUTH_CLIENT_SECRET`
    * Slack: `SLACK_OAUTH_CLIENT_ID` and `SLACK_OAUTH_CLIENT_SECRET`
    * LinkedIn: `LINKEDIN_OAUTH_CLIENT_ID` and `LINKEDIN_OAUTH_CLIENT_SECRET`