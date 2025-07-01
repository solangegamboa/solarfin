"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun,
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Landmark,
  Repeat,
  Sparkles,
  LogOut,
  Menu,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TransactionsProvider } from '@/contexts/transactions-context';
import { CreditCardsProvider } from '@/contexts/credit-cards-context';
import { LoansProvider } from '@/contexts/loans-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { RecurringTransactionsProvider } from '@/contexts/recurring-transactions-context';
import { AuthProvider } from '@/contexts/auth-context';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const getInitials = (email: string) => email[0].toUpperCase();

  return (
    <TransactionsProvider>
      <CreditCardsProvider>
        <LoansProvider>
          <RecurringTransactionsProvider>
            <TooltipProvider>
              <div className="flex min-h-screen w-full bg-muted/40">
                <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
                  <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                    <Link
                      href="/dashboard"
                      className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                    >
                      <Sun className="h-4 w-4 transition-all group-hover:scale-110" />
                      <span className="sr-only">SolarFin</span>
                    </Link>
                    <NavItem icon={LayoutDashboard} href="/dashboard" label="Painel" />
                    <NavItem icon={ArrowLeftRight} href="/dashboard/expenses" label="Transações" />
                    <NavItem icon={CreditCard} href="/dashboard/credit-cards" label="Cartões de Crédito" />
                    <NavItem icon={Landmark} href="/dashboard/loans" label="Empréstimos" />
                    <NavItem icon={Repeat} href="/dashboard/recurring" label="Recorrentes" />
                    <NavItem icon={Sparkles} href="/dashboard/savings-ai" label="Economia com IA" />
                  </nav>
                  <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
                    <ThemeToggle />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(user.email || 'U')}</AvatarFallback>
                          </Avatar>
                          <span className="sr-only">Usuário</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">{user.email}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={logout} className="h-9 w-9 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8">
                          <LogOut className="h-5 w-5" />
                          <span className="sr-only">Sair</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Sair</TooltipContent>
                    </Tooltip>
                  </nav>
                </aside>
                <div className="flex flex-1 flex-col sm:pl-14">
                  <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:hidden">
                    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Abrir menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs">
                            <nav className="grid gap-6 text-lg font-medium">
                                <Link
                                    href="/dashboard"
                                    className="group mb-4 flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    <Sun className="h-5 w-5 transition-all group-hover:scale-110" />
                                    <span className="sr-only">SolarFin</span>
                                </Link>
                                <MobileNavItem href="/dashboard" onClick={() => setMobileNavOpen(false)}><LayoutDashboard className="h-5 w-5" />Painel</MobileNavItem>
                                <MobileNavItem href="/dashboard/expenses" onClick={() => setMobileNavOpen(false)}><ArrowLeftRight className="h-5 w-5" />Transações</MobileNavItem>
                                <MobileNavItem href="/dashboard/credit-cards" onClick={() => setMobileNavOpen(false)}><CreditCard className="h-5 w-5" />Cartões de Crédito</MobileNavItem>
                                <MobileNavItem href="/dashboard/loans" onClick={() => setMobileNavOpen(false)}><Landmark className="h-5 w-5" />Empréstimos</MobileNavItem>
                                <MobileNavItem href="/dashboard/recurring" onClick={() => setMobileNavOpen(false)}><Repeat className="h-5 w-5" />Recorrentes</MobileNavItem>
                                <MobileNavItem href="/dashboard/savings-ai" onClick={() => setMobileNavOpen(false)}><Sparkles className="h-5 w-5" />Economia com IA</MobileNavItem>
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{getInitials(user.email || 'U')}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{user.email}</TooltipContent>
                        </Tooltip>
                    </div>
                  </header>
                  <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
                    {children}
                  </main>
                </div>
              </div>
            </TooltipProvider>
          </RecurringTransactionsProvider>
        </LoansProvider>
      </CreditCardsProvider>
    </TransactionsProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}


const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return(
        <Tooltip>
            <TooltipTrigger asChild>
            <Link
                href={href}
                className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                isActive && 'bg-accent text-accent-foreground'
                )}
            >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{label}</span>
            </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
}

const MobileNavItem = ({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode; }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                isActive && 'font-semibold text-foreground'
            )}
        >
            {children}
        </Link>
    );
};