var express = require('express');
var bodyParser = require('body-parser')
var DataStore = require('nedb')

var port = (process.env.PORT || 3000);
var BASE_API_PATH="/api/v1";
var DB_FILE_NAME = __dirname + "/products.json"

console.log("Starting API server...");

var app = express();
app.use(bodyParser.json());

var db = new DataStore({
    filename: DB_FILE_NAME,
    autoload: true
});

app.get("/", (req, res ) => {
    res.send("<html><body><h1>Coffaine Products</h1></body></html>")
});

app.get(BASE_API_PATH + "/products", async (req, res) => {
    console.log(Date() + "-GET /products")
    db.find({}).exec(function (err, products) {
        res.send(products)
    });
});

app.post(BASE_API_PATH + "/products", (req, res) => {
    console.log(Date() + "-POST /products")
    var product = req.body
    db.insert(product, (err) => {
        if(err){
            console.error(Date() + " - " + err)
            res.send(500)
        }else{
            res.sendStatus(201)
        }
    });
});

app.listen(port);

console.log("Server ready!");