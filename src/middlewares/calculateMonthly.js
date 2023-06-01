const { CRUD } = require("../module/crud");
const { getLatest } = require("../module/getLatest");
const { doc, collection, updateDoc, query, orderBy, limit, serverTimestamp, where } = require("firebase/firestore");
const db = require("../firebase");

exports.calculateMonthlyMiddleware = async (req, res, next) => {
  const monthlyRef = collection(db, "monthly");
  const buildingRef = collection(db, "building");
  const statusRef = collection(db, "status");
  const wasteRef = collection(db, "waste");
  const latestMonthDoc = await getLatest(monthlyRef);
  const buildingDocs = await CRUD.readAll(buildingRef);
  const req_keys = Object.keys(req.body);
  const reqBuildingName = req_keys[0];

  // identified whether the date has 30 or 31 days
  const monthDaysWith31Days = [
    "January",
    "March",
    "May",
    "July",
    "August",
    "October",
    "December",
  ];
  // calculate the total weight per building - initialize all buildings
  const registedBuildingList = {};
  // get all building regardless of campus 
  buildingDocs.forEach((campus) => {
    const keys = Object.keys(campus);
    keys.forEach((building) => {
      if (building != "id") {
        // predefine the building list for passed object data
        Object.assign(registedBuildingList, {[building] : 0})
      }
    });
  });
  // get list of buildings through the buildingObject pre-set
   const buildingList = Object.keys(registedBuildingList)
  // count building with data
  let building_count = 1;
  buildingList.forEach(building => {
    if(latestMonthDoc[0].buildings[building] != 0) {
      building_count++
    }
  })
 
  // get all docs within the month 
  const currentMonth = new Date()
  const q = query(wasteRef, where("createdAt", ">=", new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)), where('createdAt', '<=', new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)))
  const docs = await CRUD.readAll(q);
  // add all total for each building 
  let daysCount = 0
  docs.forEach((doc) => { 
    buildingList.forEach((building) => {
      registedBuildingList[building] += doc[building].weight.total
      // count the number of docs for this latest month
      daysCount++
    })
  })

  const latestWasteDocs = await getLatest(wasteRef)
  const buildingTotalWeight = latestWasteDocs[0][reqBuildingName].weight.total;
  if(buildingTotalWeight != 0) {
    registedBuildingList[reqBuildingName] -= buildingTotalWeight
  }
  registedBuildingList[reqBuildingName] += req.body[reqBuildingName].weight.total

  const statusQuery = query(wasteRef, where("createdAt", ">=", new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)), where('createdAt', '<=', new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)))
  const statusDocs = await CRUD.readAll(statusQuery)
  
  let total_food_waste = req.body.overall_food_waste;
  let total_recyclable = req.body.overall_recyclable;
  let total_residual = req.body.overall_residual;
 
  statusDocs.forEach(doc => {
    total_food_waste += doc.overall_food_waste_weight || 0
    total_recyclable += doc.overall_recyclable_weight || 0
    total_residual += doc.overall_residual_weight || 0
  })

  const total_weight = total_food_waste + total_recyclable + total_residual
  const averagePerDay = total_weight / daysCount;

  // update the date with the upcoming request data
  const data = {
    registered_buildings: building_count,
    types: {
      food_waste: total_food_waste,
      recyclable: total_recyclable,
      residual: total_residual
    },
    overall_total: total_weight,
    buildings: registedBuildingList,
    average: averagePerDay,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, "monthly", latestMonthDoc[0].id), data);
  next()
};
