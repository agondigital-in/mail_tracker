import { Recipient, RecipientList } from "@/db/models";

interface CreateListData {
	name: string;
	description?: string;
}

interface ListStats {
	total: number;
	active: number;
	unsubscribed: number;
}

/**
 * Create a new recipient list
 */
export async function createList(userId: string, data: CreateListData) {
	const list = await RecipientList.create({
		userId,
		name: data.name,
		description: data.description,
	});

	return list;
}

/**
 * Get recipient list by ID with authorization check
 */
export async function getListById(listId: string, userId: string) {
	const list = await RecipientList.findOne({
		_id: listId,
		userId,
	});

	return list;
}

/**
 * List user's recipient lists
 */
export async function listUserLists(userId: string) {
	const lists = await RecipientList.find({ userId }).sort({ createdAt: -1 });

	return lists;
}

/**
 * Delete recipient list and all associated recipients
 */
export async function deleteList(listId: string, userId: string) {
	// Verify ownership
	const list = await getListById(listId, userId);
	if (!list) {
		throw new Error("Recipient list not found or unauthorized");
	}

	// Delete all recipients in this list
	await Recipient.deleteMany({ recipientListId: listId });

	// Delete the list
	await RecipientList.deleteOne({ _id: listId });

	return { success: true };
}

/**
 * Get recipient list statistics
 */
export async function getListStats(listId: string): Promise<ListStats> {
	const total = await Recipient.countDocuments({ recipientListId: listId });
	const unsubscribed = await Recipient.countDocuments({
		recipientListId: listId,
		unsubscribed: true,
	});
	const active = total - unsubscribed;

	return {
		total,
		active,
		unsubscribed,
	};
}

/**
 * Update recipient list
 */
export async function updateList(
	listId: string,
	userId: string,
	data: Partial<CreateListData>,
) {
	// Verify ownership
	const list = await getListById(listId, userId);
	if (!list) {
		throw new Error("Recipient list not found or unauthorized");
	}

	// Update the list
	const updatedList = await RecipientList.findByIdAndUpdate(
		listId,
		{
			$set: {
				...(data.name && { name: data.name }),
				...(data.description !== undefined && {
					description: data.description,
				}),
			},
		},
		{ new: true },
	);

	return updatedList;
}
