export async function sendInvoiceViaWhatsApp(_invoiceId: string, _customerNumber: string): Promise<{ success: boolean; message: string }> {
  return { success: true, message: 'WhatsApp sending is not configured yet. This is a stub.' };
}
