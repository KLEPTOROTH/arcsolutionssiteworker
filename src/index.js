export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight Request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "https://arcsolutions.tech", // Your website domain
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 2. Only Allow POST Requests
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      // 3. Parse the JSON data from the form
      const { name, email, message } = await request.json();

      if (!name || !email || !message) {
        return new Response("Missing required form fields", { status: 400 });
      }

      // --- Email 1: Send Notification to You ---
      const sendNotification = fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ARC Solutions Contact <contact@contact.arcsolutions.tech>", // Your verified sender from Resend
          to: ["james@arcsolutions.tech"], // Your notification email
          subject: `New Contact Form Submission from ${name}`,
          html: `
            <p>You have a new message from your website contact form:</p>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
            </ul>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
        }),
      });

      // --- Email 2: Send Confirmation to the User ---
      const sendConfirmation = fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ARC Solutions <contact@contact.arcsolutions.tech>", // Your verified sender from Resend
          to: [email], // The user's email address from the form
          subject: "Thanks for contacting ARC Solutions!",
          html: `
            <h1>We've Received Your Message!</h1>
            <p>Hello ${name},</p>
            <p>Thank you for reaching out to ARC Solutions. We've successfully received your message and will get back to you as soon as possible, typically within one business day.</p>
            <p>For your records, here is a copy of the message you sent:</p>
            <blockquote style="border-left: 2px solid #ccc; padding-left: 1em; margin-left: 1em; color: #666;">${message}</blockquote>
            <br>
            <p>Best regards,</p>
            <p>The ARC Solutions Team</p>
          `,
        }),
      });

      // 4. Wait for both emails to be processed
      const [notificationResponse] = await Promise.all([sendNotification, sendConfirmation]);
      
      // 5. Check if the primary notification email was sent successfully
      if (notificationResponse.ok) {
        return new Response(JSON.stringify({ message: "Emails sent successfully!" }), {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "https://arcsolutions.tech" },
        });
      } else {
        const errorData = await notificationResponse.json();
        console.error("Resend API Error:", errorData);
        return new Response(JSON.stringify({ message: "Failed to send email." }), {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "https://arcsolutions.tech" },
        });
      }

    } catch (error) {
      console.error("Worker Error:", error);
      return new Response("An internal error occurred", { status: 500 });
    }
  },
};
