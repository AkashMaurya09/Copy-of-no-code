
import { GoogleGenAI, Type } from "@google/genai";
import { GradingCriteria, GradedResult } from '../types';

// Utility function to convert a file to a base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const gradingSchema = {
    type: Type.OBJECT,
    properties: {
        totalMarksAwarded: { type: Type.NUMBER },
        totalMaxMarks: { type: Type.NUMBER },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    questionNumber: { type: Type.STRING },
                    marksAwarded: { type: Type.NUMBER },
                    maxMarks: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                    steps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                step: { type: Type.NUMBER },
                                description: { type: Type.STRING },
                                correct: { type: Type.BOOLEAN },
                                marks: { type: Type.NUMBER },
                            },
                        },
                    },
                    keywordsFound: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                    areaForImprovement: { type: Type.STRING },
                },
            },
        },
    },
};


export const gradeAnswerSheet = async (
    answerSheetBase64: string,
    mimeType: string,
    criteria: GradingCriteria
): Promise<GradedResult> => {

    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are an expert AI exam grader. Your task is to grade the provided student's answer sheet based on a strict set of grading criteria.

    **Instructions:**
    1. Analyze the student's answer sheet image.
    2. Compare each answer to the provided grading criteria for that question.
    3. Award marks based on the defined steps and keywords. Be strict. If a step is partially correct, mark it as incorrect but award partial marks if the criteria allows.
    4. Provide constructive, concise feedback for each question, explaining why marks were awarded or deducted.
    5. Identify a key area for improvement for each question where the student struggled.
    6. Calculate the total score.
    7. Return your entire analysis as a single JSON object that strictly adheres to the provided schema. Do not include any text, markdown formatting, or code fences outside of the JSON object.
    
    **Grading Criteria:**
    ${JSON.stringify(criteria)}
    `;

    const imagePart = {
        inlineData: {
            data: answerSheetBase64,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: prompt,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: gradingSchema,
                temperature: 0.1, // Lower temperature for more deterministic grading
            }
        });

        const jsonString = response.text;
        const result = JSON.parse(jsonString) as Omit<GradedResult, 'questions'> & { questions: Omit<GradedResult['questions'][0], 'isDisputed'>[] };

        // Add the isDisputed field to each question
        const gradedResultWithDisputes: GradedResult = {
            ...result,
            questions: result.questions.map(q => ({ ...q, isDisputed: false })),
        };

        return gradedResultWithDisputes;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to grade the answer sheet. The AI model returned an error.");
    }
};
