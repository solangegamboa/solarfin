"use client";

import React, { useEffect } from 'react';
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

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

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
                <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
                    <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
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
