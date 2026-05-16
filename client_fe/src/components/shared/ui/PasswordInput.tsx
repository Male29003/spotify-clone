import { VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import React, { useState } from "react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const  PasswordInput: React.FC<PasswordInputProps> = ({ className, children, ...props  }) => {
    const [ showPass, setShowPass ] = useState(false)

    return (
        <div className="relative">
            {/* icon - nếu có */}
            {children}
            <input 
                type={showPass ? 'text' : 'password'} 
                className={`w-full bg-base px-5 py-2.5 rounded-md text-text-main border border-border focus:border-highlight outline-none transition-colors ${className || ''}`}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors"
            >
                {showPass ? <VisibilityOutlined fontSize="small" /> : <VisibilityOffOutlined fontSize="small" />}
            </button>
        </div>
    )
}

export default PasswordInput;