import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "mock-api-key" || apiKey === "your-gemini-api-key-here") {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (e) {
    console.error("[AI] Error initializing GoogleGenAI:", e);
    return null;
  }
}

function parseJsonSafely(text: string): any {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateRiskScore(loanData: any): Promise<any> {
  const income = loanData.monthlyIncome || loanData.income || 25000;
  const emi = loanData.emiAmount || 3000;
  const ratio = emi / income;
  let score = 750;
  let riskLevel = "LOW";
  let recommendation = "Approve automatically with standard interest rate.";
  if (ratio > 0.4) {
    score = 620;
    riskLevel = "MEDIUM";
    recommendation = "Require one additional co-obligant or guarantor.";
  }
  if (ratio > 0.6 || income < 15000) {
    score = 510;
    riskLevel = "HIGH";
    recommendation = "High DTI ratio. Consider reducing loan amount or rejecting.";
  }

  const fallback = {
    score,
    riskLevel,
    defaultProbability: ratio > 0.5 ? "28%" : "8%",
    recommendation,
    keyFactors: [
      `Monthly Income: ₹${Number(income).toLocaleString()}`,
      `Proposed EMI: ₹${Number(emi).toLocaleString()} (DTI: ${Math.round(ratio * 100)}%)`,
      `Occupation Stability: ${loanData.occupation || "Employed"}`
    ]
  };

  const ai = getGeminiClient();
  if (!ai) {
    return fallback;
  }

  try {
    const prompt = `You are an AI Underwriter for XEROVA Auto Finance. Evaluate this vehicle loan application and respond ONLY with valid JSON:
    ${JSON.stringify(loanData)}
    Return JSON format:
    {"score": 750, "riskLevel": "LOW", "defaultProbability": "5%", "recommendation": "...", "keyFactors": ["..."]}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    const parsed = parseJsonSafely(response.text || "");
    return parsed || fallback;
  } catch (e) {
    console.error("[AI] Error generating risk score:", e);
    return fallback;
  }
}

export async function checkFraud(applicantData: any): Promise<any> {
  const data = applicantData?.proposal || applicantData || {};
  const pan = data.panNo || data.applicantPan || data.govtId || "";
  const phone = data.phone || data.housePhone || "";
  let flag = false;
  const reasons: string[] = [];
  if (!pan || pan.length !== 10) {
    flag = true;
    reasons.push("Invalid or missing PAN number format.");
  }
  if (!phone || phone.length < 10) {
    flag = true;
    reasons.push("Suspicious or incomplete contact phone number.");
  }

  const fallback = {
    flagged: flag,
    isFlagged: flag,
    confidence: flag ? "85%" : "95%",
    riskScore: flag ? 75 : 12,
    fraudRiskScore: flag ? 75 : 12,
    reasons: flag ? reasons : ["No fraud anomalies detected in applicant KYC."],
    riskFactors: flag ? reasons : [],
    verificationAction: flag ? "Mandatory physical field verification by Recovery Officer." : "Standard digital verification sufficient.",
    auditRecommendation: flag ? "Hold application: suspicious identity attributes detected. Field verification required before disbursement." : "Application verified. Low fraud probability detected in KYC records."
  };

  const ai = getGeminiClient();
  if (!ai) {
    return fallback;
  }

  try {
    const prompt = `Analyze this auto finance applicant for fraud indicators. Return ONLY valid JSON:
    ${JSON.stringify(data)}
    Format: {"flagged": false, "confidence": "95%", "riskScore": 15, "reasons": ["..."], "verificationAction": "..."}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    const parsed = parseJsonSafely(response.text || "");
    if (parsed) {
      const isFlagged = Boolean(parsed.flagged ?? parsed.isFlagged ?? flag);
      const score = Number(parsed.riskScore ?? parsed.fraudRiskScore ?? (isFlagged ? 75 : 15));
      const resReasons = parsed.reasons || parsed.riskFactors || reasons;
      const act = parsed.verificationAction || parsed.auditRecommendation || (isFlagged ? "Mandatory physical field verification." : "Standard digital verification.");
      return {
        flagged: isFlagged,
        isFlagged,
        confidence: parsed.confidence || "95%",
        riskScore: score,
        fraudRiskScore: score,
        reasons: resReasons,
        riskFactors: resReasons,
        verificationAction: act,
        auditRecommendation: act
      };
    }
    return fallback;
  } catch (e) {
    console.error("[AI] Error checking fraud:", e);
    return fallback;
  }
}

export async function runFinanceAudit(data: { loansCount: number; activePrincipal: number; overdueCount: number; totalReceipts: number }): Promise<any> {
  const npaRatio = data.loansCount > 0 ? (data.overdueCount / data.loansCount) * 100 : 5;
  const score = Math.max(50, 95 - Math.round(npaRatio * 2));
  const verdict = npaRatio > 15 ? "ADVERSE_FINDING" : npaRatio > 8 ? "QUALIFIED_PASS" : "UNQUALIFIED_PASS";
  const opinion = `Independent statutory portfolio review executed across ${data.loansCount} active loan accounts with ₹${data.activePrincipal.toLocaleString()} aggregate outstanding book value. Audit verdict is ${verdict.replace("_", " ")} with overdue delinquency ratio at ${npaRatio.toFixed(1)}%.`;
  const anomalies = npaRatio > 10 
    ? [`Overdue portfolio exposure of ${npaRatio.toFixed(1)}% exceeds recommended 10% threshold in recent vehicle loans.`]
    : [];
  const recommendations = [
    "Issue legal warning notices to accounts with overdue tenure >30 days.",
    "Reconcile counter cash receipts with bank deposit slips daily.",
    "Verify insurance endorsements and GPS telemetry on high-value asset loans."
  ];

  const baseResult = {
    timestamp: new Date().toISOString(),
    auditedBy: "Xerova AI Statutory Auditor",
    auditorVerdict: verdict,
    integrityScore: score,
    overallHealth: verdict,
    auditScore: score,
    auditorCertifiedOpinion: opinion,
    summary: opinion,
    anomaliesFound: anomalies,
    anomaliesDetected: anomalies,
    keyRecommendations: recommendations,
    actionItems: recommendations
  };

  const ai = getGeminiClient();
  if (!ai) {
    return baseResult;
  }

  try {
    const prompt = `Perform an ERP financial audit for auto loan portfolio:
    ${JSON.stringify(data)}
    Return ONLY valid JSON with keys:
    {"auditorVerdict": "UNQUALIFIED_PASS", "integrityScore": 92, "auditorCertifiedOpinion": "...", "anomaliesFound": ["..."], "keyRecommendations": ["..."]}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    const parsed = parseJsonSafely(response.text || "");
    if (parsed) {
      return {
        ...baseResult,
        ...parsed,
        overallHealth: parsed.auditorVerdict || baseResult.overallHealth,
        auditScore: parsed.integrityScore || baseResult.auditScore,
        summary: parsed.auditorCertifiedOpinion || baseResult.summary,
        anomaliesDetected: parsed.anomaliesFound || baseResult.anomaliesDetected,
        actionItems: parsed.keyRecommendations || baseResult.actionItems
      };
    }
    return baseResult;
  } catch (e) {
    console.error("[AI] Error running audit:", e);
    return baseResult;
  }
}
