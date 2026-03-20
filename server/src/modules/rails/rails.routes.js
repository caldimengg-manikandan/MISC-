/**
 * rails.routes.js
 */

const express = require('express');
const router = express.Router();
const controller = require('./rails.controller');

router.post('/calculate', controller.createEstimate);

module.exports = router;
