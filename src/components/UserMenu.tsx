import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const UserMenu = () => {
  const { user, signOut, loading } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  // Debug logging
  console.log('UserMenu render:', { user: !!user, loading, email: user?.email });

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/auth')}
        className="border-border hover:bg-accent hover:text-accent-foreground min-w-[80px]"
        style={{ 
          backgroundColor: '#FF0000 !important',
          color: '#FFFFFF !important',
          border: '3px solid black !important',
          fontSize: '16px !important',
          fontWeight: 'bold !important',
          zIndex: 9999
        }}
      >
        {lang === 'nl' ? 'Inloggen' : 'Sign In'}
      </Button>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: lang === 'nl' ? 'Uitgelogd' : 'Signed out',
        description: lang === 'nl' ? 'Je bent succesvol uitgelogd' : 'You have been signed out successfully'
      });
      navigate('/');
    } catch (error) {
      toast({
        title: lang === 'nl' ? 'Fout' : 'Error',
        description: lang === 'nl' ? 'Er ging iets mis bij uitloggen' : 'Something went wrong signing out',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div 
      className="flex items-center z-50" 
      style={{ 
        backgroundColor: 'red', 
        border: '3px solid blue', 
        padding: '4px',
        minWidth: '50px',
        minHeight: '40px'
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full bg-yellow-500 hover:bg-yellow-400"
            style={{ 
              backgroundColor: '#FFD700 !important',
              border: '2px solid black',
              zIndex: 9999
            }}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback 
                className="text-xs font-bold text-black"
                style={{ 
                  backgroundColor: '#00FF00 !important',
                  color: '#000000 !important',
                  border: '1px solid black'
                }}
              >
                {getInitials(user.email || 'U')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-white border-2 border-black shadow-lg" 
        align="end" 
        forceMount
        style={{ 
          backgroundColor: '#FFFFFF !important',
          border: '2px solid black !important',
          zIndex: 9999
        }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {lang === 'nl' ? 'Ingelogd als' : 'Signed in as'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{lang === 'nl' ? 'Uitloggen' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};