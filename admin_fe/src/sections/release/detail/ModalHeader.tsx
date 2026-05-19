import React from "react";
import { BlockOutlined, CheckCircleOutlined, CloseOutlined } from "@mui/icons-material";
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
                <button 
                    onClick={handleAdminToggleStatus}
                    className={`text-sm p-2 rounded-full transition-colors font-bold ${
                        !isBlocked ? 'bg-error/20 text-error/95 hover:bg-error/40' : 'bg-highlight/20 text-highlight/80 hover:bg-highlight/40'
                    }`}
                    title={!isBlocked ? "Block Release" : "Unblock Release"}
                >
                    {!isBlocked ? (
                        <> Block <BlockOutlined /> </>
                    ) : (
                        <> Unblock <CheckCircleOutlined /> </>
                    )}
                </button>
            )}
            
            {/* Nút đóng cái mdodal */}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    handleClose(); 
                }} 
                className="text-text-sub hover:text-text-main bg-search p-2 rounded-full transition-colors"
            >
                <CloseOutlined />
            </button>
        </div>
    )
}
export default ModalHeader;