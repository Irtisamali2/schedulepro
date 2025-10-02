import { useParams } from 'wouter';
import FigmaDesignedWebsite from '@/components/FigmaDesignedWebsite';

export default function ClientWebsite() {
  const params = useParams();
  const subdomain = params.subdomain;
  const clientId = params.clientId;
  
  // Use subdomain if available (new secure route), otherwise fall back to clientId (legacy)
  return <FigmaDesignedWebsite subdomain={subdomain} clientId={clientId || ''} />;
}