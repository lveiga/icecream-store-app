const fs = require('fs')

const normalizeDateTime = orderDate => {
    //parse date from POST to Date
    let POSDateTime = new Date(orderDate + "Z");

    //Today date
    const todayDate = new Date();

    try {

        if(isNaN(Date.parse(POSDateTime))) {
            console.log(`couldn't parse ${orderDate}, using today date instead.`);
            return todayDate; 
        } 
        return POSDateTime

    } catch (err) {
        throw { error: error.stack }
    }
}

const specialOrder = (data) => {
    //The only non customisable flavour is the Brown Sugar which must always have Full Ice and Taopica Pearls topping, nothing else.
    //normalize -> returns the Unicode normalization form of a string.
    data.order_datetime = normalizeDateTime(data.order_datetime)
    const nonCustomisable = 'brown sugar';
    let flavour = data.flavours.normalize().toLowerCase();

    if(flavour && flavour === nonCustomisable)
    {
        data.amount_ice = 'Full Ice';
        data.toppings = 'Tapioca Pearls';
    }
}

const generateOrderFile = (fileName) => {
    //if file orders.json doesn't exist, create a new json array.
    if(!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, JSON.stringify([]));
        console.log(`${fileName} Created.`);
    }
}

//get the user data from json file
const getOrders = (fileName) => {
    try {
        generateOrderFile(fileName);
        return JSON.parse(fs.readFileSync(fileName));   
    } catch(err) {
        console.log(err);
    }
}

const groupByStore = (groupedByStore, key) => {
    return [...groupedByStore.reduce( (acc, o) => 
        acc.set(o[key], (acc.get(o[key]) || []).concat(o))
    , new Map).values()];
}

const groupByMonth = (orders, req) => {
    //Adding first day of month
    req = `${req}-02`
    const reqDate = new Date(req)
    const result =  orders.filter(order => {
        let dt = new Date(order.order_datetime)
        return dt.getMonth() + 1 === reqDate.getMonth() + 1
    })
    return result
}

const finalReport = stores => {
    let report = []
    for (let index = 0; index < stores.length; index++) {
        let totalOrders = stores[index].reduce(function (orders, store) {
            return orders + parseInt(store.order_number)
        }, 0)
        let totalValue = stores[index].reduce(function (price, store) {
            return price + parseFloat(store.total_orders_price)
        }, 0)

        report.push({
            "storeNumber": stores[index][0].store_number,
            "orderPriceSum": `A$${totalValue}`,
            "orderTotal": `${totalOrders}`
        })
    }

    return report
}

//read the order data from json POS
const saveOrder = (data, fileName) => {
    const stringifyData = JSON.stringify(data);
    
    try {
        fs.writeFileSync(fileName, stringifyData)
        return true
    } catch (err) {
        console.log(err)
        return false
    }   
}


const generateReport = (fileName, month) => {
    let orders = getOrders(fileName);

    try {
        const storesByMonth = groupByMonth(orders, month)
        const stores = groupByStore(storesByMonth, 'store_number')
        const report = finalReport(stores)
        
        console.log(report);
        return report
    } catch(err) {
        console.log(err);
    }
};


module.exports = {
    saveOrder,
    getOrders,
    specialOrder,
    generateReport
}