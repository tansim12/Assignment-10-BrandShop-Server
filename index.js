const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middle ware
app.use(
  cors({
    origin: [
      "https://aquamarine-gecko-c70636.netlify.app",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// custom middle ware by verifyToken
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "no token found" });
  }
  jwt.verify(token, process.env.SEC, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "forbidden access" });
    } else {
      req.decoded = decoded;
      // console.log(decoded);
      next();
    }
  });
};
console.log(process.env.NODE_ENV);

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
    // jwt section
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign({ data: user }, process.env.SEC, {
        expiresIn: "1h",
      });
      // 2
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          // secure: process.env.NODE_ENV === "production",
          // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          sameSite: "none",
        })
        .send({ success: true });
    });

    // addToCartCollection post method
    app.post("/cartProducts", async (req, res) => {
      const products = req.body;
      delete products._id;
      const result = await addToCartCollection.insertOne(products);
      res.send(result);
    });

    // addToCartCollection Read type   find by email   *** new update
    app.get("/cartProducts", verifyToken, async (req, res) => {
      const decodedEmail = req.decoded.data.email;
      if (req.query?.email !== decodedEmail) {
        return res.status(401).send({ message: "forbidden" });
      }
      let query = {}; // new added here by finding query
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
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

    // post type
    app.post("/products", async (req, res) => {
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      res.send(result);
    });

    // Read type
    app.get("/products", verifyToken, async (req, res) => {
      const decodedEmail = req.decoded.data.email;
      if (req.query?.email !== decodedEmail) {
        return res.status(401).send({ message: "forbidden" });
      }
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // find data category name
    app.get("/products/:categoryName", verifyToken, async (req, res) => {
      const categoryName = req.params.categoryName;
      const data = { brandName: categoryName };
      const option = {
        projection: { description: 0 },
      };
      const cursor = productsCollection.find(data, option);
      const result = await cursor.toArray();
      res.send(result);
    });

    // find data  _id by product not be  products
    app.get("/products/:categoryName/:_id", verifyToken, async (req, res) => {
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
