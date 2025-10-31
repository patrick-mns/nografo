import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Github, Loader2, Lock } from 'lucide-react';

interface LoginBlockModalProps {
  onLogin: () => void;
  isLoading?: boolean;
}

const LoginBlockModal: React.FC<LoginBlockModalProps> = ({ onLogin, isLoading = false }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {}
      <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-background/98 backdrop-blur-sm border border-border shadow-2xl ring-1 ring-black/10">
          <CardHeader className="text-center space-y-4">
            {}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-xl font-bold text-foreground">Login Required</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Authentication Needed
              </Badge>
              <CardDescription className="text-muted-foreground">
                Please login to access all features
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={onLogin}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 text-sm"
                size="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Login with GitHub
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By logging in, you agree to our terms of service
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Made by{' '}
            <a
              href="https://github.com/patrick-mns"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              @patrick-mns
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginBlockModal;
