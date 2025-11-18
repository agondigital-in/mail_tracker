import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { removeRecipient } from "@/services/recipient.service";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
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
		const { id } = await params;

		// Remove recipient
		await removeRecipient(id, userId);

		return NextResponse.json({
			success: true,
			message: "Recipient removed successfully",
		});
	} catch (error) {
		console.error("Error removing recipient:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to remove recipient",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
