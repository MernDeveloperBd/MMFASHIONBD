require('dotenv').config()
// import 'dotenv/config'
const express = require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const morgan = require('morgan')
const nodemailer = require("nodemailer");

const port = process.env.PORT || 5000;
const app = express();


//Middleware
// ✅ Recommended: use environment variable for client URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  // process.env.CLIENT_URL,  // front-end url
];
// 🔒 Middleware: CORS Setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy blocked this origin: ' + origin), false);
    }
  },
  credentials: true,
  optionSuccessStatus: 200,
}));
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

// EmailTemeplate

// Checkout invoice
const generateCheckoutInvoice = (order) => {
  const today = new Date();
  const date = today.toLocaleDateString("en-GB");
  const customer = order?.customer || {};
  const invoiceId = order?.invoiceId || "INV-" + today.getTime();

  // যদি items আছে (array), মাল্টিপল প্রোডাক্ট ইনভয়েস
  if (Array.isArray(order.items) && order.items.length > 0) {
    const productsHtmlRows = order.items.map((item) => {
      const price = typeof item.price === "number" ? item.price : 0;
      const quantity = typeof item.quantity === "number" ? item.quantity : 1;
      const total = price * quantity;
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 10px;">${item.title}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">TK ${price.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${quantity}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">TK ${total.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    const totalPayable = order.items.reduce((sum, item) => {
      const price = typeof item.price === "number" ? item.price : 0;
      const quantity = typeof item.quantity === "number" ? item.quantity : 1;
      return sum + price * quantity;
    }, 0);

    return `
      <div style="font-family: 'Segoe UI', sans-serif; color: #333; padding: 30px; max-width: 700px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fff;">
        <div style="text-align: center;">
          <h1 style="color: #4d7c0f; margin: 0;">Order Invoice</h1>
        </div>
        <div style="border-bottom: 2px solid #4d7c0f; margin: 10px 0 20px 0;"></div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h3>Customer Info</h3>
            <p><strong>Name:</strong> ${customer?.name || "N/A"}</p>
            <p><strong>Email:</strong> ${customer?.email || "N/A"}</p>
            <p><strong>Phone:</strong> ${customer?.phone || "N/A"}</p>
            <p><strong>Address:</strong> ${customer?.address || "N/A"}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Invoice ID:</strong> ${invoiceId}</p>
          </div>
        </div>

        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f7f7f7;">
              <th style="border: 1px solid #ddd; padding: 10px;">Product</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Price</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Quantity</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtmlRows}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <h3 style="color: #4d7c0f;">Total Payable: TK ${totalPayable.toFixed(2)}</h3>
        </div>

        <footer style="margin-top: 40px; font-size: 13px; color: #555; border-top: 1px solid #ccc; padding-top: 15px; text-align: center;">
          <p><strong>MM Fashion BD</strong></p>
          <p>Nawabgonj, Dhaka-1320</p>
          <p>Phone: +8801749889595 | Email: marifamisam@gmail.com</p>
          <p>
            Website: <a href="https://mmshopbd.com" style="color: #4d7c0f;">mmshopbd.com</a> |
            Facebook: <a href="https://www.facebook.com/MisamMarifaFashionWorld" style="color: #4d7c0f;">fb.com/haramainkhushbo</a>
          </p>
        </footer>
      </div>
    `;
  } else {
    // Single product invoice
    const title = order?.title || "Unnamed Product";
    const price = typeof order?.price === "number" ? order.price : 0;
    const quantity = typeof order?.quantity === "number" ? order.quantity : 1;
    const total = price * quantity;

    return `
      <div style="font-family: 'Segoe UI', sans-serif; color: #333; padding: 30px; max-width: 700px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fff;">
        <div style="text-align: center;">
          <h1 style="color: #4d7c0f; margin: 0;">Order Invoice</h1>
        </div>
        <div style="border-bottom: 2px solid #4d7c0f; margin: 10px 0 20px 0;"></div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h3>Customer Info</h3>
            <p><strong>Name:</strong> ${customer?.name || "N/A"}</p>
            <p><strong>Email:</strong> ${customer?.email || "N/A"}</p>
            <p><strong>Phone:</strong> ${customer?.phone || "N/A"}</p>
            <p><strong>Address:</strong> ${customer?.address || "N/A"}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Invoice ID:</strong> ${invoiceId}</p>
          </div>
        </div>

        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f7f7f7;">
              <th style="border: 1px solid #ddd; padding: 10px;">Product</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Price</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Quantity</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">${title}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">TK ${price.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${quantity}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">TK ${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <h3 style="color: #4d7c0f;">Total Payable: TK ${total.toFixed(2)}</h3>
        </div>

        <footer style="margin-top: 40px; font-size: 13px; color: #555; border-top: 1px solid #ccc; padding-top: 15px; text-align: center;">
          <p><strong>Haramain Khushbo</strong></p>
          <p>Molla Complex, Sher-e-Bangla Road, Nirala More, Khulna-9000</p>
          <p>Phone: +8801793000111 | Email: haramainkhusbu@gmail.com</p>
          <p>
            Website: <a href="https://orbitshiftbd.com" style="color: #4d7c0f;">orbitshiftbd.com</a> |
            Facebook: <a href="https://facebook.com/haramainkhushbo" style="color: #4d7c0f;">fb.com/haramainkhushbo</a>
          </p>
        </footer>
      </div>
    `;
  }
};


// Send to Admin
const generateContactEmailToAdmin = (data) => `
  <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    
    <div style="background-color: #4d7c0f; padding: 20px; color: #fff; text-align: center;">
      <h2 style="margin: 0;">📬 New Contact Message</h2>
    </div>

    <div style="padding: 20px; color: #333;">
      <p style="font-size: 16px; margin-bottom: 20px;">
        You have received a new message from your website contact form.
      </p>

      <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0;"><strong>Name:</strong></td>
          <td>${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Email:</strong></td>
          <td>${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Mobile:</strong></td>
          <td>${data.mobile}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;"><strong>Message:</strong></td>
          <td style="white-space: pre-line;">${data.message}</td>
        </tr>
      </table>
    </div>

    <div style="padding: 15px 20px; background-color: #f0f0f0; text-align: center; font-size: 13px; color: #777;">
      Sent from your website contact form.<br/>
      <strong>MM Fashion BD</strong> | <a href="https://mmfashionbd.com" style="color: #4d7c0f;">mmfashionbd.com</a>
    </div>
  </div>
`;

// Send to User
const generateContactEmailToUser = (name) => `
  <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">

    <!-- Header -->
    <div style="background-color: #4d7c0f; padding: 20px; color: #fff; text-align: center;">
      <h2 style="margin: 0;">🤝 Thanks for Reaching Out</h2>
    </div>

    <!-- Body -->
    <div style="padding: 20px; color: #333;">
      <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Thank you for contacting <strong>Haramain Khushbo</strong>!<br/>
        We’ve received your message and our team will get back to you as soon as possible. 💬
      </p>
      <p style="margin-top: 20px; font-size: 15px;">
        In the meantime, feel free to explore our website or follow us on social media for updates.
      </p>
      <p style="margin-top: 30px;">
        Best regards,<br/>
        <strong>The Haramain Khushbo Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <footer style="font-size: 13px; color: #555; border-top: 1px solid #ccc; padding: 15px 20px; text-align: center;">
      <p style="margin: 2px 0;"><strong>MM Fashion BD</strong></p>
      <p style="margin: 2px 0;">Nawabgonj, Dhaka-1320</p>
      <p style="margin: 2px 0;">Phone: +8801749889595 | Email: marifamisam@gmail.com</p>
      <p style="margin: 2px 0;">
        Website: <a href="https://mmfashionbd.com" target="_blank" style="color: #4d7c0f;">mmfashionbd.com</a> |
        Facebook: <a href="https://www.facebook.com/MisamMarifaFashionWorld" target="_blank" style="color: #4d7c0f;">fb.com/haramainkhushbo</a>
      </p>
      <p style="margin-top: 10px; color: #999;">This is an automated confirmation email.</p>
    </footer>
  </div>
`;

// EmailTemeplate end
// verify token
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

//Send email using Nodemailer
const sendEmail = (emailAddress, emaildata) => {

  //create a transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  });
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.log(error);

    } else {
      console.log("Transporter is ready to mail", success);

    }
  })
  // Transporter.sendEmail
  const mailBody = {
    from: process.env.NODEMAILER_EMAIL,
    to: emailAddress,
    subject: emaildata?.subject,
    html: `${emaildata?.message}`, // HTML body
  }
  transporter.sendMail(mailBody, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent info', info?.response);

    }
  })
}

const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@haramaincluster.pg3jdvj.mongodb.net/?retryWrites=true&w=majority&appName=HaramainCluster`;
const uri = process.env.MONGODB_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const productsCollection = client.db("MMFASHIONBD").collection("Products");
    const usersCollection = client.db("MMFASHIONBD").collection("users");
    const ordersCollection = client.db("MMFASHIONBD").collection("orders");
    const contactMessageCollection = client.db("MMFASHIONBD").collection("contact-message");
    const reviewssCollection = client.db("MMFASHIONBD").collection("reviews");
    const cartsCollection = client.db("MMFASHIONBD").collection("carts");

    //verify admin middleware
    const verifyAdmin = async (req, res, next) => {
      console.log('data from verifytoken middleware', req?.user);
      const email = req.params.email;
      const query = { email }
      const result = await usersCollection.findOne(query)
      if (!result || result?.role !== 'admin') return res.status(403).send({ message: 'Forbidden access! Admin only action' })
      next()
    };
    //verify seller middleware
    /*   const verifySeller = async(req, res, next) =>{
        console.log('data from verifytoken middleware', req?.user);
        const email = req.params.email;
        const query = {email}
         const result = await usersCollection.findOne(query)
         if(!result || result?.role !== 'seller') return res.status(403).send({message:'Forbidden access! Seller only action'})
  
        next()
      }; */

    // save or update a user in db
    app.post('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const user = req.body;
      //check if users exists in db
      const isExist = await usersCollection.findOne(query)
      if (isExist) {
        return res.send({ message: 'User already exists', inserted: false });
      }
      const result = await usersCollection.insertOne({ ...user, role: 'customer', timestamp: Date.now() });
      res.send({ message: 'User inserted successfully', inserted: true, result });
    })

    //manage user status or role
    app.patch('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const user = await usersCollection.findOne(query)
      if (!user || user?.status === 'Requested') return res.status(400).send('You have already requested, Wait for some time')
      const updateDoc = {
        $set: {
          status: 'Requested'
        }
      }
      const result = await usersCollection.updateOne(query, updateDoc)
      res.send(result)

    })
    // Get all user Data
    app.get('/all-users/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: { $ne: email } }
      const result = await usersCollection.find(query).toArray();
      res.send(result)
    })
    //Admin stats
    app.get('/admin-stat', verifyToken, async (req, res) => {
      // get total user, total plants
      const totalUser = await usersCollection.estimatedDocumentCount();
      const totalProducts = await productsCollection.estimatedDocumentCount();

      const allOrders = await ordersCollection.find().toArray()
      /* const totalOrders = allOrders.length;
      const totalPrice = allOrders.reduce((sum, order) => sum + order.price,0)
      res.send({totalUser, totalProducts, totalPrice, totalOrders}) */
      // const totalOrders = allOrder.length
      // const totalPrice = allOrder.reduce((sum, order) => sum + order.price, 0)

      // const myData = {
      //   date: '11/01/2025',
      //   quantity: 12,
      //   price: 1500,
      //   order: 3,
      // }
      // generate chart data
      const chartData = await ordersCollection
        .aggregate([
          { $sort: { _id: -1 } },
          {
            $addFields: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $toDate: '$_id' },
                },
              },
              quantity: {
                $sum: '$quantity',
              },
              price: { $sum: '$price' },
              order: { $sum: 1 },
            },
          },

          {
            $project: {
              _id: 0,
              date: '$_id',
              quantity: 1,
              order: 1,
              price: 1,
            },
          },
        ])
        .toArray()

      // get total revenue, total order
      const ordersDetails = await ordersCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$price' },
              totalOrders: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ])
        .next()

      res.send({
        totalProducts,
        totalUser,
        ...ordersDetails,
        chartData,
      })
    })

    //Update a user role and status
    app.patch('/user/role/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const { role } = req.body;
      const filter = { email }
      const updateDoc = {
        $set: { role, status: 'Verified' }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    // get user role
    app.get('/users/role/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email })
      res.send({ role: result?.role })
    })

    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      } catch (err) {
        res.status(500).send(err)
      }
    })

    //get invertory data for admin
    app.get('/products/admin', verifyToken, async (req, res) => {
      const email = req?.user?.email;
      const result = await productsCollection.find({ 'seller.email': email }).toArray()
      res.send(result)
    })
    //update a product not ok
   app.put('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid product ID" });
    }

    const filter = { _id: new ObjectId(id) };

    const updateDoc = {
      $set: {
        title: updatedData.title,
        price: updatedData.price,
        discountPrice: updatedData.discountPrice,
        quantity: updatedData.quantity,
        category: updatedData.category,
        subCategory: updatedData.subCategory,
        description: updatedData.description,
        image: updatedData.image,
        image1: updatedData.image1,
        ratings: updatedData.ratings,
      },
    };

    const result = await productsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Product not found" });
    }

    res.send({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


    //Deleta a product from db
    app.delete('/products/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await productsCollection.deleteOne(query)
      res.send(result)
    })

    // get all Products
    app.get('/products', async (req, res) => {
      const result = await productsCollection.find().sort({ _id: -1 }).toArray();
      res.send(result)
    })
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await productsCollection.findOne(query)
      res.send(result)
    })
    // save a product in db
    app.post('/products', verifyToken, async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result)
    })
    //Update order status
    app.patch('/orders/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: { status }
      }
      const result = await ordersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    // Delete an order
    app.delete('/orders/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await ordersCollection.deleteOne(query)
      res.send(result)
    })
    // get all Orders
    app.get('/orders',verifyToken, async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result)
    })
    // save a order data in db
    app.post('/orders', verifyToken, async (req, res) => {
      const orderInfo = req.body;
      const result = await ordersCollection.insertOne(orderInfo);
      // Send mail
      if (result?.insertedId) {
        //To customer
        sendEmail(orderInfo?.customer?.email, {
          subject: 'Order Successful',
          message: generateCheckoutInvoice(orderInfo),
        });
        //To Buyer
        sendEmail(orderInfo?.seller, {
          subject: 'Horray! you have an order to process',
          message: `You have place an order successfully ${orderInfo?.name}`
        })
      }
      res.send(result)
    })
    // get all customers orders by email/a specic customer
    app.get('/customer-orders/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "customer.email": email }
      const result = await ordersCollection.aggregate([
        {
          $match: query
        },
        {
          $addFields: {
            productId: { $toObjectId: '$productId' }
          }
        },
        {
          $lookup: {
            from: 'Products',
            localField: 'productId',
            foreignField: '_id',
            as: 'products'
          }
        },
        { $unwind: '$products' },
        {
          $addFields: {
            image: '$products.image'
          }
        },
        {
          $project: {
            products: 0
          }
        }
      ]).toArray();
      res.send(result)
    })


    // get all sellers orders by email/a specic customer
    app.get('/seller-orders/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { seller: email }
      const result = await ordersCollection.aggregate([
        {
          $match: query
        },
        {
          $addFields: {
            productId: { $toObjectId: '$productId' }
          }
        },
        {
          $lookup: {
            from: 'Products',
            localField: 'productId',
            foreignField: '_id',
            as: 'products'
          }
        },
        { $unwind: '$products' },
        {
          $addFields: {
            name: '$products.title'
          }
        },
        {
          $project: {
            products: 0
          }
        }
      ]).toArray();
      res.send(result)
    })

    // cancel/delete an order
    app.delete('/orders/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const order = await ordersCollection.findOne(query)
      if (order.status === 'Delivered') return res.status(409).send('Cannot cancel one if it is delivered.')
      const result = await ordersCollection.deleteOne(query)
      res.send(result)
    })
    //manage Product quantity
    app.patch('/products/quantity/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const { quantityToUpdate, status } = req.body;
      const filter = { _id: new ObjectId(id) }
      let updateDoc = {
        $inc: {
          quantity: -quantityToUpdate
        },
      }
      if (status === 'increase') {
        updateDoc = {
          $inc: {
            quantity: quantityToUpdate
          },
        }
      }
      const result = await productsCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Contact us
    app.post('/contact', async (req, res) => {
      const newContactMessage = req.body;
      const result = await contactMessageCollection.insertOne(newContactMessage)
      // Send mail
      if (result?.insertedId) {
        // Send to User
        await sendEmail(newContactMessage.email, {
          subject: "Thanks for contacting Haramain Khushbo",
          message: generateContactEmailToUser(newContactMessage.name)
        });
        //To Buyer
        await sendEmail(process.env.NODEMAILER_EMAIL, {
          subject: 'New Contact Message Received',
          message: generateContactEmailToAdmin(newContactMessage)
        })
      }
      res.send(result)
    })

    //Reviews
    // Get reviews by product title
 app.get('/reviews', async (req, res) => {
  const productId = req.query.productId;
  if (!productId) {
    return res.status(400).send({ error: "Product ID is required" });
  }
  const result = await reviewssCollection.find({ productId }).toArray();
  res.send(result);
});
    app.post('/reviews', async (req, res) => {
      const newReviews = req.body;
      const result = await reviewssCollection.insertOne(newReviews)
      res.send(result)
    })

    // Add to cart API
    app.post('/cart', async (req, res) => {
      const { productId, title, price, image, quantity = 1, userId } = req.body;

      // Validation
      if (!productId || !title || !price || !image || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Check if product already exists in user's cart
        const existingItem = await cartsCollection.findOne({ productId, userId });

        if (existingItem) {
          const updatedQuantity = existingItem.quantity + quantity;

          await cartsCollection.updateOne(
            { _id: existingItem._id },
            {
              $set: {
                quantity: updatedQuantity,
                updatedAt: new Date(),
              },
            }
          );

          return res.json({
            message: 'Cart updated',
            quantity: updatedQuantity,
            updatedId: existingItem._id,
          });
        }

        // Insert new cart item
        const newCartItem = {
          productId,
          title,
          price,
          image,
          quantity,
          userId,
          addedAt: new Date(),
        };

        const result = await cartsCollection.insertOne(newCartItem);


        res.json({
          message: 'Added to cart',
          insertedId: result.insertedId,
        });
      } catch (err) {
        console.error('Cart insert error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Delete cart item by ID
    app.delete("/cart-item/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await cartsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
          res.send({ message: "Cart item deleted" });
        } else {
          res.status(404).send({ error: "Item not found" });
        }
      } catch (error) {
        res.status(500).send({ error: "Invalid ID" });
      }
    });

    // Get cart items for user
    app.get('/cart/:userId', async (req, res) => {
      const { userId } = req.params;
      try {
        const cartItems = await cartsCollection.find({ userId }).toArray();
        res.json(cartItems);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch cart' });
      }
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


 app.get('/', (req, res) => {
  res.send("My Haramain Server is Running ")
}) 

module.exports = app; 

   app.listen(port, () => {
  console.log(`My Server is running on port: ${port}`);
})   