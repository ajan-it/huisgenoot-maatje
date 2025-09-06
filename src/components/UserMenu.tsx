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
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(user.email || 'U')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
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