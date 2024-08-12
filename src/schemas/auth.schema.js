import { z } from "zod";

export const loginSchema = z.object({
    usuario: z
        .string({
            required_error: "Username is required",
        }),
    password: z
        .string({
            required_error: "Password is required",
        })
        .min(3, {
            message: "Password must be at least 6 characters",
        }),
});