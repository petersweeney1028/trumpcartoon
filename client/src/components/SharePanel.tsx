import { useToast } from "@/hooks/use-toast";

interface SharePanelProps {
  remixId: string;
}

const SharePanel = ({ remixId }: SharePanelProps) => {
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/scene/${remixId}`;
  
  const handleShare = async (platform: string) => {
    try {
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this hilarious political cartoon remix I made!')}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this remix: ${shareUrl}`)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'copy':
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copied!",
            description: "Share link has been copied to clipboard",
          });
          break;
        case 'download':
          // This would be implemented on the backend, just show toast for now
          toast({
            title: "Download started",
            description: "Your video will download shortly",
          });
          // Actual implementation would call API endpoint to download video
          break;
        default:
          break;
      }
    } catch (err) {
      toast({
        title: "Error sharing",
        description: "There was a problem sharing this remix",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between mt-4 p-4 bg-white rounded-lg shadow">
      <div>
        <span className="text-muted-foreground">Share this remix:</span>
      </div>
      <div className="flex gap-2">
        <button
          className="p-2 bg-dark text-white rounded-full hover:opacity-90 transition-opacity"
          onClick={() => handleShare('copy')}
          aria-label="Copy link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </button>
        <button
          className="p-2 bg-secondary text-white rounded-full hover:opacity-90 transition-opacity"
          onClick={() => handleShare('download')}
          aria-label="Download video"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SharePanel;
