import type { NextResponse } from "next/server";
import { handleAdvisorRequest } from "../handle-advisor-request";

export async function POST(req: Request): Promise<NextResponse> {
  return handleAdvisorRequest(req, "advisor/analyze");
}
