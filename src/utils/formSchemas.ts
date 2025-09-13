import { boolean, z } from 'zod';


export const passwordPolicy = z
    .string("Password is required")
    .trim()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

export const email = z
    .string("Email is required")
    .email('Invalid email address')
    .nonempty('Email is required');

export const nameSchema = (fieldName: string, maxLength: number = 50, minLength = 1) => z
    .string(`${fieldName} is required`)
    .min(minLength, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters`)
    .refine((v) => v === v.trim(), {
        message: `${fieldName} cannot start or end with spaces`,
    })
    .regex(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/, {
        message: `${fieldName} must contain only alphabets and spaces between words`,
    });

export const loginSchema = z.object({
    email: email,
    password: passwordPolicy,
    rememberMe: boolean("Remember me is required").optional()
});


export const registerSchema = z
    .object({
        name: nameSchema,
        email: email,
        password: passwordPolicy,
        confirmPassword: passwordPolicy,
        terms: boolean("You must accept the Terms and Conditions")
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
        if (password !== confirmPassword) {
            ctx.addIssue({
                path: ['confirmPassword'],
                message: 'Passwords do not match',
                code: z.ZodIssueCode.custom,
            });
        }
    });
export const resetSchema = z.object({
    newPassword: passwordPolicy,
    confirmPassword: passwordPolicy
}).superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
        ctx.addIssue({
            path: ["confirmPassword"],
            code: z.ZodIssueCode.custom,
            message: "Passwords do not match",
        });
    }
});;

export const changePasswordSchema = z.object({
    oldPassword: z
        .string("Old password is required")
        .trim()
        .min(1, "Old password is required"),
    newPassword: passwordPolicy,
    confirmPassword: passwordPolicy
}).superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
        ctx.addIssue({
            path: ["confirmPassword"],
            code: z.ZodIssueCode.custom,
            message: "Passwords do not match",
        });
    }
});

export const forgotSchema = z.object({
    email: email
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ForgotFormValue = z.infer<typeof forgotSchema>;
export type ResetFormValue = z.infer<typeof resetSchema>;
export type RegisterFormValue = z.infer<typeof registerSchema>;
export type LoginFormValue = z.infer<typeof loginSchema>;

