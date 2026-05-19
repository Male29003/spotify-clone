import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { CloseOutlined } from '@mui/icons-material';
import { getCroppedImg } from '../../utils/cropImage'; 
import { CustomToast } from '../../components/shared/feedback/CustomToast';

const ImageCropperModal = ({ rawUrl, onClose, onCropSuccess }: { rawUrl: string, onClose: () => void, onCropSuccess: (file: File) => void }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_: any, pixels: any) => setCroppedAreaPixels(pixels), []);

    const handleCrop = async () => {
        try {
            if (!croppedAreaPixels) return;
            const croppedFile = await getCroppedImg(rawUrl, croppedAreaPixels);
            onCropSuccess(croppedFile);
        } catch (e) {
            CustomToast.error("Error cắt ảnh!");
        }
    };

    return (
        <div className="fixed inset-0 z-100 bg-base/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="bg-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-lg text-text-main">
                        Adjust Avatar
                    </h3>
                    <button onClick={onClose} className="text-text-sub hover:text-text-main">
                        <CloseOutlined />
                    </button>
                </div>
                <div className="relative w-full h-80 bg-base">
                    <Cropper 
                    image={rawUrl} 
                    crop={crop} 
                    zoom={zoom} 
                    aspect={1} 
                    cropShape="round"
                    showGrid={false} 
                    onCropChange={setCrop} 
                    onCropComplete={onCropComplete} 
                    onZoomChange={setZoom} 
                />
                </div>
                <div className="p-4 bg-panel flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-text-main">
                        <span className="text-sm font-semibold text-text-sub">Zoom</span>
                        <input 
                            type="range" 
                            min={1}
                            max={3} 
                            step={0.1} 
                            value={zoom} 
                            onChange={(e) => setZoom(Number(e.target.value))} 
                            className="flex-1 accent-highlight" 
                        />
                    </div>
                    <button onClick={handleCrop} className="w-full py-3 bg-highlight text-text-dark font-bold rounded-full hover:scale-105 transition-transform">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal