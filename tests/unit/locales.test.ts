import enAuth from "../../src/locales/messages/en/auth.json";
import enDashboard from "../../src/locales/messages/en/dashboard.json";
import frAuth from "../../src/locales/messages/fr/auth.json";
import frDashboard from "../../src/locales/messages/fr/dashboard.json";

// Helper function to get all keys from a nested object
const getAllKeys = (obj: Record<string, unknown>, prefix = ""): string[] => {
  return Object.keys(obj).reduce((keys: string[], key: string) => {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      return [
        ...keys,
        ...getAllKeys(obj[key] as Record<string, unknown>, newPrefix),
      ];
    }
    return [...keys, newPrefix];
  }, []);
};

describe("Translation files", () => {
  describe("All locales have the same keys", () => {
    test("auth.json files have the same keys across all locales", () => {
      const enKeys = getAllKeys(enAuth).sort();
      const frKeys = getAllKeys(frAuth).sort();

      // Check that both languages have the same number of keys
      expect(enKeys.length).toBe(frKeys.length);

      // Check that all keys in English exist in French
      enKeys.forEach((key) => {
        expect(frKeys).toContain(key);
      });

      // Check that all keys in French exist in English
      frKeys.forEach((key) => {
        expect(enKeys).toContain(key);
      });
    });

    test("dashboard.json files have the same keys across all locales", () => {
      const enKeys = getAllKeys(enDashboard).sort();
      const frKeys = getAllKeys(frDashboard).sort();

      // Check that both languages have the same number of keys
      expect(enKeys.length).toBe(frKeys.length);

      // Check that all keys in English exist in French
      enKeys.forEach((key) => {
        expect(frKeys).toContain(key);
      });

      // Check that all keys in French exist in English
      frKeys.forEach((key) => {
        expect(enKeys).toContain(key);
      });
    });
  });

  // This test will help identify which keys are missing in case of failure
  describe("Missing translation keys", () => {
    test("Identify missing keys in auth.json files", () => {
      const enKeys = new Set(getAllKeys(enAuth));
      const frKeys = new Set(getAllKeys(frAuth));

      // Find keys in English that are missing in French
      const missingInFr = [...enKeys].filter((key) => !frKeys.has(key));

      // Find keys in French that are missing in English
      const missingInEn = [...frKeys].filter((key) => !enKeys.has(key));

      // The test will pass if both arrays are empty
      expect(missingInFr).toEqual([]);
      expect(missingInEn).toEqual([]);
    });

    test("Identify missing keys in dashboard.json files", () => {
      const enKeys = new Set(getAllKeys(enDashboard));
      const frKeys = new Set(getAllKeys(frDashboard));

      // Find keys in English that are missing in French
      const missingInFr = [...enKeys].filter((key) => !frKeys.has(key));

      // Find keys in French that are missing in English
      const missingInEn = [...frKeys].filter((key) => !enKeys.has(key));

      // The test will pass if both arrays are empty
      expect(missingInFr).toEqual([]);
      expect(missingInEn).toEqual([]);
    });
  });
});
