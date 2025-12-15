require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
     const applicationCollection = db.collection("applications");

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

    const verifyAdmin = async (req, res, next) => {
      const email = req.tokenEmail;
      const user = await userCollection.findOne({ email });
      if (user?.role !== "admin")
        return res
          .status(403)
          .send({ message: "Admin Actions Only!", role: user?.role });

      next();
    };

    const verifyAdminOrManager = async (req, res, next) => {
      const email = req.tokenEmail;
      const user = await userCollection.findOne({ email });
      if (user?.role !== "admin" && user?.role !== "manager")
        return res
          .status(403)
          .send({ message: "Admin or Manager Actions Only!", role: user?.role });

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

    // get all users 
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // update user 
    app.patch('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: req.body
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });









    //loan api

    // Save a loan data in db
    app.post('/loans', verifyToken, verifyManager, async (req, res) => {
      const loanData = req.body
      console.log(loanData)
      const result = await loanCollection.insertOne(loanData)
      res.send(result)
    })

    // get all loans
    app.get('/loans', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      if (req.query.page && req.query.size) {
        const result = await loanCollection.find()
          .skip(page * size)
          .limit(size)
          .toArray();
        res.send(result);
      } else {
        const result = await loanCollection.find().toArray()
        res.send(result)
      }
    })

    // get loans count
    app.get('/loansCount', async (req, res) => {
      const count = await loanCollection.estimatedDocumentCount();
      res.send({ count });
    })

    // get single loan
    app.get('/loans/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await loanCollection.findOne(query)
      res.send(result)
    })

    // get all loans posted by manager by email
    app.get(
      '/manage-loans/:email',
      verifyToken,
      verifyManager,
      async (req, res) => {
        const email = req.params.email

        const result = await loanCollection
          .find({ 'managerEmail': email })
          .toArray()
        res.send(result)
      }
    )

    // update loan
    app.patch('/loans/:id', verifyToken, verifyAdminOrManager, async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedLoan = req.body
      const updateDoc = {
        $set: {
          ...updatedLoan
        }
      }
      const result = await loanCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    //delete loan
    app.delete('/loans/:id', verifyToken, verifyAdminOrManager, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await loanCollection.deleteOne(query);
            res.send(result);
        })



    // add loan aplication
   

    app.post('/applications', verifyToken, async (req, res) => {
      const applicationData = req.body;
      const result = await applicationCollection.insertOne(applicationData);
      res.send(result);
    })

    // get all applications for admin
    app.get('/applications', verifyToken, verifyAdmin, async (req, res) => {
        const result = await applicationCollection.find().toArray();
        res.send(result);
    })

    // get applications by borrower email
    app.get('/applications/:email', verifyToken, async (req, res) => {
        const email = req.params.email;
        if (req.tokenEmail !== email) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        const query = { borrowerEmail: email };
        const result = await applicationCollection.find(query).toArray();
        res.send(result);
    })

    // delete application
    app.delete('/applications/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await applicationCollection.deleteOne(query);
        res.send(result);
    })

    // get applications by manager email
    app.get('/manager/applications/:email', verifyToken, verifyManager, async (req, res) => {
        const email = req.params.email;
        const query = { managerEmail: email };
        const result = await applicationCollection.find(query).toArray();
        res.send(result);
    })

    // update application status
    app.patch('/applications/:id', verifyToken, verifyManager, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedStatus = req.body;
        const updateDoc = {
            $set: {
                ...updatedStatus
            }
        };
        const result = await applicationCollection.updateOne(filter, updateDoc);
        res.send(result);
    })

    // Checkout Session
    app.post("/create-checkout-session", verifyToken, async (req, res) => {
      const { applicationId, loanTitle, amount, borrowerEmail, borrowerName } = req.body;

      try {
        const session = await stripe.checkout.sessions.create({
          
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Application Fee for ${loanTitle}`,
                },
                unit_amount: amount * 100,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.CLIENT_URL}/dashboard/my-loans?success=true&session_id={CHECKOUT_SESSION_ID}&applicationId=${applicationId}`,
          cancel_url: `${process.env.CLIENT_URL}/dashboard/my-loans?canceled=true`,
          customer_email: borrowerEmail,
          metadata: {
            applicationId,
            borrowerName
          }
        });

        res.send({ url: session.url });
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Verify Payment and Update Status
    app.post("/verify-payment", verifyToken, async (req, res) => {
        const { sessionId, applicationId } = req.body;

        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                const updateResult = await applicationCollection.updateOne(
                    { _id: new ObjectId(applicationId) },
                    {
                        $set: {
                            paymentStatus: 'paid',
                            transactionId: session.payment_intent,
                            paymentDate: new Date(),
                            paymentEmail: session.customer_details.email,
                            paymentAmount: session.amount_total / 100
                        }
                    }
                );
                res.send({ success: true, updateResult });
            } else {
                res.status(400).send({ success: false, message: "Payment not verified" });
            }
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    });

    // Send Email
    app.post("/send-email", async (req, res) => {
      const { firstName, lastName, email, subject, message } = req.body;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: `New Message from ${firstName} ${lastName}: ${subject}`,
        text: `
          Application : LOAN ZONE
          Name: ${firstName} ${lastName}
          Email: ${email}
          Subject: ${subject}
          Message: ${message}
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        res.send({ success: true, message: "Email sent successfully" });
      } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).send({ success: false, message: "Failed to send email" });
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

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
