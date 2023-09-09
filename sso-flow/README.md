# Sunbird-SSO-Helper 
<img src="https://camo.githubusercontent.com/9d07c04bdd98c662d5df9d4e1cc1de8446ffeaebca330feb161f1fb8e1188204/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4a6176615363726970742d4637444631453f7374796c653d666f722d7468652d6261646765266c6f676f3d6a617661736372697074266c6f676f436f6c6f723d626c61636b" alt="JavaScript Icon">
<img src="https://camo.githubusercontent.com/dfc69d704694f22168bea3d84584663777fa5301dcad5bbcb5459b336da8d554/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4e6f64652e6a732d3433383533443f7374796c653d666f722d7468652d6261646765266c6f676f3d6e6f64652e6a73266c6f676f436f6c6f723d7768697465" alt="Node.js Icon">

## Introduction

The `sso-sunbird-helper` package is a utility tool designed to simplify the integration of State Sign-On (SSO) with Sunbird-ed, an open-source learning platform. It provides developers with streamlined functions and methods to facilitate the implementation of SSO authentication within their applications.
![Sunbird SSO Flow Diagram](https://github.com/om-666/Sunbird-sso-flow-Flow-digram/raw/main/SunbirdSSo.jpg)
## Installation

To get started with `sso-sunbird-helper`, you need to install the package using either npm or yarn package managers:

Using npm:
```bash
npm install sso-sunbird-helper
```

Using yarn:
```bash
yarn add sso-sunbird-helper
```
- `initializeRoute`: This function is used to initiate the State Sign-On (SSO) login process for a user. To log in a user, the client must provide a link that makes a GET request to the auto-login endpoint `/v2/user/session/create?token=<jwt_token>`, where `<jwt_token>` is the JSON Web Token (JWT) representing the user's authentication.
- `handleVerifiedContactRoute`: Use this function to handle the route that deals with verified contact information. After a user's contact information has been verified during the SSO process, this function is responsible for managing the flow and actions associated with it.
- `handleSuccessRedirect`: This function is used When a user successfully authenticates via SSO and is already registered in your application, this function is configured to redirect the user directly to a resource page.It streamlines the user experience by skipping redundant registration steps.

## Importing the Package

You can incorporate the necessary methods from the package into your project using either CommonJS or ES6 module syntax.

### CommonJS Syntax

If your project utilizes CommonJS modules, import the methods into your JavaScript file as demonstrated below:

```javascript
const { initializeRoute, handleVerifiedContactRoute, handleSuccessRedirect } = require('sso-sunbird-helper/src');
```

### ES6 Module Syntax

For projects that support ES6 modules, use the following syntax to import the methods:

```javascript
import { initializeRoute, handleVerifiedContactRoute, handleSuccessRedirect } from 'sso-sunbird-helper/src';
```

## Integration into Existing ssoRoutes.js

In your `ssoRoutes.js` file in your Sunbird Ed project, you can integrate the SSO functionality into this existing file. Here's how to do it:

1. Open your existing `ssoRoutes.js` file located at `src/app/routes/ssoRoutes.js`.

2. Add the following code to your existing `ssoRoutes.js` file:

```javascript
// Import methods from sso-sunbird-helper
const { initializeRoute, handleVerifiedContactRoute, handleSuccessRedirect } = require('sso-sunbird-helper/src');

// Initialize SSO route
app.get('/v2/user/session/create', initializeRoute());

// Handle verified contact route
app.get('/v1/sso/contact/verified', handleVerifiedContactRoute());

// Handle success redirect route
app.get('/v1/sso/success/redirect', handleSuccessRedirect());
```

3. Save the changes to your `ssoRoutes.js` file.

## Example Routes

- `/v2/user/session/create`: Initializes the SSO route.
- `/v1/sso/contact/verified`: Handles the verified contact route.
- `/v1/sso/success/redirect`: Handles the success redirect route.

Make sure to configure your Express app and routes accordingly to suit your project's needs.

By following these steps, you can seamlessly incorporate the functionalities of the `sso-sunbird-helper` package into your project, facilitating the integration of SSO authentication within your Sunbird-ed applications.