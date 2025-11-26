const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const reviewsCollection = db.collection("reviews");

    //recent properties
    //
    app.get("/recentProperties", async (req, res) => {
      try {
        const recentValues = await propertyCollection
          .find({})
          .sort({ posted_date: -1 }) // newest first
          .limit(6) // only 6 results
          .toArray();

        res.send(recentValues);
      } catch (err) {
        console.error("fetching recent data errors : ", err);
        res.status(500).send({ message: "Server Error", error: err });
      }
    });
    //
    //
    app.get("/allProperties", async (req, res) => {
      try {
        const allValues = await propertyCollection.find({}).toArray();
        res.send(allValues);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        res.status(500).send({ message: "Server Error", error: err });
      }
    });
    //single property
    //
    app.get("/property/:id", async (req, res) => {
      try {
        const propertyId = req.params.id;

        const property = await propertyCollection.findOne({
          _id: new ObjectId(propertyId),
        });
        console.log(property);
        if (!property) {
          return res.status(404).send({ message: "Property not found..." });
        }

        res.send(property);
      } catch (err) {
        res.status(500).send({ message: "Server Error", error: err });
      }
    });
    //
    //
    //ad review
    //
    app.post("/property/addReview", async (req, res) => {
      try {
        const reviewData = req.body;

        const result = await reviewsCollection.insertOne(reviewData);

        res.status(201).send({
          message: "Review added successfully",
          insertedId: result.insertedId,
        });
      } catch (err) {
        console.error("Error adding review:", err);
        res.status(500).send({ message: "Server Error", error: err });
      }
    });

    //
    //
    //all reviews
    //
    app.get("/property/reveiw/:id", async (req, res) => {
      try {
        const propertyId = req.params.id;

        const reviews = await reviewsCollection
          .find({
            property_Id: propertyId,
          })
          .sort({ review_date: -1 })
          .toArray();
        console.log(reviews);
        if (!reviews) {
          return res.status(404).send({ message: "Reviews not found..." });
        }

        res.send(reviews);
      } catch (err) {
        res.status(500).send({ message: "Server Error", error: err });
      }
    });
    //
    //

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
