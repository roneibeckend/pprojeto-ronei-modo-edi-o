import { z } from "zod";

/**
 * Validates a password based on requirements:
 * - Minimum length: 6 characters
 * - Must contain at least 2 of the following types:
 *   - Lowercase letters
 *   - Uppercase letters
 *   - Numbers
 * - Special characters are optional and allowed
 */
export const validatePassword = (password: string) => {
  if (!password) {
    return { isValid: false, message: "A senha é obrigatória." };
  }

  if (password.length < 6) {
    return { isValid: false, message: "A senha deve ter pelo menos 6 caracteres." };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const typesCount = [hasLower, hasUpper, hasNumber].filter(Boolean).length;

  if (typesCount < 2) {
    return { 
      isValid: false, 
      message: "Para sua segurança, a senha deve conter pelo menos dois destes três tipos: letras minúsculas, letras maiúsculas ou números." 
    };
  }

  return { isValid: true, message: "" };
};

export const passwordSchema = z.string()
  .min(6, "A senha deve ter pelo menos 6 caracteres.")
  .refine((password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return [hasLower, hasUpper, hasNumber].filter(Boolean).length >= 2;
  }, {
    message: "A senha deve conter pelo menos dois destes três tipos: letras minúsculas, letras maiúsculas ou números."
  });
