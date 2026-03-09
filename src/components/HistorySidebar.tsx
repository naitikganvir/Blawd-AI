import { useState, useEffect } from 'react';
import { BookOpen, Trash2, LogOut, Plus, Headphones, Brain, Upload, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import blawdLogo from '@/assets/blawd-logo.webp';

interface BookSession {
  id: string;
  file_name: string;
  extracted_text: string;
  created_at: string;
}

interface HistorySidebarProps {
  onSelectSession: (text: string, fileName: string) => void;
  onNewUpload: () => void;
  activeFileName: string | null;
}

export function HistorySidebar({ onSelectSession, onNewUpload, activeFileName }: HistorySidebarProps) {
  const [sessions, setSessions] = useState<BookSession[]>([]);
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('book_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSessions(data);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('book_sessions').delete().eq('id', id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const userEmail = user?.email || '';
  const displayName = user?.user_metadata?.full_name || userEmail.split('@')[0];

  const features = [
    { icon: Upload, label: 'PDF, TXT, Images' },
    { icon: Headphones, label: 'Natural Voice' },
    { icon: Brain, label: 'AI Learning' },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <img src={blawdLogo} alt="Blawd AI" className="h-6 w-6 invert shrink-0" />
        {!collapsed && (
          <span className="font-display text-sm font-bold text-foreground">
            Blawd <span className="text-gradient">AI</span>
          </span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onNewUpload} className="gap-2 text-primary hover:bg-primary/10">
                <Plus className="h-4 w-4" />
                {!collapsed && <span className="text-sm font-medium">New Upload</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Features */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground">Features</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1 px-2">
                {features.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-muted-foreground">Your Books</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.length === 0 ? (
                !collapsed && (
                  <p className="px-3 py-4 text-xs text-muted-foreground">No books yet. Upload one to get started!</p>
                )
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectSession(session.extracted_text, session.file_name)}
                      className={`group gap-2 ${activeFileName === session.file_name ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-1 items-center justify-between overflow-hidden">
                          <div className="min-w-0">
                            <p className="truncate text-sm">{session.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="ml-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between overflow-hidden">
              <p className="truncate text-sm text-foreground">{displayName}</p>
              <button onClick={signOut} className="shrink-0 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
