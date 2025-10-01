import { useState, useRef } from 'react';
import { useEditableWebsite } from '@/contexts/EditableWebsiteContext';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface EditableImageProps {
  src: string;
  alt: string;
  className?: string;
  'data-testid'?: string;
  onUpdate?: (newImageUrl: string) => void;
  sectionId?: string;
  elementId?: string;
  isCircular?: boolean;
}

export default function EditableImage({
  src,
  alt,
  className,
  'data-testid': dataTestId,
  onUpdate,
  sectionId,
  elementId,
  isCircular = false
}: EditableImageProps) {
  const { isEditable } = useEditableWebsite();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (onUpdate) {
        onUpdate(base64String);
        toast({
          title: "Image Updated",
          description: "Your image has been updated successfully"
        });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isEditable) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={src}
        alt={alt}
        className={`${className} ${isEditable ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        data-testid={dataTestId}
      />
      
      {isEditable && isHovered && (
        <div 
          className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isCircular ? 'rounded-full' : ''}`}
          onClick={handleClick}
        >
          <div className="bg-white rounded-lg p-3 flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-medium text-gray-700">Change Image</span>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        data-testid={`${dataTestId}-input`}
      />
    </div>
  );
}
