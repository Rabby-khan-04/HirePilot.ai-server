import { GoogleGenAI } from "@google/genai";
import { config } from "../../config/index.js";

const genAI = new GoogleGenAI({ apiKey: config.google_api_key });

export default genAI;
