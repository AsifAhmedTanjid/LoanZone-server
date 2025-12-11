require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var admin = require("firebase-admin");
const serviceAccount = require("./loan-zone-firebase-adminsdk.json");
const app = express();
const port = 3000;

// middleware
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.clghzkh.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("server is running bro");
});

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found!",
    });
  }

  const token = authorization.split(" ")[1];
  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.user = decodedUser;
    req.tokenEmail = decodedUser.email;

    next();
  } catch (error) {
    res.status(401).send({
      message: "unauthorized access.",
    });
  }
};

async function run() {
  try {
    const db = client.db("loanzone-db");
    const userCollection = db.collection("users");
    const loanCollection = db.collection("loans");

    // role middlewire

    const verifyManager = async (req, res, next) => {
      const email = req.tokenEmail;
      const user = await userCollection.findOne({ email });
      if (user?.role !== "manager")
        return res
          .status(403)
          .send({ message: "Manager Actions Only!", role: user?.role });

      next();
    };

    // APIs

    // user api

    //insert user

    app.post("/users", async (req, res) => {
      const user = req.body;
      if (!user.role) {
        user.role = "borrower";
      }

      user.createdAt = new Date();
      const email = user.email;
      const userExists = await userCollection.findOne({ email });

      if (userExists) {
        return res.send({ message: "user exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get a user's role
    app.get("/user/role", verifyToken, async (req, res) => {
      const result = await userCollection.findOne({ email: req.tokenEmail });
      res.send({ role: result?.role });
    });









    //loan api

    // Save a loan data in db
    app.post('/loans', verifyToken, verifyManager, async (req, res) => {
      const loanData = req.body
      console.log(loanData)
      const result = await loanCollection.insertOne(loanData)
      res.send(result)
    })







    

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
  console.log(`Server is listening on port ${port}`);
});
