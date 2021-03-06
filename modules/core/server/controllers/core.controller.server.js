'use strict';

var crypto = require('crypto');
var jwt = require('jwt-simple');
var nodemailer = require('nodemailer');
var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');

var config = require(path.resolve('./lib/config'));
var db = require(path.resolve('./lib/db.js'));
var transporter = nodemailer.createTransport(config.mailTransporter);

exports.checkAuth = checkAuth;
exports.deleteUser = deleteUser;
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.logIn = logIn;
exports.renderIndex = renderIndex;
exports.resetPassword = resetPassword;
exports.sendResetToken = sendResetToken;
exports.signUp = signUp;
exports.updateUser = updateUser;

//////////

/**
 * Check if a token was included on the request and find the user that is associated with that token.
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 * @param {Function} next The next step in the express middleware.
 */

function checkAuth (req, res, next) {
  // Get the token from the request
  var token = req.headers['x-access-token'];
  // If no token, send 403
  if (!token) {
    res.status(403).send('no token provided');
  } else {
    // Decode the token to get the user info
    var user = jwt.decode(token, config.secret);

    // Set up user query
    var userQuery = {
      where: {
        email: user.email
      },
      include: [{
        model: db.Role
      }]
    };

    // Look for user in the database
    db.User.findOne(userQuery)
      .then(checkUser)
      .catch(sendError);
  }

  //////////

  function checkUser(foundUser) {
    // If found, send user email and roles back
    if (foundUser) {
      var resJson = {
        user: {
          email: foundUser.email,
          roles: stripRoleNames(foundUser.Roles)
        }
      };

      res.status(200).send(resJson);
    } else {
      // If user not found, send status 401
      res.status(401).send('User does not exist');
    }
  }

  function sendError () {
    res.status(500).send('Database error: Error finding user in database');
  }
}

/**
 * Delete a user
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function deleteUser (req, res) {
  req.user.destroy()
    .then(function () {
      res.status(200).send('User successfully deleted');
    });
}

/**
 * Sign up a given user
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function getUsers (req, res) {

  var userQuery = {
    include: [{
      model: db.Role
    }]
  };

  db.User.findAll(userQuery)
    .then(sendUsers)
    .catch(send400);

  //////////

  function sendUsers (foundUsers) {
    var resJson = [];
    foundUsers.forEach(function (user) {
      var tempUser = {};
      tempUser.id = user.id;
      tempUser.email = user.email;
      tempUser.roles = stripRoleNames(user.Roles);
      resJson.push(tempUser);
    });

    res.status(200).send(resJson);
  }

  function send400 () {
    // Invalid Password
    res.status(400).send('Database Error: could not retrieve users');
  }
}

/**
 * Get a user by id
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 * @param {function} next The next step in the express middleware.
 * @param {string} id - The user id passed in through the url
 */

function getUserById (req, res, next, id) {

  var userQuery = {
    where: {
      id: id
    },
    include: [{
      model: db.Role
    }]
  };

  db.User.findOne(userQuery)
    .then(goToNext)
    .catch(send500);

  //////////

  function goToNext (user) {
    req.user = user;
    req.user.roles = stripRoleNames(user.Roles);
    next();
  }

  function send500 () {
    res.status(500).send('Database error: could not find user');
  }
}

/**
 * Login a given user
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function logIn (req, res) {
  // Force the user's email to lowercase
  var email = req.body.email.toLowerCase();
  var password = req.body.password;

  // Query the database for the user by email
  var userQuery = {
    where: {
      email: email
    },
    include: [{
      model: db.Role
    }]
  };

  db.User.findOne(userQuery)
    .then(comparePassword)
    .catch(send500);

  //////////

  function comparePassword (user) {
    // Check to see if the user was found.
    if (!user) {
      // No user was found.
      res.status(400).send('User does not exist or password is incorrect');
    } else {
      // User was Found
      // Compare the provided password to the password in the database
      return user.comparePassword(password)
        .then(checkMatch)
        .catch(send400);
    }

    function checkMatch (isMatch) {
      // Check to see if the passwords match
      if (isMatch) {
        // The passwords match
        // Create a user object to send to the client
        var userResponse = {
          email: user.email,
          roles: stripRoleNames(user.Roles)
        };

        // Create a token, and encode the userResponse
        var token = jwt.encode(userResponse, config.secret);

        var resJson = {
          token: token,
          user: userResponse
        };

        // Send the token and user object to the client
        res.send(resJson);
      } else {
        // Passwords do not match
        res.status(400).send('User does not exist or password is incorrect');
      }
    }
  }

  function send400 () {
    // Invalid Password
    res.status(400).send('Invalid Password');
  }

  function send500 (err) {
    res.status(500).send('An error occured while logging in.');
  }
}

/**
 * Reset the Password
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function resetPassword (req, res) {
  var user = {
    password: req.body.password,
    passwordResetToken: null
  };
  var userQuery = {
    where: {
      passwordResetToken: req.body.token
    }
  };
  db.User.update(user, userQuery)
    .then(send200)
    .catch(send500);

  function send200 () {
    res.status(200).send('Successfully updated the user.');
  }

  function send500 () {
    res.status(500).send('A database error occured.');
  }
}

/**
 * Send the Password Reset Token to the User's Email
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function sendResetToken (req, res) {
  var randomToken = Promise.promisify(crypto.randomBytes);

  randomToken(20)
    .then(convertBuffer)
    .then(saveToken)
    .then(sendEmail)
    .catch(send500);

  //////////

  function convertBuffer (buffer) {
    return buffer.toString('hex');
  }

  function saveToken (token) {
    var user = {
      passwordResetToken: token
    };
    var userQuery = {
      where: {
        email: req.body.email
      }
    };

    req.user = user;
    req.user.email = req.body.email;

    return db.User.update(user, userQuery);
  }

  function send500 (err) {
    res.status(500).send('Could not generate a token.');
  }

  function sendEmail () {
    transporter.sendMail({
      from: 'noreply@nobsjs.com',
      to: req.user.email,
      subject: 'Password Reset',
      html: req.user.passwordResetToken
    }, function (err) {
      if(err) {
        send500(err);
      } else {
        res.send('Go check your email and click on the link provided.');
      }
    });
  }
}

/**
 * Strips an array of Roles returned from the Database to an array of role names
 *
 * @param {Array} roles An Array
 * @returns {Array} roleNames An array of role names
 */
function stripRoleNames (roles) {
  var roleNames = [];
  for(var r = 0; r < roles.length; r++) {
    roleNames.push(roles[r].name);
  }
  return roleNames;
}

/**
 * Render the index page for the angular application.
 *
 * @param {ExpressRequestObject} req
 * @param {ExpressResponseObject} res
 */

function renderIndex (req, res) {
  Promise.all([db.Page.findAll(), getTabs()])
    .then(render)
    .catch(send500);

  //////////

  function getTabs () {
    var tabQuery = {
      include : [
        {
          model: db.Role
        }
      ]
    };
    return db.Tab.findAll(tabQuery)
      .then(processTabs);
  }

  function processTabs (tabs) {
    var response = [];
    tabs.forEach(function (tab) {
      var tempTab = {};
      tempTab.title = tab.title;
      tempTab.uisref = tab.uisref;
      tempTab.visibleRoles = [];
      tab.Roles.forEach(function (role) {
        tempTab.visibleRoles.push(role.name);
      });
      response.push(tempTab);
    });
    return response;
  }

  function render (results) {
    res.render(path.resolve('./modules/core/server/views/index.core.view.server.html'), {
      pages: results[0],
      tabs: results[1]
    });
  }

  function send500() {
    res.status(500).send('Database Error Occurred');
  }
}

/**
 * Sign up a given user
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function signUp (req, res) {
  // Force the email to lowercase
  var email = req.body.email.toLowerCase();
  var password = req.body.password;
  var displayName = displayName || 'Anonymous';
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;

  // Create user query
  var userQuery = {
    displayName: displayName,
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password
  };

  db.User.create(userQuery)
    .then(addDefaultRole)
    .then(findNewUser)
    .then(createToken)
    .catch(send400);

  //////////

  function addDefaultRole (user) {
    // Get default role from database
    var defaultRoleQuery = {
      where: {
        name: 'user'
      }
    };

    return db.Role.findOne(defaultRoleQuery)
      .then(setRole);

    function setRole (role) {
      return user.addRole(role);
    }
  }

  function createToken (user) {
    var token = jwt.encode(user, config.secret);
    var resJson = {
      token: token,
      user: {
        email: user.email,
        roles: stripRoleNames(user.Roles)
      }
    };

    res.send(resJson);
  }

  function findNewUser () {
    var userQuery = {
      where: {
        email: email
      },
      include: [{
        model: db.Role
      }]
    };

    return db.User.findOne(userQuery);
  }

  function send400 () {
    // Invalid Password
    res.status(400).send('Database Error');
  }
}

/**
 * Update user in database
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 * @param {function} next
 */

function updateUser (req, res) {
  req.user.email = req.body.email || req.user.email;
  var roles = req.body.roles || req.user.roles;
  req.user.save()
    .then(function (user) {
      return addRolesToUser(user);
    })
    .then(sendSuccess)
    .catch(send500);

  /////////

  function addRolesToUser (user) {
    return findRoles()
      .then(setRoles);

    //////////

    function findRoles () {
      //get the respected role instances
      // Create an object to use with the $or operator
      var or = _.map(roles, function (role) {
        return {name : role};
      });

      var roleQuery = {
        where: {
          $or: or
        }
      };

      return db.Role.findAll(roleQuery);
    }

    function setRoles (roles) {
      return user.setRoles(roles);
    }
  }

  function send500 () {
    res.status(500).send('error trying to update the user');
  }

  function sendSuccess () {
    res.status(200).send('updated user successfully');
  }

}
