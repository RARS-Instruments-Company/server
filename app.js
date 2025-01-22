// Import dependencies
const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config(); // Load environment variables

function config(request, response, next) {
    const allowedOrigins = ['https://rars-instruments-company.github.io/page/', 'https://rarsinstruments.com'];
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
        response.setHeader("Access-Control-Allow-Origin", origin);
    }
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    response.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );

    next();
}

// Create Express instance
app.use(express.json()); // Middleware to parse JSON
app.use(config);

// MongoDB connection setup
let db;
const MongoURI = process.env.MONGO_URI; // Get MongoDB URI from environment variables

MongoClient.connect(MongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (e, client) => {
    if (e) {
        console.error('Failed to connect to MongoDB', e);
        process.exit(1); // Exit if the connection fails
    }
    db = client.db('page'); // Database name
    console.log('Connected to MongoDB');
});

function root(request, response) {
    response.send('API is running!');
}

function logger(request, response, next) {
    const method = request.method;
    const url = request.url;
    const timestamp = new Date();

    console.log(`[${timestamp}] ${method} request to ${url}`); // Log request details

    // Capture and log response status when the response is finished
    response.on('finish', () => {
        console.log(`[${timestamp}] Response status: ${response.statusCode}`);
    });

    next();
}

function setCollectionName(request, response, next, collectionName) {
    request.collection = db.collection(collectionName); // Sets the requested collection name
    console.log('collection name:', request.collection);
    return next();
}

function addObject(request, response, next) {
    const { name, company, email, phone, msg } = request.body;
  
    if (!name || !company || !email || !phone || !msg) {
      return response.status(400).send({ msg: 'All fields are required' });
    }
  
    db.collection('requests').insertOne({ name, company, email, phone, msg }, (error, result) => {
      if (error) {
        console.error('Error inserting into MongoDB:', error);
        return response.status(500).send({ msg: 'Error saving request' });
      }
      response.status(200).send({ msg: 'success' });
    });
};

app.use(logger);
app.get('/', root);
app.param("collectionName", setCollectionName);
app.post('/collection/:collectionName', addObject);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});