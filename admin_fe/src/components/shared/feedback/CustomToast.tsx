import toast from "react-hot-toast";
import { CheckCircleOutlined, ErrorOutlined, InfoOutlined } from "@mui/icons-material";


export const CustomToast = {
    success: (msg: string) => toast.success(msg, {
        icon: <CheckCircleOutlined className="text-highlight" />,
        style: {
            background: 'var(--theme-panel)',
            color: 'var(--theme-text-main)',
            border: '1px solid var(--theme-border)',
            borderRadius: '12px'
        },
    }),
    error: (msg: string) => toast.error(msg, {
        icon: <ErrorOutlined className="text-error" />,
        style: {
            background: 'var(--theme-panel)',
            color: 'var(--theme-text-main)',
            border: '1px solid var(--theme-border)',
            borderRadius: '12px'
        },
    }),
    info: (msg: string) => toast(msg, {
        icon: <InfoOutlined className="text-info" />,
        style: {
            background: 'var(--theme-panel)',
            color: 'var(--theme-text-main)',
            border: '1px solid var(--theme-border)',
            borderRadius: '12px'
        },
    }),
}