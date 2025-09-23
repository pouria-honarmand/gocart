import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // ✅ always specify version
});

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const handlePaymentIntent = async (paymentIntentId, isPaid) => {
      const sessionList = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });

      if (!sessionList.data.length) {
        console.error("No session found for paymentIntent:", paymentIntentId);
        return;
      }

      const { orderIds, userId, appId } = sessionList.data[0].metadata;

      if (appId !== "gocart") {
        return NextResponse.json({
          received: true,
          message: "Invalid app id",
        });
      }

      const orderIdsArray = orderIds.split(",");

      if (isPaid) {
        // ✅ Mark orders as paid
        await Promise.all(
          orderIdsArray.map(async (orderId) => {
            await prisma.order.update({
              where: { id: orderId },
              data: { isPaid: true },
            });
          })
        );

        // ✅ Clear user cart
        await prisma.user.update({
          where: { id: userId },
          data: { cart: {} },
        });
      } else {
        // ❌ Payment failed → delete orders
        await Promise.all(
          orderIdsArray.map(async (orderId) => {
            await prisma.order.delete({
              where: { id: orderId },
            });
          })
        );
      }
    };

    // ✅ Handle event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntent(event.data.object.id, true);
        break;

      case "payment_intent.canceled":
      case "payment_intent.payment_failed":
        await handlePaymentIntent(event.data.object.id, false);
        break;

      default:
        console.log("Unhandled event type:", event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 400,
      }
    );
  }
}

// ✅ Disable body parsing so Stripe can verify signature
export const config = {
  api: {
    bodyParser: false,
  },
};
