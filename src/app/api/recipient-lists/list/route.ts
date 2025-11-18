import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUserLists } from "@/services/recipient-list.service";

export async function GET(request: NextRequest) {
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

		// Get user's lists
		const lists = await listUserLists(userId);

		return NextResponse.json({
			success: true,
			lists,
		});
	} catch (error) {
		console.error("Error listing recipient lists:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to list recipient lists",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
