import React, { useEffect, useRef, useState } from "react";
import { useCreateGenre, useUpdateGenre } from "../../hooks/genre/useGenre";
import { Close, CloudUploadOutlined } from "@mui/icons-material";
import { useConfirmModalStore } from "../../stores/useConfirmModalStore";
import { CustomToast } from "../../components/shared/feedback/CustomToast";

interface AddEditGenreModalProps {
    genre: any | null;
    onClose: () => void
}

const AddEditGenreModal: React.FC<AddEditGenreModalProps> = ({ genre, onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showConfirm, closeModal, setLoading} = useConfirmModalStore()

    useEffect(() => {
        if(genre) {
            setName(genre.name || '');
            setDescription(genre.description || '');
            setPreviewUrl(genre.image || '');
        }
    }, [genre])
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const { mutate: create, isPending: isCreating } = useCreateGenre()
    const { mutate: update, isPending: isUpdating } = useUpdateGenre()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                CustomToast.error("Image size must be less than 5MB");
                return;
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('name', name);
        formData.append('description', description);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        // update
        if (genre) {
            // update genre đã có
            // ktra nếu ko thay đổi -> ko update
            if (name === genre.name && 
                description === genre.description && 
                !imageFile
            ) {
                CustomToast.info("No changes detected.");
                return;
            }
            showConfirm('save', () => {
                setLoading(true);
                update(
                    { slug: genre.slug, data: formData },
                    {
                        onSuccess: () => {
                            CustomToast.success("Successfully updated genre!");
                            onClose();
                        },
                        onError: (error: any) => {
                            const errData = error.response?.data;
                            if (errData?.name) 
                                CustomToast.error(`Name error: ${errData.name[0]}`);
                            else 
                                CustomToast.error("Failed to update genre!");
                        },
                        onSettled: () => {
                            setLoading(false);
                            closeModal();
                        },
                    }
                );
            }, {
                message: `Confirm to update genre "${genre.name}"?`,
            });
        } 
        // create
        else {
            formData.append('is_active', 'true')
            showConfirm('save', () => {
                setLoading(true);
                create(formData as any, { 
                    onSuccess: () => {
                        CustomToast.success("Successfully created new genre!");
                        onClose();
                    },
                    onError: (error: any) => {
                        const errData = error.response?.data;
                        if (errData?.name) 
                            CustomToast.error(`Name already exists!`);
                        else 
                            CustomToast.error("Failed to create genre!");
                    },
                    onSettled: () => {
                        setLoading(false);
                        closeModal();
                    },
                });
            }, {
                message: `Confirm to create new genre "${name}"?`,
            });
        }
    };

    const isPending = isCreating || isUpdating

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 backdrop-blur-sm">
                
            <div className="relative bg-panel w-full max-w-md p-6 rounded-xl border border-border shadow-2xl">
                <button 
                    onClick={onClose} 
                    className="absolute right-3 top-4 flex items-center text-text-sub rounded-full hover:text-text-main hover:scale-105 border transition-border duration-300"
                >
                    <Close fontSize="medium"/>
                </button>
                <h2 className="text-xl font-bold mb-6 text-text-main">
                    {genre ? 'Edit Genre' : 'Add New Genre'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Ảnh */}
                    <div className="flex flex-col items-center gap-4">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-40 h-40 bg-search border-2 border-dashed border-border rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-highlight transition-colors relative group"
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-base/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CloudUploadOutlined className="text-text-main" />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <CloudUploadOutlined className="text-text-sub text-3xl mb-2" />
                                    <p className="text-xs text-text-sub">Upload cover image</p>
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        
                    </div>
                    {/* Tên và mô tả */}
                    <div className="w-full space-y-4 mt-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub pl-1">Name <span className="text-error">*</span></label>
                            <input 
                                type="text" 
                                className="w-full bg-search p-3 rounded-lg text-text-main outline-none border border-transparent focus:border-highlight focus:ring-2 focus:ring-highlight/20 transition-all" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="e.g. Pop, Rock..." 
                                required 
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub pl-1">Description</label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Add a short description..." 
                                className="w-full bg-search p-3 rounded-lg text-text-main outline-none border border-transparent focus:border-highlight focus:ring-2 focus:ring-highlight/20 transition-all min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                    
                    {/* Nút lưu */}
                    <div className="flex justify-end gap-3 mt-4">
                        <button 
                            type="button"
                            onClick={() => onClose()}
                            className="px-4 py-2 font-bold text-text-sub hover:text-text-main"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isPending} 
                            className="bg-highlight text-text-dark px-6 py-2 rounded-full font-bold hover:scale-105 disabled:opacity-50"
                        >
                            {isPending ? 'Saving ....' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddEditGenreModal;