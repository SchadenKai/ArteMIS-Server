const express = require('express')
const { statusController } = require('../controllers/statusController')
const router = express.Router()

router.route('/')
    .get(statusController.getAllStatus)
    .post(statusController.postData)

router.get('/latest', statusController.getLatestStatus)

router.get('/yearly', statusController.getAllYearly)

router.get('/monthly', statusController.getAllMonthly)
router.get('/monthly/latest', statusController.getLatestMonthly)

router.get('/weekly', statusController.getAllWeekly)
router.get('/weekly/latest', statusController.getLatestWeekly)

module.exports = router