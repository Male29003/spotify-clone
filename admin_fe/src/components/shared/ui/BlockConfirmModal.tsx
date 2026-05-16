// src/components/shared/ui/BlockConfirmModal.tsx
import React, { useState, useEffect } from 'react';
import { Close } from '@mui/icons-material';
import { useBlockModalStore } from '../../../stores/useBlockModalStore';

const BlockConfirmModal: React.FC = () => {
    const { isOpen, isLoading, options, onConfirm, closeBlockModal } = useBlockModalStore();
    
    const [reasonId, setReasonId] = useState<number>(1);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen && options?.reasons?.length > 0) {
            setReasonId(options.reasons[0].id);
            setNote('');
        }
    }, [isOpen, options?.reasons]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(reasonId, note);
    };

    const isOtherSelected = options?.reasons?.find(r => r.id === reasonId)?.label.toLowerCase().includes('other');
    const displayTitle = options?.title || "Block Content";
    const displayActionLabel = options?.actionLabel || "Confirm";

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-base/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-panel w-full max-w-lg p-6 md:p-8 rounded-3xl shadow-2xl relative border border-border">
                <button 
                    onClick={closeBlockModal} 
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-text-sub hover:text-text-main bg-search hover:bg-hover p-2 rounded-full transition-colors disabled:opacity-50"
                >
                    <Close fontSize="small"/>
                </button>

                <h2 className="text-2xl font-bold text-error mb-2">{displayTitle}</h2>
                <p className="text-text-sub text-sm mb-6">
                    You are operating on: <strong className="text-text-main">{options?.itemName}</strong>. Choose 1 reason.
                </p>

                <div className="flex flex-col gap-3 mb-6">
                    {options?.reasons?.map((reason) => (
                        <label 
                            key={reason.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                                ${reasonId === reason.id ? 'border-error bg-error/10' : 'border-border bg-search hover:border-text-sub'}`}
                        >
                            <input 
                                type="radio" 
                                name="blockReason" 
                                value={reason.id} 
                                checked={reasonId === reason.id} 
                                onChange={() => {
                                    setReasonId(reason.id);
                                    if (!reason.label.toLowerCase().includes('other')) setNote('');
                                }}
                                className="accent-error w-4 h-4 cursor-pointer"
                            />
                            <span className={`text-sm font-medium ${reasonId === reason.id ? 'text-error' : 'text-text-main'}`}>
                                {reason.label}
                            </span>
                        </label>
                    ))}
                </div>

                {isOtherSelected && (
                    <div className="mb-6 animate-fadeIn">
                        <label className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">
                            Detail Note (Required)
                        </label>
                        <textarea 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Please enter details..."
                            className="w-full bg-search border border-border rounded-xl p-3 text-sm text-text-main focus:outline-none focus:border-error min-h-[100px] resize-none"
                            required
                        />
                    </div>
                )}

                <div className="flex justify-end gap-4 mt-8">
                    <button 
                        onClick={closeBlockModal}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-full text-sm font-bold text-text-main hover:bg-hover transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isLoading || (isOtherSelected && note.trim() === '')} 
                        className="px-6 py-2.5 rounded-full text-sm font-bold bg-error text-text-dark hover:bg-error transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-error/30"
                    >
                        {isLoading ? <div className="w-4 h-4 border-2 borderbase border-t-transparent rounded-full animate-spin"/> : null}
                        {displayActionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlockConfirmModal;