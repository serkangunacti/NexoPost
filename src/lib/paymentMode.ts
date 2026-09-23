// Payment provider used at checkout. Only "test" exists until a payment company is
// contracted; it approves every charge so plan flows can be tested end to end.
export const PAYMENT_PROVIDER = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "test";

export const IS_TEST_PAYMENT = PAYMENT_PROVIDER === "test";
