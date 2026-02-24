import { X } from "lucide-react";

interface DpViewerProps {
    imageUrl: string;
    onClose: () => void;
}

export function DpViewer({ imageUrl, onClose }: DpViewerProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
            <img
                src={imageUrl}
                alt="Display Picture"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-sm shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing
            />
        </div>
    );
}
