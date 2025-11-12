console.log("hi");
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
port = 3000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

console;

app.get("/", (req, res) => {
  res.send("server started successfully...");
});

app.listen(port, () => console.log(`server is running on port : ${port}`));

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.jehcuf6.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    const db = client.db(`${process.env.DB_NAME}`);
    const propertyCollection = db.collection("properties");

    // app.post("/allProperties", async (req, res) => {
    //   const newProduct = req.body;
    //   console.log(req.body);
    //   const result = await propertyCollection.insertOne(newProduct);
    //   res.send(result);
    // });
    app.get("/allProperties", async (req, res) => {
      try {
        const allValues = await propertyCollection.find({}).toArray();
        res.send(allValues);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        res.status(500).send({ message: "Server Error", error: err });
      }
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
