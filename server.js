const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow frontend to connect from specific URL
}));

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Google Mail Transporter Setup with Direct Password (keep your credentials as is)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Direct password
  },
});

// Root Route (GET /) - Handles root access to check if the server is running
app.get("/", (req, res) => {
  res.send("Welcome to the Referral API! Use POST /api/referral to submit a referral.");
});

// Referral Form API: POST /api/referral
app.post("/api/referral", async (req, res) => {
  const { referrerName, referrerEmail, refereeName, refereeEmail, refereePhone } = req.body;

  // Basic validation
  if (!referrerName || !referrerEmail || !refereeName || !refereeEmail || !refereePhone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Create referral record in the database
    const referral = await prisma.referral.create({
      data: {
        firstName: referrerName,
        lastName: "", // You can modify it if needed
        email: referrerEmail,
        phone: refereePhone,
        message: `Referring: ${refereeName} (${refereeEmail})`,
      },
    });

    // Send email notification asynchronously
    const mailOptions = {
      from: 'nagiseishiro0700@gmail.com',  // Sender's email address
      to: 'charanvarma12@gmail.com',  // Recipient email address
      subject: 'New Referral Submission',
      text: `Referral Details:\n\nReferrer: ${referrerName} (${referrerEmail})\nReferee: ${refereeName} (${refereeEmail})\nPhone: ${refereePhone}`,
    };

    // Sending email and making sure we send the response only after the email is sent
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Failed to send email" });
      } else {
        console.log("Email sent: " + info.response);
        // Send the response only after the email is successfully sent
        return res.status(201).json({
          message: "Referral submitted successfully",
          referral,
        });
      }
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
