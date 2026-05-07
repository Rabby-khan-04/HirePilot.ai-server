import { PDFParse } from "pdf-parse";

const extractPdfText = async (fileUrl: string): Promise<string> => {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF from URL: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();

  return result.text?.trim() ?? "";
};

export default extractPdfText;
