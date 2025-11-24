"use client";

import { useState } from "react";
import { ValidationResultCard } from "./validation-result-card";
import type { ValidationResult } from "@/types/components";

interface SingleEmailValidatorProps {
  disabled?: boolean;
  onValidationStart?: () => void;
  onValidationComplete?: () => void;
}

export function SingleEmailValidator({
  disabled = false,
  onValidationStart,
  onValidationComplete,
}: SingleEmailValidatorProps) {
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmail = async () => {
    if (!email.trim()) {
      setResult({ valid: false, reason: "Please enter an email address" });
      return;
    }

    if (!validateEmailFormat(email)) {
      setResult({ valid: false, reason: "Invalid email format" });
      return;
    }

    setIsValidating(true);
    setResult(null);
    onValidationStart?.();

    try {
      const response = await fetch("/api/v1/emails/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.error) {
        setResult({
          valid: false,
          reason: data.error.message,
        });
      } else {
        setResult({
          valid: data.valid,
          reason: data.reason,
          domain: data.domain,
          mxRecords: data.checks?.mx_records,
        });
      }
    } catch {
      setResult({
        valid: false,
        reason: "Network error - please try again",
      });
    } finally {
      setIsValidating(false);
      onValidationComplete?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isValidating) {
      validateEmail();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Single Email Validation</h2>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter email address..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
          disabled={isValidating || disabled}
        />
      </div>

      <button
        onClick={validateEmail}
        disabled={isValidating || disabled || !email.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isValidating ? "Validating..." : "Validate Email"}
      </button>

      {result && <ValidationResultCard result={result} />}
    </div>
  );
}
