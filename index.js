const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Assignment is running 10");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qmivnkm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("assignmentDB");
const productsCollection = database.collection("productDetails");
const addToCartCollection = database.collection("addToCart");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // post type
    app.post("/products", async (req, res) => {
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      res.send(result);
    });

    // addToCartCollection post method
    app.post("/cartProducts", async (req, res) => {
      const products = req.body;
      delete products._id;
      const result = await addToCartCollection.insertOne(products);
      res.send(result);
    });

    // addToCartCollection Read type
    app.get("/cartProducts", async (req, res) => {
      const product = req.body
      const query = {email : product.email}
      const cursor = addToCartCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // addToCartCollection delete type
    app.delete("/cartProducts/:_id", async (req, res) => {
      const id = req.params._id;
      const query = { _id: new ObjectId(id) };
      const result = await addToCartCollection.deleteOne(query);
      res.send(result);
    });

    // Read type
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // find data category name

    app.get("/products/:categoryName", async (req, res) => {
      const categoryName = req.params.categoryName;
      const data = { brandName: categoryName };
      const cursor = productsCollection.find(data);
      const result = await cursor.toArray();
      res.send(result);
    });

    // find data  _id by product not be  products
    app.get("/products/:categoryName/:_id", async (req, res) => {
      const id = req.params._id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // update product
    app.put("/products/:categoryName/:_id", async (req, res) => {
      const product = req.body;
      const id = req.params._id;
      const filter = { _id: new ObjectId(id) };
      const { productName, price, description, img, type, rating, brandName } =
        product;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          productName: productName,
          price: price,
          description: description,
          img: img,
          type: type,
          rating: rating,
          brandName: brandName,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Port is running by ${port}`);
});
