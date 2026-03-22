import { NextResponse } from "next/server";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Vercel Cron calls this endpoint on schedule (see vercel.json).
// It finds all Scheduled posts whose scheduledAt time has passed and deletes them
// from Firestore, removing them from the Scheduled Pipeline view.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!db) {
    return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 });
  }

  const now = new Date().toISOString();

  const q = query(collection(db, "posts"), where("status", "==", "Scheduled"));
  const snapshot = await getDocs(q);

  const toDelete: string[] = [];
  snapshot.forEach((d) => {
    const data = d.data();
    if (data.scheduledAt && data.scheduledAt <= now) {
      toDelete.push(d.id);
    }
  });

  await Promise.all(toDelete.map((id) => deleteDoc(doc(db!, "posts", id))));

  return NextResponse.json({ deleted: toDelete.length, checkedAt: now });
}
