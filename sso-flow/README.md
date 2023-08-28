# sso-sunbird-helper Package Documentation

## Introduction

The `sso-sunbird-helper` package is a utility tool designed to simplify the integration of State Sign-On (SSO) with Sunbird-ed, an open-source learning platform. It provides developers with streamlined functions and methods to facilitate the implementation of SSO authentication within their applications.

## Installation

To get started with `sso-sunbird-helper`, you need to install the package using npm or yarn package managers:

```bash
npm install sso-sunbird-helper
 
yarn add sso-sunbird-helper
```

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

## Usage

After importing the methods, you can integrate them into your Express app, as illustrated below:

```javascript
const express = require('express');
const app = express();

// Import methods from sso-sunbird-helper
const { initializeRoute, handleVerifiedContactRoute, handleSuccessRedirect } = require('sso-sunbird-helper/src');

// Initialize SSO route
app.get('/v2/user/session/create', initializeRoute());

// Handle verified contact route
app.get('/v1/sso/contact/verified', handleVerifiedContactRoute());

// Handle success redirect route
app.get('/v1/sso/success/redirect', handleSuccessRedirect());
```

By following these steps, you can seamlessly incorporate the functionalities of the `sso-sunbird-helper` package into your project, facilitating the integration of SSO authentication within your Sunbird-ed applications.