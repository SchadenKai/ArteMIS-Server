const express = require('express')
const { WasteController } = require('../controllers/wasteController')
const { collection } = require('firebase/firestore')
const db = require('../firebase')
const { calculateAverage } = require('../middlewares/calculateAverage')
const router = express.Router()

const wasteRef = collection(db, 'waste')

router.use(express.urlencoded({extended: true}))

router.route('/')
    .get(WasteController.getAllWaste)
    // testing route - delete at deployment
    .post(WasteController.postWaste)
router.get("/latest", WasteController.getLatest)

router.route('/:id')
    .get(WasteController.getWaste)
    .delete(WasteController.deleteWaste)
    .patch(calculateAverage(wasteRef), WasteController.patchWaste)

module.exports = router