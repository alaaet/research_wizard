
import { useState } from 'react';

interface UsePageMetadataProps {
  defaultTitle: string;
  defaultDescription: string;
}

export const usePageMetadata = ({ defaultTitle, defaultDescription }: UsePageMetadataProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);

  const handleTitleChange = (value: string | number) => {
    setTitle(String(value));
  };

  const handleDescriptionChange = (value: string | number) => {
    setDescription(String(value));
  };

  return {
    title,
    description,
    handleTitleChange,
    handleDescriptionChange
  };
};

export default usePageMetadata;
