import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import TasksPage from "@/pages/tasks";
import TaskDetailPage from "@/pages/task-detail";
import WalletPage from "@/pages/wallet";
import ReferralsPage from "@/pages/referrals";
import AchievementsPage from "@/pages/achievements";
import LeaderboardPage from "@/pages/leaderboard";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminTasks from "@/pages/admin/tasks";
import AdminWithdrawals from "@/pages/admin/withdrawals";

import Layout from "@/components/layout";
import AdminLayout from "@/components/admin-layout";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(221.2, 83.2%, 53.3%)",
    colorForeground: "hsl(222.2, 84%, 4.9%)",
    colorMutedForeground: "hsl(215.4, 16.3%, 46.9%)",
    colorDanger: "hsl(0, 84.2%, 60.2%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(0, 0%, 100%)",
    colorInputForeground: "hsl(222.2, 84%, 4.9%)",
    colorNeutral: "hsl(214.3, 31.8%, 91.4%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-xl w-[440px] max-w-full overflow-hidden shadow-sm border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-slate-900",
    headerSubtitle: "text-sm text-slate-500",
    socialButtonsBlockButtonText: "text-sm font-medium text-slate-700",
    formFieldLabel: "text-sm font-medium text-slate-700",
    footerActionLink: "text-sm font-medium text-blue-600 hover:text-blue-700",
    footerActionText: "text-sm text-slate-500",
    dividerText: "text-xs text-slate-400",
    identityPreviewEditButton: "text-sm text-blue-600",
    formFieldSuccessText: "text-sm text-green-600",
    alertText: "text-sm text-red-600",
    logoBox: "h-10",
    logoImage: "h-10",
    socialButtonsBlockButton: "border border-slate-200 bg-white hover:bg-slate-50 rounded-lg",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-lg",
    formFieldInput: "border border-slate-200 rounded-lg px-3 py-2 text-sm",
    footerAction: "mt-4",
    dividerLine: "bg-slate-200",
    alert: "bg-red-50 border-red-200 rounded-lg",
    otpCodeFieldInput: "border border-slate-200 rounded-lg",
    formFieldRow: "mb-4",
    main: "px-6 py-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function AdminProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  // We'll handle isAdmin check within the component/layout itself since we need the user profile
  return (
    <>
      <Show when="signed-in">
        <AdminLayout>
          <Component />
        </AdminLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your EarnView account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start earning today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
            <Route path="/tasks"><ProtectedRoute component={TasksPage} /></Route>
            <Route path="/tasks/:id"><ProtectedRoute component={TaskDetailPage} /></Route>
            <Route path="/wallet"><ProtectedRoute component={WalletPage} /></Route>
            <Route path="/referrals"><ProtectedRoute component={ReferralsPage} /></Route>
            <Route path="/achievements"><ProtectedRoute component={AchievementsPage} /></Route>
            <Route path="/leaderboard"><ProtectedRoute component={LeaderboardPage} /></Route>
            <Route path="/notifications"><ProtectedRoute component={NotificationsPage} /></Route>
            <Route path="/profile"><ProtectedRoute component={ProfilePage} /></Route>

            <Route path="/admin"><AdminProtectedRoute component={AdminDashboard} /></Route>
            <Route path="/admin/users"><AdminProtectedRoute component={AdminUsers} /></Route>
            <Route path="/admin/tasks"><AdminProtectedRoute component={AdminTasks} /></Route>
            <Route path="/admin/withdrawals"><AdminProtectedRoute component={AdminWithdrawals} /></Route>

            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
