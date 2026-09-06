import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Separator } from '@/Components/ui/Separator';
import { Tooltip, TooltipProvider } from '@/Components/ui/Tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/Lib/cn';

const SIDEBAR_COOKIE_NAME = 'admin_sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type SidebarContextValue = {
    state: 'expanded' | 'collapsed';
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar(): SidebarContextValue {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider.');
    }
    return context;
}

function readSidebarCookie(): boolean {
    if (typeof document === 'undefined') {
        return true;
    }

    const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)`));
    if (!match) {
        return true;
    }

    return match[1] === 'true';
}

function writeSidebarCookie(open: boolean): void {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
}

type SidebarProviderProps = React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
};

export function SidebarProvider({
    defaultOpen = true,
    className,
    style,
    children,
    ...props
}: SidebarProviderProps) {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [open, setOpenState] = React.useState(defaultOpen);

    React.useEffect(() => {
        setOpenState(readSidebarCookie());
    }, []);

    const setOpen = React.useCallback(
        (value: boolean | ((value: boolean) => boolean)) => {
            const next = typeof value === 'function' ? value(open) : value;
            setOpenState(next);
            writeSidebarCookie(next);
        },
        [open],
    );

    const toggleSidebar = React.useCallback(() => {
        if (isMobile) {
            setOpenMobile((current) => !current);
            return;
        }

        setOpen((current) => !current);
    }, [isMobile, setOpen]);

    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContextValue>(
        () => ({
            state,
            open,
            setOpen,
            isMobile,
            openMobile,
            setOpenMobile,
            toggleSidebar,
        }),
        [state, open, setOpen, isMobile, openMobile, toggleSidebar],
    );

    return (
        <SidebarContext.Provider value={contextValue}>
            <TooltipProvider>
                <div
                    style={
                        {
                            '--sidebar-width-icon': 'var(--sidebar-collapsed)',
                            ...style,
                        } as React.CSSProperties
                    }
                    className={cn('group/sidebar-wrapper flex min-h-svh w-full bg-[rgb(var(--canvas))] md:gap-2 md:p-2', className)}
                    data-sidebar-state={state}
                    {...props}
                >
                    {children}
                </div>
            </TooltipProvider>
        </SidebarContext.Provider>
    );
}

type SidebarProps = React.ComponentProps<'aside'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
};

export function Sidebar({
    side = 'right',
    variant = 'sidebar',
    collapsible = 'icon',
    className,
    children,
    ...props
}: SidebarProps) {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === 'none') {
        return (
            <aside
                className={cn(
                    'flex h-svh w-[var(--sidebar-width)] flex-col bg-[rgb(var(--sidebar-background))] text-[rgb(var(--sidebar-foreground))]',
                    className,
                )}
                {...props}
            >
                {children}
            </aside>
        );
    }

    if (isMobile) {
        return (
            <DialogPrimitive.Root open={openMobile} onOpenChange={setOpenMobile}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[rgb(var(--brand-950)/0.35)]" />
                    <DialogPrimitive.Content asChild aria-describedby={undefined}>
                    <aside
                    data-mobile="true"
                    dir={document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'}
                    className={cn(
                        'fixed inset-y-0 z-[var(--z-modal)] flex w-[min(var(--sidebar-width),92vw)] flex-col border border-[rgb(var(--sidebar-border))] bg-[rgb(var(--sidebar-background))] text-[rgb(var(--sidebar-foreground))] shadow-[var(--shadow-md)]',
                        side === 'right' ? 'start-0' : 'end-0',
                        className,
                    )}
                    {...props}
                >
                    <DialogPrimitive.Title className="sr-only">{document.documentElement.lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}</DialogPrimitive.Title>
                    {children}
                </aside>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        );
    }

    return (
        <aside
            data-state={state}
            data-collapsible={state === 'collapsed' ? collapsible : ''}
            data-variant={variant}
            data-side={side}
            className={cn(
                'group/sidebar hidden h-svh shrink-0 transition-[width] duration-[var(--motion-panel)] ease-[var(--ease-standard)] md:flex',
                'w-[var(--sidebar-width)] data-[state=collapsed]:w-[var(--sidebar-width-icon)]',
                side === 'right' ? 'order-first' : 'order-last',
                variant === 'floating' && 'p-2',
                className,
            )}
            {...props}
        >
            <div
                className={cn(
                    'relative flex h-full w-full flex-col bg-[rgb(var(--sidebar-background))] text-[rgb(var(--sidebar-foreground))]',
                    variant === 'sidebar' && 'border border-[rgb(var(--sidebar-border))]',
                    variant === 'floating' && 'rounded-[var(--radius-lg)] border border-[rgb(var(--sidebar-border))] shadow-[var(--shadow-sm)]',
                    variant === 'inset' && 'rounded-[var(--radius-xl)] border border-[rgb(var(--sidebar-border))] shadow-[var(--shadow-sm)]',
                )}
            >
                {children}
            </div>
        </aside>
    );
}

export function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
    const { toggleSidebar, state, isMobile, openMobile } = useSidebar();

    const expanded = isMobile ? openMobile : state === 'expanded';

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn('size-10 shrink-0 rounded-[var(--radius-md)]', className)}
            onClick={toggleSidebar}
            aria-label={expanded ? 'طي القائمة الجانبية' : 'فتح القائمة الجانبية'}
            aria-expanded={expanded}
            {...props}
        >
            {isMobile ? (
                <Menu className="size-5" />
            ) : expanded ? (
                <PanelRightClose className="size-5" />
            ) : (
                <PanelRightOpen className="size-5" />
            )}
        </Button>
    );
}

export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
    const { toggleSidebar } = useSidebar();

    return (
        <button
            type="button"
            aria-label="تبديل عرض القائمة"
            tabIndex={-1}
            onClick={toggleSidebar}
            className={cn(
                'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=right]/sidebar:-left-4 group-data-[side=left]/sidebar:-right-4 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-[rgb(var(--sidebar-border))] md:block',
                className,
            )}
            {...props}
        />
    );
}

export function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
    return (
        <main
            className={cn(
                'relative flex min-h-svh min-w-0 flex-1 flex-col overflow-x-clip rounded-[var(--radius-xl)] border border-[rgb(var(--border-soft))] bg-[rgb(var(--canvas))] md:shadow-[var(--shadow-xs)]',
                className,
            )}
            {...props}
        />
    );
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col gap-2 p-3', className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col gap-2 p-3', className)} {...props} />;
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
    return <Separator className={cn('mx-2 bg-[rgb(var(--sidebar-border))]', className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]/sidebar:overflow-hidden',
                className,
            )}
            {...props}
        />
    );
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('relative flex w-full min-w-0 flex-col p-2', className)} {...props} />;
}

export function SidebarGroupLabel({
    className,
    ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
    return (
        <div
            className={cn(
                'flex h-8 shrink-0 items-center rounded-[var(--radius-sm)] px-2 text-xs font-semibold tracking-wide text-[rgb(var(--muted))] outline-none ring-[rgb(var(--sidebar-ring))] transition-[margin,opacity] duration-[var(--motion-ui)] ease-linear focus-visible:ring-2',
                'group-data-[collapsible=icon]/sidebar:-mt-8 group-data-[collapsible=icon]/sidebar:opacity-0',
                className,
            )}
            {...props}
        />
    );
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('w-full text-sm', className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
    return <ul className={cn('flex w-full min-w-0 flex-col gap-1', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
    return <li className={cn('group/menu-item relative', className)} {...props} />;
}

const sidebarMenuButtonVariants = cn(
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-[var(--radius-md)] p-2 text-start text-sm font-medium outline-none ring-[rgb(var(--sidebar-ring))] transition-[width,height,padding,background,color] duration-[var(--motion-ui)] hover:bg-[rgb(var(--sidebar-accent))] hover:text-[rgb(var(--sidebar-accent-foreground))] focus-visible:ring-2 active:bg-[rgb(var(--sidebar-accent))] active:text-[rgb(var(--sidebar-accent-foreground))] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[rgb(var(--sidebar-primary))] data-[active=true]:font-semibold data-[active=true]:text-[rgb(var(--sidebar-primary-foreground))] group-data-[collapsible=icon]/sidebar:!size-10 group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:[&>span:last-child]:hidden [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
);

type SidebarMenuButtonProps = React.ComponentProps<'button'> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string;
};

export function SidebarMenuButton({
    asChild = false,
    isActive = false,
    tooltip,
    className,
    ...props
}: SidebarMenuButtonProps) {
    const Comp = asChild ? Slot : 'button';

    const button = (
        <Comp
            data-active={isActive}
            className={cn(sidebarMenuButtonVariants, className)}
            {...props}
        />
    );

    if (!tooltip) {
        return button;
    }

    return (
        <Tooltip content={tooltip} side="left" delayDuration={0}>
            <span className="inline-flex w-full">{button}</span>
        </Tooltip>
    );
}

export { useSidebar };
