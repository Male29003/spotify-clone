import React from "react";
import { WarningAmberOutlined, DeleteOutlineOutlined, SaveOutlined, InfoOutlined } from "@mui/icons-material";
import { useConfirmModalStore } from "../../../stores/useConfirmModalStore";

// Default configs
const modalConfig = {
    // Xóa
    'delete': {
        title: "Confirm Deletion",
        // message: "This action CANNOT BE UNDONE!!\nAre you sure you want to continue?",
        confirmBtn: "Delete",
        cancelBtn: "Cancel",
        colorClass: "bg-error",
        textClass: "text-error",
        shadowClass: "shadow-error/20",
        icon: <DeleteOutlineOutlined fontSize="large" />
    },
    // Cảnh báo khi đang update -> thoát
    'unsaved': {
        title: "Unsaved Changes !!!",
        // message: "Some information is not saved.\nAll edits will be lost if you exit now.",
        confirmBtn: "Exit",
        cancelBtn: "Stay",
        colorClass: "bg-warning",
        textClass: "text-warning",
        shadowClass: "shadow-warning/20",
        icon: <WarningAmberOutlined fontSize="large" />
    },
    // Xác nhận lưu/ tạo
    'save': {
        title: "Confirm Save",
        // message: "Are you sure you want to save these changes to the system?",
        confirmBtn: "Save",
        cancelBtn: "Cancel",
        colorClass: "bg-highlight", 
        textClass: "text-highlight",
        shadowClass: "shadow-highlight/20",
        icon: <SaveOutlined fontSize="large" />
    },
    // Cảnh báo chung (Dùng cho Block/Ban)
    'warning': { 
         title: "Warning",
        // message: "Are you sure you want to proceed with this action?",
        confirmBtn: "Proceed",
        cancelBtn: "Cancel",
        colorClass: "bg-warning",
        textClass: "text-warning",
        shadowClass: "shadow-warning/20",
        icon: <WarningAmberOutlined fontSize="large" />
    },
    // Thông tin chung
    'info': { 
        title: "Confirm Modal",
        // message: "Do you want to continue?",
        confirmBtn: "Confirm",
        cancelBtn: "Cancel",
        colorClass: "bg-info",
        textClass: "text-info",
        shadowClass: "shadow-info/20",
        icon: <InfoOutlined fontSize="large" />
    }
};

const ConfirmModal: React.FC = () => {
    const { isOpen, type, isLoading, options, onConfirm, closeModal } = useConfirmModalStore();

    if (!isOpen) return null;

    const config = modalConfig[type];

    // Ưu tiên text từ options (nếu có), nếu không có thì lấy text mặc định
    const displayTitle = options?.title || config.title;
    const displayMessage = options?.message;
    const displayConfirmBtn = options?.confirmBtn || config.confirmBtn;
    const displayCancelBtn = options?.cancelBtn || config.cancelBtn;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-base/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-panel w-full max-w-md p-6 rounded-3xl border border-border shadow-2xl relative scale-100">
                
                {/* Header Icon */}
                <div className="flex items-center justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-opacity-10 ${config.textClass}`}>
                        {config.icon}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-center text-text-main mb-2">
                    {displayTitle}
                </h3>
                
                <p className="text-center text-text-sub text-sm mb-8 leading-relaxed whitespace-pre-line">
                    {displayMessage}
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={closeModal}
                        disabled={isLoading}
                        className="flex-1 bg-search text-text-main py-3 rounded-full font-bold hover:bg-hover transition-colors disabled:opacity-50"
                    >
                        {displayCancelBtn}
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 text-text-main py-3 rounded-full font-bold transition-transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 ${config.colorClass} ${config.shadowClass}`}
                    >
                        {isLoading ? "Processing..." : displayConfirmBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;