const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 3000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const serviceAccount = require("./homenest-firebase-adminsdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get("/", (req, res) => {
  res.send("server started successfully...");
});

const varifyFireBaseToken = async (req, res, next) => {
  //console.log("all good..");

  if (!req.headers.authorization) {
    return res.status(401).send([]);
  }

  const fbToken = req.headers.authorization.split(" ")[1];

  if (!fbToken) {
    return res.status(401).send([]);
  }

  try {
    const userInfo = await admin.auth().verifyIdToken(fbToken);
    req.token_email = userInfo.email;
    //console.log("after token validation : ", userInfo);
    next();
  } catch (errror) {
    return res.status(401).send([]);
  }
};

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
        //console.error("fetching recent data errors : ", err);
        res.status(500).send([]);
      }
    });
    //
    //
    app.get("/allProperties", async (req, res) => {
      try {
        const allValues = await propertyCollection.find({}).toArray();
        res.send(allValues);
      } catch (err) {
        //console.error("❌ Error fetching data:", err);
        res.status(500).send([]);
      }
    });
    //single property
    //
    app.get("/property/:id", varifyFireBaseToken, async (req, res) => {
      try {
        const propertyId = req.params.id;

        const property = await propertyCollection.findOne({
          _id: new ObjectId(propertyId),
        });
        //console.log(property);
        if (!property) {
          return res.status(404).send([]);
        }

        res.send(property);
      } catch (err) {
        res.status(500).send([]);
      }
    });
    //
    //
    //ad review
    //
    app.post("/property/addReview", varifyFireBaseToken, async (req, res) => {
      try {
        const reviewData = req.body;

        const result = await reviewsCollection.insertOne(reviewData);

        res.status(201).send({
          message: "Review added successfully",
          insertedId: result.insertedId,
        });
      } catch (err) {
        //console.error("Error adding review:", err);
        res.status(500).send([]);
      }
    });

    //
    //
    //all reviews
    //
    app.get("/property/reveiw/:id", varifyFireBaseToken, async (req, res) => {
      try {
        const propertyId = req.params.id;

        const reviews = await reviewsCollection
          .find({
            property_Id: propertyId,
          })
          .sort({ review_date: -1 })
          .toArray();
        //console.log(reviews);
        if (reviews.length === 0) {
          return res.status(404).send([]);
        }

        res.send(reviews);
      } catch (err) {
        res.status(500).send([]);
      }
    });
    //
    //
    //add property
    app.post("/addNewProperty", varifyFireBaseToken, async (req, res) => {
      try {
        const newProduct = req.body;
        const result = await propertyCollection.insertOne(newProduct);
        res.send(result);
      } catch (err) {
        res.status(500).send([]);
      }
    });
    //
    //
    //get myProperties
    //
    app.get("/myProperties/:email", varifyFireBaseToken, async (req, res) => {
      try {
        const email = req.params.email;
        if (email !== req.token_email) {
          return res.status(403).send([]);
        }

        const result = await propertyCollection
          .find({ user_email: email })
          .toArray();

        //console.log(req.headers.authorization);

        res.send(result);
      } catch (err) {
        //console.error("Error fetching user data:", err);

        res.status(500).send({
          message: "Failed to fetch data",
          error: err.message,
        });
      }
    });

    //
    //
    // delete a property
    //
    app.delete("/properties/:id", varifyFireBaseToken, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const result = await propertyCollection.deleteOne({ _id: id });
      res.send(result);
    });
    //
    //
    //  updating property
    //
    //
    app.put("/updateProperty/:id", varifyFireBaseToken, async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const filter = { _id: new ObjectId(id) };

        const data = {
          $set: {
            property_name: updatedData.property_name,
            description: updatedData.description,
            category: updatedData.category,
            price: updatedData.price,
            location: updatedData.location,
            image: updatedData.image,
          },
        };

        // Update the property
        const updateResult = await propertyCollection.updateOne(filter, data);

        if (updateResult.matchedCount === 0) {
          return res.status(404).send([]);
        }

        // Fetch the updated property
        const updatedProperty = await propertyCollection.findOne(filter);

        res.send({
          message: "Property updated successfully",
          updatedProperty,
        });
      } catch (err) {
        //console.error("Error updating property:", err);
        res.status(500).send([]);
      }
    });

    //
    // my product ratings
    //
    app.get(
      "/myProductsRatings/:ownerEmail",
      varifyFireBaseToken,
      async (req, res) => {
        try {
          const ownerEmail = req.params.ownerEmail;
          if (ownerEmail !== req.token_email) {
            return res.status(403).send([]);
          }

          const reviews = await reviewsCollection
            .find({ property_owner: ownerEmail })
            .sort({ review_date: -1 })
            .toArray();

          res.send(reviews);
        } catch (err) {
          //console.error("❌ Error fetching other's reviews:", err);
          res.status(500).send([]);
        }
      }
    );
    //
    //
    //

    await client.db("admin").command({ ping: 1 });
    //console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);
