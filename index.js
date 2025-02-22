const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const mongoose = require("mongoose");
const app = express();
dotenv.config();
const path = require("path");

// Middleware
app.use(express.json());
app.use(express.static("public"));

// MongoDB Setup
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// MongoDB Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const counterSchema = new mongoose.Schema({
  modelName: { type: String, required: true },
  currentId: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

const requestSchema = new mongoose.Schema({
  request_id: { type: Number, required: true, unique: true },
  name: { type: String, required: false },
  contactInformation: { type: String, required: false },
  requestType: { type: String, required: false },
  description: { type: String, required: false },
  quantity: { type: Number, required: false },
  location: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, required: false },
});

const Request = mongoose.model("Request", requestSchema);

let otpStorage = {}; // Temporary storage for OTP

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/stats", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/stats.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/index.html"));
});

app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/request.html"));
 });

app.get("/firstPage", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/firstPage.html"));
});

app.get("/request", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/manageRequest.html"));
});

app.get("/dashyy", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/dashyy.html"));
});
const allowedEmails = [
  "sunilnp@acem.edu.in",
  "ofcsatyam007@gmail.com",
  "vanshajs11@gmail.com",
]; // Allowed emails

app.get("/check-email", (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"]; // Get email from request headers

    console.log(userEmail);

    if (!userEmail) {
      return res.status(400).send("Email header is missing.");
    }

    if (allowedEmails.includes(userEmail)) {
      return res.status(200).send("Access granted.");
    } else {
      return res.status(403).send("Access denied.");
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).send("Server error");
  }
});

// Register Route (send OTP)
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const otp = generateOTP();

  // Store OTP temporarily in the otpStorage object
  otpStorage[email] = otp;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res
      .status(400)
      .json({ error: "User already exists with this email" });
  }

  // Send OTP via email
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Registration OTP",
    // text: `Your OTP for registration is: ${otp}`,
    html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign-Up OTP Email</title>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js">
    </script>
    <script type="text/javascript">
        (function () {
            emailjs.init({
                publicKey: "g8nFJKPj-NjQECO8y",
            });
        })();
    </script>
    <script src="email.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

        body {
            font-family: "Poppins", serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }

        .email-container {
            width: 400px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .email-header {
            background-color: #4caf50;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }

        .email-header img {
            width: 150px;
        }

        .email-header h1 {
            margin: 10px 0 0;
            font-size: 24px;
        }

        .email-body {
            padding: 20px;
            text-align: center;
        }

        .email-body h2 {
            font-size: 20px;
            color: #333;
        }

        .email-body .otp-box {
            background-color: #f4f4f4;
            font-size: 24px;
            color: #4caf50;
            padding: 15px;
            margin: 20px auto;
            width: fit-content;
            border-radius: 5px;
            border: 1px solid #ddd;
        }

        .email-body p {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }

        .email-footer {
            text-align: center;
            padding: 15px;
            font-size: 14px;
            color: #777;
            background-color: #f4f4f4;
        }

        .email-footer a {
            color: #4caf50;
            text-decoration: none;
        }

        @media (max-width:600px) {
            .email-container {
                width: 80%;
                /* height: 90%; */
                margin-top: 50px;
            }

            .email-body p {
                font-size: 10px;
            }

            .email-header img {
                width: 100px;
            }

            .email-header h1 {
                font-size: 18px;
            }

            .email-body h2 {
                font-size: 18px;
                color: #333;
            }

        }



        @media (min-height:800px) {
            .email-container {
                margin-top: 100px;
            }

        }
    </style>
</head>

<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://i.postimg.cc/pT69mFMB/logo.png" alt="Website Logo">
            <h1>Welcome to PIPH !</h1>
        </div>
        <div class="email-body">
            <h2>🎉 Hello!</h2>
            <p>Thank you for signing up with <strong>PIPH </strong>(PANDEMIC INSIGHTS AND PREPAREDNESS HUB). To complete
                your registration, please use the OTP below:</p>
            <div class="otp-box">${otp}</div>
            <p><em>(This OTP is valid for the next 10 minutes.)</em></p>
            <p>If you didn’t sign up for this account, please ignore this email or <a href="#">contact support</a>.</p>
        </div>
        <div class="email-footer">
            <p>Need help? <a href="#">Visit our support page</a> or reply to this email.</p>
            <p>Welcome aboard! <br>The <strong> PIPH Team </strong></p>
        </div>
    </div>

</body>

</html>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: "Failed to send OTP" });
    }
    res.json({ message: "OTP sent! Please verify." });
  });
});

// OTP Verification and Registration
app.post("/register/verify", async (req, res) => {
  const { email, otp, password } = req.body;

  // Check if OTP is valid
  if (otpStorage[email] !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user and save to MongoDB
  const newUser = new User({ email, password: hashedPassword });
  await newUser.save();

  // Remove OTP from storage after successful verification
  delete otpStorage[email];

  res.json({ message: "Registration successful" });
});

// Login Route (send OTP)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Verify password
  bcrypt.compare(password, user.password, (err, result) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    if (!result) return res.status(400).json({ error: "Invalid credentials" });

    // Create JWT token for session management
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  });
});

app.post("/send", async (req, res) => {
  try {
    const {
      name,
      contactInformation,
      requestType,
      description,
      quantity,
      location,
      email,
      status,
    } = req.body;
    console.log(req.body);

    // Check if all required fields are provided
    if (
      !name ||
      !contactInformation ||
      !requestType ||
      !description ||
      quantity === undefined ||
      !location
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Get the current value of the counter and increment it
    const counter = await Counter.findOneAndUpdate(
      { modelName: "Request" },
      { $inc: { currentId: 1 } },
      { new: true, upsert: true } // Create a new document if none exists
    );

    const requestId = counter.currentId;

    // Create a new Request document
    const newRequest = new Request({
      request_id: requestId,
      name,
      contactInformation,
      requestType,
      description,
      quantity,
      location,
      email,
      status: "Pending", // Set the initial status to pending
    });

    // Save the new request in the database
    await newRequest.save();

    // Respond with success
    res.status(201).json({ message: "Request successfully stored." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/requests", async (req, res) => {
  try {
    // Fetch all requests from the database
    const requests = await Request.find();

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching requests" });
  }
});

// Update request status

app.put("/requests/:id", async (req, res) => {
  try {
    const { status, email } = req.body; // Get the new status from the request body

    // The `req.params.id` is an integer, so no need to convert it to ObjectId
    const requestId = parseInt(req.params.id, 10);

    // Find the request based on request_id
    const request = await Request.findOne({ request_id: requestId });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const { quantity } = request;

    // Update the request status
    request.status = status;
    
    const updatedRequest = await request.save();

    console.log("Email:", email);

    const data = new Date();
    const formattedDate = data.toISOString().split('T')[0]; // Extracts the date part in ISO format (YYYY-MM-DD)

    
    

    // Send an email notification to the user (if email exists in the request)
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Request Status Update",
      //   text: `Dear user, your request with ID ${requestId} has been updated to: ${status}.`, // Replace with HTML
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resource Request Approved</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    body {
        
      font-family: "Poppins", sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .email-header {
      background-color: #4caf50;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .email-header img {
      max-width: 150px;
    }
    .email-header h1 {
      margin: 10px 0 0;
      font-size: 24px;
    }
    .email-body {
      padding: 20px;
      text-align: center;
    }
    .email-body h2 {
      font-size: 20px;
      color: #333;
    }
    .email-body p {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
    }
    .email-body .resource-details {
      background-color: #f4f4f4;
      padding: 15px;
      margin: 20px auto;
      border-radius: 5px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .email-body .resource-details strong {
      color: #4caf50;
    }
    .email-footer {
      text-align: center;
      padding: 15px;
      font-size: 14px;
      color: #777;
      background-color: #f4f4f4;
    }
    .email-footer a {
      color: #4caf50;
      text-decoration: none;
    }
    .email-body img{
        width: 100px;
    }
    @media (max-width:600px) {
            .email-container {
                width: 80%;
                /* height: 90%; */
                margin-top: 50px;
            }

            .email-body p {
                font-size: 10px;
            }

            .email-header img {
                width: 100px;
            }

            .email-header h1 {
                font-size: 10px;
            }

            .email-body h2 {
                font-size: 18px;
                color: #333;
            }
            .email-body img{
                width: 50px;
            }
        }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://i.postimg.cc/pT69mFMB/logo.png" alt="Website Logo">
      <h1>Resource Request Approved!</h1>
    </div>
    <div class="email-body">
      <h2>👏 Great news, ${requestId}</h2>
      <p>Your resource request has been ${status}. Below are the details of your request:</p>
      <img src="https://www.pngarts.com/files/4/Happy-Emoji-PNG-Free-Download.png" alt="">
      <div class="resource-details">
        <p><strong>Request ID:</strong> #123456</p>
        <p><strong>Resource Type:</strong> Medical Supplies</p>
        <p><strong>Quantity Approved:</strong> ${quantity}</p>
        <p><strong>Approval Date:</strong> ${formattedDate}</p>
      </div>
      <p>Our team will ensure that the requested resources are delivered to you promptly. If you have any questions, feel free to reach out to us.</p>
    </div>
    <div class="email-footer">
      <p>Need assistance? <a href="#">Contact our support team</a>.</p>
      <p>Thank you for choosing PIPH! <br>The <strong>PIPH</strong> Team</p>
    </div>
  </div>
</body>
</html>
`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent: " + info.response);

        // Delete the request from the database after sending the email
        await Request.deleteOne({ request_id: requestId });

        console.log(`Request with ID ${requestId} deleted from the database.`);

        // Respond with the updated request status
        res.json(updatedRequest);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating request status" });
  }
});

// Utility function to generate OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString(); // Random 6-digit OTP
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
