import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const emailController = (app, options, done) => {
    app.post("/send", async (request, reply) => {
        try {
            console.log("📩 Incoming email request...");

            // ✅ Extract text fields properly
            const email = request.body.email?.value || request.body.email;
            const subject = request.body.subject?.value || request.body.subject;
            const body = request.body.body?.value || request.body.body;
            const file = request.body.attachment; // ✅ Extract file

            console.log("✅ Extracted fields:", { email, subject, body });

            // ✅ Validate required fields
            if (!email || !subject || !body) {
                console.error("❌ Missing required text fields");
                return reply.status(400).send({ error: "Missing required fields" });
            }

            if (!file) {
                console.error("❌ Missing required Attachment");
                return reply.status(400).send({ error: "Missing required attachment" });
            }

            console.log("📎 Extracted File:", {
                filename: file.filename,
                mimetype: file.mimetype
            });

            // ✅ Configure mail transport
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER, 
                    pass: process.env.EMAIL_PASS
                }
            });

            // ✅ Mail options
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email, // ✅ Now correctly extracting the email
                subject: subject,
                text: body,
                attachments: [
                    {
                        filename: file.filename || "attachment.pdf",
                        content: file._buf
                    }
                ]
            };

            console.log("📤 Sending email to:", email);
            const info = await transporter.sendMail(mailOptions);
            console.log("✅ Email sent:", info.response);

            reply.send({ success: true, message: `Email sent to ${email}` });
        } catch (error) {
            console.error("❌ Error sending email:", error);
            reply.status(500).send({ error: "Failed to send email" });
        }
    });

    done();
};

export default emailController;
