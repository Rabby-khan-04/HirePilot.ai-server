import pdf from "pdf-parse";

const extractPdfText = async (fileUrl: string): Promise<string> => {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF from URL: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const data = await pdf(buffer);

  return data.text?.trim() ?? "";
};

export default extractPdfText;
