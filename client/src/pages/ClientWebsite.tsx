import { useParams } from 'wouter';
import FigmaDesignedWebsite from '@/components/FigmaDesignedWebsite';

export default function ClientWebsite() {
  const { clientId } = useParams();
  
  // Use the Figma designed website as the standard for all clients
  return <FigmaDesignedWebsite clientId={clientId || ''} />;
}