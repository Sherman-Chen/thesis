'use strict'

const jwt = require('jsonwebtoken'),  
      crypto = require('crypto'),
      User = require('../../db/models/User'),
      config = require('../../../config/main');

function generateToken(user) {  
  return jwt.sign(user, config.secret, {
    expiresIn: "7d" // token set to expire in 1 week
  });
}

function setUserInfo(request) {  
  return {
    _id: request._id,
    name: request.name,
    role: request.role,
  };
}

//========================================
// Login Route
//========================================
exports.login = function(req, res, next) {
  console.log(req);
  let userInfo = setUserInfo(req.user);

  res.status(200).json({
    token: 'JWT ' + generateToken(userInfo),
    user: userInfo
  });
}

//========================================
// Registration Route
//========================================
exports.register = function(req, res, next) {  
  // Check for registration errors
  const name = req.body.name;
  const password = req.body.password;

  // Return error if full name not provided
  if (!name) {
    return res.status(422).send({ error: 'You must enter your username.'});
  }

  // Return error if no password provided
  if (!password) {
    return res.status(422).send({ error: 'You must enter a password.' });
  }

  User.findOne({ name: name }, function(err, existingUser) {
      if (err) { return next(err); }

      // If user is not unique, return error
      if (existingUser) {
        return res.status(422).send({ error: 'That username is already in use.' });
      }

      // If name is unique and password was provided, create account
      let user = new User({
        password: password,
        name: name
      });

      user.save(function(err, user) {
        if (err) { return next(err); }

        // Respond with JWT if user was created

        let userInfo = setUserInfo(user);

        res.status(201).json({
          token: 'JWT ' + generateToken(userInfo),
          user: userInfo
        });
      });
  });
}

//========================================
// Authorization Middleware
//========================================

// Role authorization check
exports.roleAuthorization = function(role) { 
  return function(req, res, next) {
    const user = req.user;

    User.findById(user._id, function(err, foundUser) {
      if (err) {
        res.status(422).json({ error: 'No user was found.' });
        return next(err);
      }

      // If user is found, check role.
      if (foundUser.role == role) {
        return next();
      }

      res.status(401).json({ error: 'You are not authorized to view this content.' });
      return next('Unauthorized');
    })
  }
}
