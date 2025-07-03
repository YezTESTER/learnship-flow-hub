
import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Crop, Save, X } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
  imageSrc: string;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  onCropComplete,
  imageSrc
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState([1]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to 200x200 (1:1 aspect ratio)
    canvas.width = 200;
    canvas.height = 200;

    // Calculate crop dimensions
    const scale = zoom[0];
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const scaledSize = sourceSize * scale;
    
    // Calculate source coordinates
    const sourceX = (image.naturalWidth - scaledSize) / 2 - (position.x / scale);
    const sourceY = (image.naturalHeight - scaledSize) / 2 - (position.y / scale);

    // Draw the cropped image
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      scaledSize,
      scaledSize,
      0,
      0,
      200,
      200
    );

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  }, [zoom, position, onCropComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Crop className="h-5 w-5 mr-2" />
            Crop Profile Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="absolute w-full h-full object-contain"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom[0]})`,
                  transformOrigin: 'center',
                }}
                draggable={false}
              />
            </div>
            
            {/* Perfect 1:1 crop overlay - square instead of oval */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute border-2 border-white shadow-lg"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '160px',
                  height: '160px',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%'
                }}
              ></div>
              {/* Dark overlay to show crop area */}
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              <div 
                className="absolute bg-transparent"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '160px',
                  height: '160px',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <Slider
              value={zoom}
              onValueChange={setZoom}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleCrop} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Apply Crop
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
