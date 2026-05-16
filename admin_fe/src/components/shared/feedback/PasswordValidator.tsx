import { CheckCircle } from "@mui/icons-material";
import React from "react";
import { getPasswordStrengthRules } from "../../../utils/validators";

interface PasswordValidatorProps {
    password: string;
    isFocused?: boolean;
}

const PasswordValidator: React.FC<PasswordValidatorProps> = ({ password, isFocused = true }) => {
    const rules = getPasswordStrengthRules(password)
    const isValid = rules.every(r => r.isValid)

    const isVisible = (password || isFocused) && (!isValid || isFocused);
    const shouldShow = password || isFocused;
    const finalVisible = isVisible && shouldShow;

    return(
        <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden
                ${finalVisible ? 'max-h-[200px] opacity-100 mt-2 mb-2' : 'max-h-0 opacity-0 mt-0 mb-0'}
            `}
        >
            <div className="flex flex-col gap-2 bg-base p-3 rounded-lg border border-border">
                {rules.map((rule, idx) => (
                    <div 
                        key={idx} 
                        className={`flex items-center gap-1.5 text-sm transition-colors duration-300 ${rule.isValid ? 'text-green-500 font-medium' : 'text-text-sub'}`}
                    >
                        <CheckCircle fontSize="inherit" className={`transition-opacity duration-300 ${rule.isValid ? 'opacity-100' : 'opacity-30'}`} />
                        <span className="leading-tight">{rule.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default PasswordValidator;