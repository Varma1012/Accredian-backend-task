require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

const prisma = new PrismaClient();

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { referrerName, referrerEmail, refereeName, refereeEmail, refereePhone } = req.body;

  // Validate required fields
  if (!referrerName || !referrerEmail || !refereeName || !refereeEmail || !refereePhone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Save referral in MySQL via Prisma
    const referral = await prisma.referral.create({
      data: {
        firstName: referrerName,
        lastName: "", // Modify as needed
        email: referrerEmail,
        phone: refereePhone,
        message: `Referring: ${refereeName} (${refereeEmail})`,
      },
    });

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "New Referral Submission",
      text: `Referral Details:\n\nReferrer: ${referrerName} (${referrerEmail})\nReferee: ${refereeName} (${refereeEmail})\nPhone: ${refereePhone}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Referral submitted successfully",
      referral,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
