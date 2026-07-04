import OpenAI from "openai";
import { format } from "date-fns";

type Category = { id: string; name: string };

export type ParsedExpense = {
  amount: number;
  categoryName: string;
  date: string;
  note: string;
  paymentMethod: "CASH" | "CARD" | "BANK" | "MOBILE_BANKING" | "OTHER";
};

export type ParsedTransaction = ParsedExpense & {
  transactionType: "INCOME" | "EXPENSE";
  source: string;
};

const typoCorrections: Array<[RegExp, string]> = [
  [/\btaka\b|\btkaa\b|\btka\b|\btk\b/g, "taka"],
  [/\bfrutis\b|\bfruts\b|\bfurits\b|\bfruites\b/g, "fruits"],
  [/\bvegitable\b|\bvegtable\b|\bvegitables\b/g, "vegetables"],
  [/\bgrosary\b|\bgrocary\b|\bgrocry\b/g, "grocery"],
  [/\bbrekfast\b/g, "breakfast"],
  [/\bluch\b|\blunh\b/g, "lunch"],
  [/\bdinar\b|\bdiner\b/g, "dinner"],
  [/\bresturent\b|\bresturant\b/g, "restaurant"],
  [/\bmedcin\b|\bmedcine\b|\bmedecine\b/g, "medicine"],
  [/\beletricity\b|\belectricty\b|\belecticity\b/g, "electricity"],
  [/\btution\b|\btuision\b/g, "tuition"],
  [/\briksha\b|\bricksha\b/g, "rickshaw"],
  [/\bsalry\b|\bselary\b/g, "salary"],
  [/\bincom\b|\bincomme\b/g, "income"],
  [/\bexpanse\b|\bexpenc\b|\bexpenes\b/g, "expense"],
  [/\btranport\b|\btrasport\b/g, "transport"],
  [/\bentertainmnt\b|\benterteinment\b/g, "entertainment"],
  [/\bpharmecy\b/g, "pharmacy"]
];

export function correctTextFallback(text: string) {
  let corrected = text;
  for (const [pattern, replacement] of typoCorrections) {
    const caseInsensitivePattern = new RegExp(pattern.source, "gi");
    corrected = corrected.replace(caseInsensitivePattern, (match) => {
      if (match === match.toUpperCase()) return replacement.toUpperCase();
      if (match[0] === match[0]?.toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
      return replacement;
    });
  }
  return corrected.replace(/\s+/g, " ").trim();
}

const bnCategoryHints: Array<[RegExp, string]> = [
  [/(\u0996\u09be\u09ac\u09be\u09b0|\u0996\u09be\u09ac\u09be\u09b0\u09c7|\u0996\u09be\u0993\u09df\u09be|\u09ab\u09c1\u09a1)/, "Food"],
  [/(\u09ad\u09be\u09dc\u09be|\u09ac\u09be\u09b8\u09be)/, "Rent"],
  [/(\u09af\u09be\u09a4\u09be\u09df\u09be\u09a4|\u09ac\u09be\u09b8|\u09b0\u09bf\u0995\u09b6\u09be|\u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f)/, "Transport"],
  [/(\u09b6\u09aa\u09bf\u0982|\u0995\u09c7\u09a8\u09be\u0995\u09be\u099f\u09be)/, "Shopping"],
  [/(\u09ac\u09bf\u09b2|\u09ac\u09bf\u09a6\u09cd\u09af\u09c1\u09ce|\u09aa\u09be\u09a8\u09bf)/, "Bills"],
  [/(\u09b8\u09cd\u09ac\u09be\u09b8\u09cd\u09a5\u09cd\u09af|\u09a1\u09be\u0995\u09cd\u09a4\u09be\u09b0|\u0994\u09b7\u09a7)/, "Health"],
  [/(\u09b6\u09bf\u0995\u09cd\u09b7\u09be|\u09ac\u0987|\u09b8\u09cd\u0995\u09c1\u09b2|\u0995\u09b2\u09c7\u099c)/, "Education"],
  [/(\u09ac\u09bf\u09a8\u09cb\u09a6\u09a8|\u09ae\u09c1\u09ad\u09bf|\u09b8\u09bf\u09a8\u09c7\u09ae\u09be)/, "Entertainment"],
  [/(\u09b8\u099e\u09cd\u099a\u09df|\u09b8\u09c7\u09ad\u09bf\u0982\u09b8)/, "Savings"]
];

const enCategoryHints: Array<[RegExp, string]> = [
  [/\b(fruit|fruits|apple|banana|mango|orange|grape|food|meal|breakfast|lunch|dinner|snack|grocery|groceries|vegetable|rice|fish|meat|chicken|restaurant|coffee|tea|milk|bread|egg|eggs)\b/, "Food"],
  [/\b(rent|house rent|flat rent|apartment|landlord)\b/, "Rent"],
  [/\b(bus|train|taxi|uber|pathao|rickshaw|ride|fuel|petrol|diesel|transport|transportation|fare)\b/, "Transport"],
  [/\b(shopping|clothes|shirt|pant|shoe|shoes|dress|market|purchase|buy|bought)\b/, "Shopping"],
  [/\b(bill|bills|electricity|water|gas|internet|wifi|mobile recharge|phone bill)\b/, "Bills"],
  [/\b(doctor|medicine|hospital|clinic|health|pharmacy|medical)\b/, "Health"],
  [/\b(book|books|tuition|school|college|course|education|exam|fee|fees)\b/, "Education"],
  [/\b(movie|cinema|game|games|entertainment|netflix|spotify|outing)\b/, "Entertainment"],
  [/\b(saving|savings|save|deposit)\b/, "Savings"]
];

const categoryProfiles: Record<string, string[]> = {
  Food: [
    "fruit",
    "fruits",
    "apple",
    "banana",
    "mango",
    "orange",
    "grape",
    "pineapple",
    "watermelon",
    "vegetable",
    "vegetables",
    "tomato",
    "potato",
    "onion",
    "garlic",
    "grocery",
    "groceries",
    "supermarket",
    "food",
    "meal",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "restaurant",
    "cafe",
    "coffee",
    "tea",
    "milk",
    "bread",
    "egg",
    "eggs",
    "rice",
    "fish",
    "meat",
    "chicken",
    "beef",
    "mutton",
    "biryani",
    "burger",
    "pizza",
    "noodles",
    "pasta",
    "sweet",
    "sweets"
  ],
  Rent: ["rent", "house rent", "flat rent", "apartment", "landlord", "home rent", "room rent"],
  Transport: [
    "bus",
    "train",
    "taxi",
    "uber",
    "pathao",
    "rickshaw",
    "cng",
    "ride",
    "fare",
    "fuel",
    "petrol",
    "diesel",
    "transport",
    "transportation",
    "parking",
    "toll"
  ],
  Shopping: [
    "shopping",
    "clothes",
    "shirt",
    "pant",
    "pants",
    "shoe",
    "shoes",
    "dress",
    "watch",
    "bag",
    "market",
    "purchase",
    "buy",
    "bought",
    "electronics",
    "mobile",
    "phone",
    "laptop",
    "accessory"
  ],
  Bills: [
    "bill",
    "bills",
    "electricity",
    "water",
    "gas",
    "internet",
    "wifi",
    "broadband",
    "mobile recharge",
    "recharge",
    "phone bill",
    "subscription",
    "utility"
  ],
  Health: [
    "doctor",
    "medicine",
    "hospital",
    "clinic",
    "health",
    "pharmacy",
    "medical",
    "test",
    "diagnostic",
    "dentist",
    "therapy",
    "prescription"
  ],
  Education: [
    "book",
    "books",
    "tuition",
    "school",
    "college",
    "university",
    "course",
    "education",
    "exam",
    "fee",
    "fees",
    "admission",
    "stationery",
    "notebook",
    "pen"
  ],
  Entertainment: [
    "movie",
    "cinema",
    "game",
    "games",
    "entertainment",
    "netflix",
    "spotify",
    "youtube",
    "outing",
    "concert",
    "ticket",
    "travel",
    "trip"
  ],
  Savings: ["saving", "savings", "save", "deposit", "investment", "invest", "dps", "fixed deposit"]
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPhrase(text: string, phrase: string) {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  return new RegExp(`(^|\\s)${normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
}

function inferCategoryName(text: string, categories: Category[]) {
  const lowered = text.toLowerCase();
  const normalized = normalizeText(text);

  for (const category of categories) {
    if (lowered.includes(category.name.toLowerCase())) return category.name;
    if (hasPhrase(normalized, category.name)) return category.name;
  }

  let categoryName = "Other";
  for (const [pattern, value] of bnCategoryHints) {
    if (pattern.test(text)) categoryName = value;
  }
  for (const [pattern, value] of enCategoryHints) {
    if (pattern.test(lowered)) categoryName = value;
  }

  let bestScore = 0;
  for (const [category, terms] of Object.entries(categoryProfiles)) {
    const score = terms.reduce((sum, term) => {
      if (!hasPhrase(normalized, term)) return sum;
      return sum + Math.max(1, normalizeText(term).split(" ").length);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      categoryName = category;
    }
  }

  return categoryName;
}

const incomeHints = [
  "income",
  "salary",
  "bonus",
  "freelance",
  "received",
  "got paid",
  "\u0986\u09df",
  "\u0987\u09a8\u0995\u09be\u09ae",
  "\u09ac\u09c7\u09a4\u09a8",
  "\u09ac\u09cb\u09a8\u09be\u09b8",
  "\u09aa\u09c7\u09df\u09c7\u099b\u09bf",
  "\u09aa\u09c7\u09b2\u09be\u09ae",
  "\u099c\u09ae\u09be"
];

const expenseHints = [
  "expense",
  "spent",
  "cost",
  "paid",
  "\u0996\u09b0\u099a",
  "\u0996\u09b0\u099a\u09be",
  "\u09a6\u09bf\u09df\u09c7\u099b\u09bf",
  "\u09a6\u09bf\u09b2\u09be\u09ae"
];

export function parseExpenseFallback(text: string, categories: Category[]): ParsedExpense {
  const correctedText = correctTextFallback(text);
  const amountMatch = correctedText.match(/(\d+(?:[.,]\d+)?)/);
  const lowered = correctedText.toLowerCase();
  const amount = amountMatch ? Number(amountMatch[1].replace(",", ".")) : 0;
  const categoryName = inferCategoryName(correctedText, categories);

  const date =
    lowered.includes("yesterday") || correctedText.includes("\u0997\u09a4\u0995\u09be\u09b2")
      ? format(new Date(Date.now() - 86400000), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

  return { amount, categoryName, date, note: text, paymentMethod: "CASH" };
}

export function parseTransactionFallback(text: string, categories: Category[]): ParsedTransaction {
  const correctedText = correctTextFallback(text);
  const parsedExpense = parseExpenseFallback(correctedText, categories);
  const lowered = correctedText.toLowerCase();
  const looksIncome = incomeHints.some((hint) => lowered.includes(hint.toLowerCase()));
  const looksExpense = expenseHints.some((hint) => lowered.includes(hint.toLowerCase()));
  const transactionType = looksIncome && !looksExpense ? "INCOME" : "EXPENSE";
  const source = lowered.includes("salary") || correctedText.includes("\u09ac\u09c7\u09a4\u09a8") ? "Salary" : "AI entry";

  return { ...parsedExpense, note: text, transactionType, source };
}

export async function correctTextWithAI(text: string) {
  const fallback = correctTextFallback(text);
  if (!process.env.OPENAI_API_KEY) return fallback;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Correct typos in one short Bengali/English personal finance entry. Preserve amount, date words, meaning, language mix, and do not add extra explanation. Return only corrected text."
      },
      { role: "user", content: text }
    ]
  });
  return response.output_text.trim() || fallback;
}

export async function parseExpenseWithAI(text: string, categories: Category[]) {
  if (!process.env.OPENAI_API_KEY) return parseExpenseFallback(text, categories);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today = format(new Date(), "yyyy-MM-dd");
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Extract expense data from Bengali or English text. Return strict JSON only. Pick categoryName from available categories using item meaning. Examples: fruits/apple/banana/grocery/meal -> Food, bus/uber/fuel -> Transport, doctor/medicine -> Health, bill/electricity/internet -> Bills, book/tuition -> Education. Dates must be ISO yyyy-MM-dd."
      },
      {
        role: "user",
        content: JSON.stringify({
          today,
          text,
          categories: categories.map((c) => c.name),
          paymentMethods: ["CASH", "CARD", "BANK", "MOBILE_BANKING", "OTHER"]
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "expense",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            amount: { type: "number" },
            categoryName: { type: "string" },
            date: { type: "string" },
            note: { type: "string" },
            paymentMethod: { type: "string", enum: ["CASH", "CARD", "BANK", "MOBILE_BANKING", "OTHER"] }
          },
          required: ["amount", "categoryName", "date", "note", "paymentMethod"]
        }
      }
    }
  });
  const parsed = JSON.parse(response.output_text) as ParsedExpense;
  if (!parsed.amount || parsed.amount <= 0) return parseExpenseFallback(text, categories);
  return parsed;
}

export async function parseTransactionWithAI(text: string, categories: Category[]) {
  if (!process.env.OPENAI_API_KEY) return parseTransactionFallback(text, categories);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today = format(new Date(), "yyyy-MM-dd");
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Extract one personal finance transaction from Bengali or English text. Return strict JSON only. Use INCOME for salary, received money, bonus, freelance payment, deposit, or Bengali income words like \\u0986\\u09df/\\u09ac\\u09c7\\u09a4\\u09a8/\\u0987\\u09a8\\u0995\\u09be\\u09ae. Use EXPENSE for spending. For expenses, pick categoryName from available categories using item meaning. Examples: fruits/apple/banana/grocery/meal -> Food, bus/uber/fuel -> Transport, doctor/medicine -> Health, bill/electricity/internet -> Bills, book/tuition -> Education. Dates must be ISO yyyy-MM-dd."
      },
      {
        role: "user",
        content: JSON.stringify({
          today,
          text,
          categories: categories.map((c) => c.name),
          paymentMethods: ["CASH", "CARD", "BANK", "MOBILE_BANKING", "OTHER"]
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "transaction",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            transactionType: { type: "string", enum: ["INCOME", "EXPENSE"] },
            amount: { type: "number" },
            categoryName: { type: "string" },
            source: { type: "string" },
            date: { type: "string" },
            note: { type: "string" },
            paymentMethod: { type: "string", enum: ["CASH", "CARD", "BANK", "MOBILE_BANKING", "OTHER"] }
          },
          required: ["transactionType", "amount", "categoryName", "source", "date", "note", "paymentMethod"]
        }
      }
    }
  });
  const parsed = JSON.parse(response.output_text) as ParsedTransaction;
  if (!parsed.amount || parsed.amount <= 0) return parseTransactionFallback(text, categories);
  return parsed;
}
