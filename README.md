It looks like you've pasted the text as plain text, and it's not rendering properly as markdown. Markdown relies on specific formatting and syntax to create headings, lists, links, and other elements.

To fix this, you need to ensure that your README file is formatted using proper markdown syntax. If you're using a text editor to create your README, make sure it's set to markdown mode or format. Here's the correctly formatted version of the README you provided:

```markdown
# Sunbird Ed State Sign On Package

[![npm version](https://img.shields.io/npm/v/sunbird-ed-state-sign-on.svg)](https://www.npmjs.com/package/sunbird-ed-state-sign-on)

A package for managing state sign-on in Sunbird Ed applications.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Installation

You can install the package via npm:

```bash
npm install sunbird-ed-state-sign-on
```

## Usage

```javascript
const { signIn, signOut, isAuthenticated, getUser } = require('sunbird-ed-state-sign-on');

// Sign in a user
signIn(username, password)
  .then(user => {
    console.log('User signed in:', user);
  })
  .catch(error => {
    console.error('Sign-in error:', error);
  });

// Check if a user is authenticated
if (isAuthenticated()) {
  console.log('User is authenticated');
} else {
  console.log('User is not authenticated');
}

// Get the authenticated user's information
const user = getUser();
console.log('Authenticated user:', user);

// Sign out the user
signOut();
console.log('User signed out');
```

## API

### `signIn(username, password)`

Signs in a user with the provided username and password. Returns a Promise that resolves with the user's information if successful.

### `signOut()`

Signs out the currently authenticated user.

### `isAuthenticated()`

Returns `true` if a user is currently authenticated, otherwise returns `false`.

### `getUser()`

Returns the information of the currently authenticated user, or `null` if no user is authenticated.

## Contributing

Contributions are welcome! If you find a bug or want to suggest a new feature, please open an issue or submit a pull request. Make sure to read our [contribution guidelines](CONTRIBUTING.md) before getting started.

## License

This project is licensed under the [MIT License](LICENSE).
```

Copy and paste this version into your README file to ensure it's formatted correctly.
