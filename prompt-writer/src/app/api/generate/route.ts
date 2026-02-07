import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/agents/orchestrator";
import { PromptRequestSchema } from "@/types";
import { ZodError } from "zod";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validatedRequest = PromptRequestSchema.parse(body);
    const result = await orchestrate(validatedRequest);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.startsWith("CSA redirect:")) {
        return NextResponse.json(
          { error: error.message, type: "csa_redirect" },
          { status: 422 }
        );
      }

      return NextResponse.json(
        { error: "Generation failed. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
