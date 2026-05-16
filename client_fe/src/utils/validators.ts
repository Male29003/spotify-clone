export const getPasswordStrengthRules = (password: string) => {
    return [
        { label: "At least 8 characters", isValid: password.length >= 8 },
        { label: "At least 1 uppercase letter", isValid: /[A-Z]/.test(password) },
        { label: "At least 1 lowercase letter", isValid: /[a-z]/.test(password) },
        { label: "At least 1 number", isValid: /[0-9]/.test(password) },
        { label: "At least 1 special character", isValid: /[^A-Za-z0-9]/.test(password) },
    ];
};

export const isPasswordValid = (password: string) => {
    return getPasswordStrengthRules(password).every(rule => rule.isValid);
};


export const isvalidEmail = (email: string) => {
    if(!email) return false

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
}
// tạm thời chỉ ktra sdt VN
export const isvalidPhone = (phone: string) => {
    if(!phone) return false

    const phoneRegex = /^(03|05|07|08|09)+([0-9]{8})$/
    return phoneRegex.test(phone)
}
