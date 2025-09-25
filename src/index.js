export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight Request
    // This is necessary to allow your website to make requests to this worker.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "https://arcsolutions.tech", // Replace with your actual domain
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

      // 4. Send the email using the Resend API
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The RESEND_API_KEY is a secret environment variable
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ARC Solutions Contact <contact@contact.arcsolutions.tech>", // IMPORTANT: Replace with your verified sender from Resend
          to: ["james@arcsolutions.tech"], // The email address where you want to receive submissions
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

      // 5. Check if the email was sent successfully
      if (resendResponse.ok) {
        return new Response(JSON.stringify({ message: "Email sent successfully!" }), {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "https://arcsolutions.tech" }, // Replace with your domain
        });
      } else {
        const errorData = await resendResponse.json();
        console.error("Resend API Error:", errorData);
        return new Response(JSON.stringify({ message: "Failed to send email." }), {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "https://arcsolutions.tech" }, // Replace with your domain
        });
      }
    } catch (error) {
      console.error("Worker Error:", error);
      return new Response("An internal error occurred", { status: 500 });
    }
  },
};