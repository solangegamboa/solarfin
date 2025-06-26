'use server';
/**
 * @fileOverview An AI flow to read a receipt image and extract the total amount.
 *
 * - readReceipt - A function that handles the receipt reading process.
 * - ReadReceiptInput - The input type for the readReceipt function.
 * - ReadReceiptOutput - The return type for the readReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "An image of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReadReceiptInput = z.infer<typeof ReadReceiptInputSchema>;

const ReadReceiptOutputSchema = z.object({
  amount: z.number().optional().describe('The total amount found on the receipt. Return only the number.'),
});
export type ReadReceiptOutput = z.infer<typeof ReadReceiptOutputSchema>;

export async function readReceipt(input: ReadReceiptInput): Promise<ReadReceiptOutput> {
  return readReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'readReceiptPrompt',
  input: {schema: ReadReceiptInputSchema},
  output: {schema: ReadReceiptOutputSchema},
  prompt: `You are an expert receipt reader. Analyze the provided image of a fiscal receipt ("cupom fiscal"). 
  Your task is to identify and extract ONLY the final total amount paid.
  Look for keywords like "TOTAL", "VALOR A PAGAR", "TOTAL GERAL".
  Return the extracted amount in the 'amount' field. If you cannot determine the total amount with high confidence, do not return a value for the 'amount' field.

  Image: {{media url=photoDataUri}}`,
});

const readReceiptFlow = ai.defineFlow(
  {
    name: 'readReceiptFlow',
    inputSchema: ReadReceiptInputSchema,
    outputSchema: ReadReceiptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
