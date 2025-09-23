import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Verify coupon
export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);

    const { code } = await request.json();

    // ✅ Proper Prisma query
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    // check if coupon exists and not expired
    if (!coupon || coupon.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Coupon not found or expired" },
        { status: 404 }
      );
    }

    // ✅ For new users only
    if (coupon.forNewUser) {
      const userOrders = await prisma.order.findMany({ where: { userId } });
      if (userOrders.length > 0) {
        return NextResponse.json(
          { error: "Coupon valid for new users only" },
          { status: 400 }
        );
      }
    }

    // ✅ For members only
    if (coupon.forMember) {
      const hasPlusPlan = has({ plan: "plus" });
      if (!hasPlusPlan) {
        return NextResponse.json(
          { error: "Coupon valid for members only" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
