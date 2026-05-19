import React from "react";
import DetailBanner from "../../components/detail/DetailBanner";
import DetailBannerSkeleton from "../../components/skeleton/DetailBannerSkeleton";

interface DetailLayoutProps {
    isLoading?: boolean
    item: any;
    type: 'Playlist' | 'Release' | 'Artist' | 'Track';
    totalTracks: number;
    actionBtns: React.ReactNode;
    mainContent: React.ReactNode;
    subContent?: React.ReactNode;
    children?: React.ReactNode;
    editConfig?: any
}

const DetailPageLayout: React.FC<DetailLayoutProps> = ({
    isLoading,
    item,
    type,
    totalTracks,
    actionBtns,
    mainContent,
    subContent,
    children,
    editConfig
}) => {
    return (
        <div className="relative w-full min-h-full pb-10 flex flex-col bg-panel/30 overflow-x-hidden">
            {(isLoading || !item) ? (
                <DetailBannerSkeleton type={type} />
            ) : (
                <DetailBanner 
                    item={item} 
                    type={type} 
                    totalTracks={totalTracks} 
                    editConfig={editConfig}
                />
            )}

            <div className="relative z-10 w-full px-6 md:px-8">
                {/* Lớp nền mờ tiếp nối banner */}
                <div 
                    className="absolute top-0 left-0 right-0 h-8 blur-[100px] -z-20 pointer-events-none"
                    style={{ backgroundImage: item?.image ? `url(${item?.image})` : 'none', backgroundSize: 'cover' }}
                />
                
                {/* Action Bar */}
                <div className="flex items-center gap-6 py-6 sticky top-0 z-20 backdrop-blur-md">
                    {(isLoading || !item) ? (
                        <div className="w-14 h-14 bg-hover animate-pulse rounded-full" />
                    ) : (
                        actionBtns
                    )}
                </div>

                <div className="flex flex-col xl:flex-row items-start gap-10 mt-4">
                    {/* danh sách các bài hát */}
                    <div className="flex-1 w-full overflow-hidden">
                        {mainContent}
                    </div>

                    {/* thông tin nghệ sĩ nếu có */}
                    {subContent && (
                        <div className="w-full xl:w-80 shrink-0">
                            {subContent}
                        </div>
                    )}
                </div>

                {/* Discography, recommend artists, ... */}
                {children && (
                    <div className="mt-12 w-full flex flex-col gap-10">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DetailPageLayout;