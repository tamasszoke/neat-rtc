process.env.NODE_ENV = 'test';
require('@babel/register')();
var jsdom = require('jsdom').JSDOM;