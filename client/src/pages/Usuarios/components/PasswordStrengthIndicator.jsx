import { useMemo } from "react";
import { FiCheck, FiX } from "react-icons/fi";

export default function PasswordStrengthIndicator({ password }) {
    const strength = useMemo(() => {
        if (!password) return { score: 0, label: "", color: "" };

        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };

        // Calculate score
        if (checks.length) score++;
        if (checks.uppercase) score++;
        if (checks.lowercase) score++;
        if (checks.number) score++;
        if (checks.special) score++;

        // Determine strength
        let label, color, barColor;
        if (score <= 2) {
            label = "Débil";
            color = "text-red-600 dark:text-red-400";
            barColor = "bg-red-500";
        } else if (score <= 3) {
            label = "Media";
            color = "text-yellow-600 dark:text-yellow-400";
            barColor = "bg-yellow-500";
        } else {
            label = "Fuerte";
            color = "text-green-600 dark:text-green-400";
            barColor = "bg-green-500";
        }

        return { score, label, color, barColor, checks };
    }, [password]);

    if (!password) return null;

    return (
        <div className="space-y-2">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        Fortaleza de contraseña:
                    </span>
                    <span className={`text-xs font-semibold ${strength.color}`}>
                        {strength.label}
                    </span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${strength.barColor} transition-all duration-300`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                </div>
            </div>

            {/* Requirements Checklist */}
            <div className="grid grid-cols-2 gap-1 text-xs">
                <RequirementItem
                    met={strength.checks?.length}
                    label="Mínimo 8 caracteres"
                />
                <RequirementItem
                    met={strength.checks?.uppercase}
                    label="Mayúscula"
                />
                <RequirementItem
                    met={strength.checks?.number}
                    label="Número"
                />
                <RequirementItem
                    met={strength.checks?.special}
                    label="Carácter especial"
                />
            </div>
        </div>
    );
}

function RequirementItem({ met, label }) {
    return (
        <div className="flex items-center gap-1">
            {met ? (
                <FiCheck className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : (
                <FiX className="w-3 h-3 text-gray-400 flex-shrink-0" />
            )}
            <span className={met ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                {label}
            </span>
        </div>
    );
}
