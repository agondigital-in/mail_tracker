import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createList } from "@/services/recipient-list.service";

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return NextResponse.json(
				{
					success: false,
					error: "Authentication required",
					code: "AUTH_REQUIRED",
				},
				{ status: 401 },
			);
		}

		const userId = session.user.id;

		// Parse request body
		const body = await request.json();
		const { name, description } = body;

		// Validate input
		if (!name || name.trim().length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "List name is required",
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Create list
		const list = await createList(userId, { name, description });

		return NextResponse.json({
			success: true,
			listId: list._id.toString(),
			list,
			message: "Recipient list created successfully",
		});
	} catch (error) {
		console.error("Error creating recipient list:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to create recipient list",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
