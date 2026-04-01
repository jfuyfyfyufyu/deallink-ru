import { 
  LayoutDashboard, Package, Handshake, Users, Star, Settings, LogOut, 
  ShoppingBag, FileText, UserCircle, BarChart3, ClipboardList
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const adminItems = [
  { title: 'Дашборд', url: '/admin', icon: LayoutDashboard },
  { title: 'Блогеры', url: '/admin/bloggers', icon: Users },
  { title: 'Селлеры', url: '/admin/sellers', icon: ShoppingBag },
  { title: 'Все сделки', url: '/admin/deals', icon: Handshake },
  { title: 'Настройки', url: '/admin/settings', icon: Settings },
];

const sellerItems = [
  { title: 'Дашборд', url: '/seller', icon: LayoutDashboard },
  { title: 'Мои товары', url: '/seller/products', icon: Package },
  { title: 'Заявки', url: '/seller/applications', icon: FileText },
  { title: 'Сделки', url: '/seller/deals', icon: Handshake },
  { title: 'Аналитика', url: '/seller/analytics', icon: BarChart3 },
  { title: 'Отзывы', url: '/seller/reviews', icon: Star },
  { title: 'Профиль', url: '/seller/profile', icon: UserCircle },
];

const bloggerItems = [
  { title: 'Лента', url: '/blogger', icon: LayoutDashboard },
  { title: 'Мои сделки', url: '/blogger/deals', icon: Handshake },
  { title: 'Аналитика', url: '/blogger/analytics', icon: BarChart3 },
  { title: 'Анкета', url: '/blogger/onboarding', icon: ClipboardList },
  { title: 'Профиль', url: '/blogger/profile', icon: UserCircle },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const role = profile?.role || 'blogger';
  const items = role === 'admin' ? adminItems : role === 'seller' ? sellerItems : bloggerItems;
  const roleLabel = role === 'admin' ? 'Админ-панель' : role === 'seller' ? 'Кабинет селлера' : 'Кабинет блогера';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className={`px-3 pt-4 pb-2 ${collapsed ? 'text-center' : ''}`}>
          <span className="text-base font-bold font-display tracking-tight text-sidebar-foreground">
            {collapsed ? (
              <span className="text-primary">D</span>
            ) : (
              <>DEAL<span className="text-primary">LINK</span></>
            )}
          </span>
          {!collapsed && (
            <div className="glow-line mt-2 opacity-60" />
          )}
        </div>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-[0.15em] font-medium px-3 mt-1">
              {roleLabel}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin' || item.url === '/seller' || item.url === '/blogger'}
                      className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200 rounded-lg relative group"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.15)]"
                    >
                      {/* Active indicator bar */}
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 group-[.active]:h-5 bg-primary rounded-full transition-all duration-300 opacity-0 group-[.active]:opacity-100" />
                      <item.icon className="mr-2.5 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50">
        {!collapsed && profile && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/40 truncate">
            {profile.name || 'Пользователь'}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-sidebar-foreground/40 hover:text-destructive transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span className="text-sm">Выйти</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
