import { Recipient } from "@/db/models";

/**
 * Replace template variables with recipient data
 * Supports {{variable}} syntax
 */
export function processVariables(
	html: string,
	data: Record<string, string | number | boolean>,
): string {
	let processed = html;

	// Replace all {{variable}} with actual values
	const variableRegex = /\{\{(\w+)\}\}/g;

	processed = processed.replace(variableRegex, (_match, variable) => {
		const value = data[variable];
		return value !== undefined && value !== null ? String(value) : "";
	});

	return processed;
}

/**
 * Get all available variables from recipient lists
 */
export async function getAvailableVariables(
	recipientListIds: string[],
): Promise<string[]> {
	// Get sample recipients from the lists
	const sampleRecipients = await Recipient.find({
		recipientListId: { $in: recipientListIds },
	}).limit(100);

	const variableSet = new Set<string>();

	// Always include standard fields
	variableSet.add("email");
	variableSet.add("name");

	// Extract custom field keys
	for (const recipient of sampleRecipients) {
		if (recipient.customFields) {
			for (const key of recipient.customFields.keys()) {
				variableSet.add(key);
			}
		}
	}

	return Array.from(variableSet).sort();
}

/**
 * Validate template syntax
 */
export function validateTemplate(html: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Check for unclosed braces
	const openBraces = (html.match(/\{\{/g) || []).length;
	const closeBraces = (html.match(/\}\}/g) || []).length;

	if (openBraces !== closeBraces) {
		errors.push("Mismatched template braces: {{ and }}");
	}

	// Check for invalid variable names (only alphanumeric and underscore allowed)
	const variableRegex = /\{\{(\w+)\}\}/g;
	const invalidVariables = /\{\{([^}]*[^}\w][^}]*)\}\}/g;

	let match = invalidVariables.exec(html);
	while (match !== null) {
		// Check if it's not a valid variable
		if (!variableRegex.test(`{{${match[1]}}}`)) {
			errors.push(
				`Invalid variable name: {{${match[1]}}}. Use only letters, numbers, and underscores.`,
			);
		}
		match = invalidVariables.exec(html);
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Get sample output with example data
 */
export function getSampleOutput(
	html: string,
	sampleData?: Record<string, unknown>,
): string {
	const defaultSample = {
		name: "John Doe",
		email: "john@example.com",
		company: "Acme Corp",
		...sampleData,
	};

	return processVariables(html, defaultSample);
}
