const express = require('express');
const router = express.Router();
const { guardarTest } = require('../controllers/cvsqController');
router.post('/guardar-cvsq', guardarTest);
module.exports = router;