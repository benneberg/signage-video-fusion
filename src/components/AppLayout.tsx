import { ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Image, Sparkles, RefreshCw, ListVideo, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

interface AppLayoutProps {
  children: ReactNode;
  isLoaded?: boolean;
  isLoading?: boolean;
  onInitialize?: () => void;
  showInitButton?: boolean;
}

const tabs = [
  { path: '/merge', label: 'Merge Videos', icon: Film },
  { path: '/image-to-video', label: 'Images to Video', icon: Image },
  { path: '/playlist', label: 'Playlist', icon: ListVideo },
];

export function AppLayout({ 
  children, 
  isLoaded, 
  isLoading, 
  onInitialize,
  showInitButton = false
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen pb-8">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-4xl py-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Film className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            </Link>
            <div>
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-xl font-bold gradient-text">VideoFusion</h1>
              </Link>
              <p className="text-xs text-muted-foreground">Deterministic Playlist Compilation</p>
            </div>
          </div>
            
            {showInitButton && !isLoaded && (
              <Button 
                variant="glass" 
                size="sm"
                onClick={onInitialize}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isLoading ? 'Loading...' : 'Initialize'}
              </Button>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex gap-1 mt-4 p-1 glass-panel rounded-xl">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                    text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container max-w-4xl pt-6 space-y-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="container max-w-4xl mt-12 text-center text-xs text-muted-foreground/50">
        <p>VideoFusion • Process videos in your browser</p>
      </footer>
    </div>
  );
}
