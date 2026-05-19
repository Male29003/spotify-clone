import React from "react";
import { Block, CloseOutlined, SettingsBackupRestore } from "@mui/icons-material";
import type { IRelease } from "../../../types";

interface ModalHeaderProps {
    release: IRelease;
    isArtist: boolean;
    handleAdminToggleStatus: () => void;
    handleClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ release, isArtist, handleAdminToggleStatus, handleClose }) => {
    const isBlocked = release.is_blocked
    const isPending = release.is_pending

    return (
        <div className="p-6 border-b border-border flex items-start justify-between bg-base/50">
            <div className="flex gap-6 items-center">
                {/* Ảnh bìa cho xem đỡ và thông tin cơ bản*/}
                <img 
                    src={release.image} 
                    alt={release.title} 
                    className="w-32 h-32 rounded-lg shadow-lg object-cover border border-border" 
                />
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className={`text-sm p-2 rounded-full font-bold uppercase ${
                            (isBlocked || !release.is_active) ? 
                                'bg-error/20 text-error/95' 
                            : release.is_published ? 
                                'bg-highlight/20 text-highlight' 
                            :  
                                'bg-warning/20 text-warning/90'
                        }`}>
                            {isBlocked ? 
                                'Blocked' 
                            : !release.is_active ? 
                                'Deactive'
                            : release.is_published ? 
                                'Published' 
                            :  release.is_pending ?
                                'Pending' :   'Draft'
                            }
                        </span>
                        
                    </div>
                    
                    <h2 className="text-xl font-bold text-text-main mt-1 mb-2">
                        {release.title}
                    </h2>
                    <p className="text-text-sub text-xl">
                        {release.tracks?.length || 0} songs 
                    </p>
                    <p className="text-text-sub">
                        Released date: {release.release_date || 'N/A'}
                    </p>
                </div>
            </div>
            {/* Nút block và unblock của thk admin */}
            {!isArtist && !isPending && (
                <div className="relative z-50 flex shrink-0">
                    <button 
                        onClick={handleAdminToggleStatus}
                        className={`absolute top-20 right-0 md:right-10 px-4 py-2 sm:px-6 sm:py-2.5 flex items-center gap-2 rounded-full font-bold transition-transform hover:scale-105 shadow-lg
                            ${!isBlocked ? 'bg-error/10 text-error border border-error/50 hover:bg-error hover:text-text-main' 
                                        : 'bg-highlight/10 text-highlight border border-highlight/50 hover:bg-highlight hover:text-text-main'}`}
                        title={!isBlocked ? "Block Release" : "Unblock Release"}
                    >
                        {!isBlocked ? 
                            <>
                                <Block fontSize="small"/> <span className="sr-only md:not-sr-only md:inline">Block</span>
                            </>
                        : 
                            <>
                                <SettingsBackupRestore fontSize="small"/> <span className="sr-only md:not-sr-only md:inline">Unblock</span>
                            </>
                        }
                    </button>
                </div>
            )}    
        </div>
    )
}
export default ModalHeader;