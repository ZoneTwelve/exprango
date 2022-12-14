#!/usr/bin/env node
'use strict'

var express = require('express');
var exprango = require('..');

// www: Create express application
var app = express( );
var http = require('http');
const { setEnvironmentData } = require('worker_threads');
exprango.upgrade( app );
// End of express application

// ----- control.js: sample controller -----
var Controller = new exprango.Controller( );
let controlMemory = { users: new Object( ) };
Controller.public( 'login', ( account, password ) => {
  try{
    let user = controlMemory['users'][account];
    if( user===password ){
      return { message:"Login success" };
    }
    return { error: "Login failed" };
  }catch( error ){
    return { error: error };
  }
});

Controller.private( 'register', ( a, p ) => {
  try{
    controlMemory['users'][a] = p;
    return { message:"Create account successful!" };
  }catch( error ){
    return { error };
  }
});

// ----- route.js: sample router -----
var Router = new exprango.Router( );

Router.get('/', ( req, res, next ) => {
  console.log("----- Request -----");
  let { self } = req.root;
  console.log( self );
  // res.send( 'Hello, World!' );
  next( );
});

Router.post('/signup', ( req, res ) => {
  console.log("----- Request -----");
  let { self } = req.root;
  let result = self.register( "test", "123456" );
  console.log( result );
  res.send( result );
});

Router.post("/signin", ( req, res ) => {
  console.log("----- Request -----");
  let { self } = req.root;
  let result = self.login( "test", "123456" );
  console.log( result );
  res.send( result );
});

Router.get('/', ( req, res ) => {
  console.log("----- Request -----");
  let { self } = req.root;
  console.log( self );
  res.send( 'next Hello, World!' );
});

Router.get('/socket', ( req, res ) => {
  let { sample } = req.root.modules;
  sample.socket.publish("Hello");
  res.send("Done");
});

// End of sample modules


// ----- Socket.js: sample socket -----

var Socket = new exprango.Socket( { noServer: true } );

Socket.on('connection', ( client ) => {
  console.log("----- Socket connection -----");
  console.log("Socket ID: ", client.id);
  client.on("message", ( data ) => {
    console.log( data );
    client.send( "Hello, World!" );
  });
  // client.send( "Hello, World!" );
});

Socket.on('disconnect', ( client ) => {
  console.log("----- Socket close -----");
  console.log("Socket ID: ", client.id);  
});

Socket.hook("publish", ( ws, message ) => {
  ws.broadcast( message );
});

// End of sample socket 

// app.js:
// app constructor
// create an sub-modules
let sampleConfig = { control: Controller, route: Router, socket: Socket };
app.modular( 'sample', sampleConfig );
let { sample } = app.modules;
console.log( "sample modules:", sample );
// End of app.js

// test
// run application sub-modules controller
let loginResult = sample.control.login( 'test', '123456' );
let registerResult = sample.control.register( 'test', '123456' );

console.log( {loginResult, registerResult} );

let server = http.createServer( app );
for(let key in app.modules){
  let { socket } = app.modules[key];
  if( socket ){
    socket.construct( server );
  }
}

server.listen( 3000 );
