/**
 * stairs.routes.js
 * 
 * ROUTING LAYER
 */

const express = require('express');
const router = express.Router();
const controller = require('./stairs.controller');

router.post('/calculate', controller.createEstimate);

module.exports = router;
