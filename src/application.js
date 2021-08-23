const express = require('express')
const { appConfig } = require('./config')
const {
    getOrders,
    saveOrder,
    specialOrder,
    generateReport
} = require('./order')

const app = express()


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//POST
app.post('/save', (req, res) => {
    //get the existing user data
    const existOrders = getOrders(appConfig.database);
    if(orderDetails === null || orderDetails === undefined) {
        return res.status(400).send({error: true, msg: 'Invalid Order'});
    }

    const orderDetails = req.body;
    //check order is Brown Sugar
    specialOrder(orderDetails);
    //append the user data
    existOrders.push(orderDetails)
    //save the new user data
    const result = saveOrder(existOrders, appConfig.database);
    if(!result) return res.status(400).send({error: true, msg: 'Something went wrong'});
    

    res.status(200).send({success: true, msg: 'Order added successfully'});
});

//GET /report?monthYear=2021-08
//GET /report?monthYear=2021-09
app.get('/report', (req,res) => {

    const { monthYear } = req.query
    if( monthYear === undefined) {
        console.log('Incorrect monthYear paramater, please review');
        return res.status(400).json({ result:  'Incorrect monthYear paramater, please review' })
    }

    let report = generateReport('orders.json', monthYear);
    if(report === undefined) return res.status(500).json({ result:  'Server internal error' })

    res.status(200).json(report);
});


app.listen(appConfig.port, () => {
    console.log(`REST api listening at... http://localhost:${appConfig.port}`)
});

module.exports = app