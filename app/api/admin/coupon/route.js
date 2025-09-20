import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

// ✅ Add new coupon
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { coupon } = await request.json();

    coupon.code = coupon.code.toUpperCase();

    const newCoupon = await prisma.coupon.create({ data: coupon });

    // Run Inngest Scheduler Function to delete coupon on expire
    await inngest.send({
      name: "app/coupon.expired",
      data: {
        code: newCoupon.code,
        expires_at: newCoupon.expiresAt,
      },
    });

    return NextResponse.json({ message: "Coupon added successfully" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// ✅ Delete coupon /api/coupon?code=COUPON_CODE
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);

    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "missing coupon code" }, { status: 400 });
    }

    await prisma.coupon.delete({ where: { code } });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// ✅ Get all coupons
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({});

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
