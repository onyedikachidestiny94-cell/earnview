import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Logo className="text-blue-600 h-8 w-8" />
          <span className="font-bold text-xl text-slate-900 tracking-tight">EarnView</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
              New tasks added daily
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Earn rewards for <span className="text-blue-600">your attention</span>.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
              A premium platform where you complete tasks, watch promotional content, and earn real value. Fast payouts, transparent tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-base">
                <Link href="/sign-up">Start Earning Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <p className="text-sm text-slate-500 font-medium">Free to join. No hidden fees.</p>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="absolute inset-0 bg-blue-100 rounded-[2rem] transform rotate-3 scale-105 opacity-50"></div>
            <div className="relative bg-white border border-slate-200 p-8 rounded-2xl shadow-xl">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Available Balance</p>
                  <p className="text-4xl font-bold text-slate-900">$142.50</p>
                </div>
                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Watch Product Demo</p>
                      <p className="text-xs text-slate-500">2 mins • Tech</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">+$2.50</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Complete Survey</p>
                      <p className="text-xs text-slate-500">5 mins • Lifestyle</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">+$5.00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for reliability</h2>
              <p className="text-slate-600">We partner with top brands to bring you high-quality tasks. You get paid for your time, they get genuine engagement.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Transparent Earnings</h3>
                <p className="text-slate-600 leading-relaxed">Know exactly how much you'll earn before you start. No points confusion, just straight dollar values.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Fast Payouts</h3>
                <p className="text-slate-600 leading-relaxed">Reach the minimum threshold and withdraw your earnings directly to your preferred payment method.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Gamified Progress</h3>
                <p className="text-slate-600 leading-relaxed">Level up, earn badges, and build daily streaks. The more active you are, the higher your earning potential.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo className="text-slate-400 h-6 w-6" />
            <span className="font-semibold text-slate-500">EarnView</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} EarnView. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
