import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { AiAssistantProvider } from './contexts/AiAssistantContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BimbinganRevisiProvider } from './contexts/BimbinganRevisiContext';
import { JurnalProvider } from './contexts/JurnalContext';
import { RoadmapProvider } from './contexts/RoadmapContext';
import { AdminPage } from './pages/AdminPage';
import { AsistenPage } from './pages/AsistenPage';
import { BerandaPage } from './pages/BerandaPage';
import { BimbinganPage } from './pages/BimbinganPage';
import { JurnalPage } from './pages/JurnalPage';
import { LandingPage } from './pages/LandingPage';
import { LanggananPage } from './pages/LanggananPage';
import { LegalPage } from './pages/LegalPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PengaturanPage } from './pages/PengaturanPage';
import { PersetujuanPage } from './pages/PersetujuanPage';
import { PremiumPage } from './pages/PremiumPage';
import { ProfilPage } from './pages/ProfilPage';
import { RevisiPage } from './pages/RevisiPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { PERSETUJUAN_VERSI_SAAT_INI } from './types/user';

function useUserStage() {
  const { firebaseUser, profile, authLoading, profileLoading } = useAuth();
  const isReady = !authLoading && (!firebaseUser || !profileLoading);

  const hasConsent = Boolean(
    profile && profile.persetujuanVersi === PERSETUJUAN_VERSI_SAAT_INI && profile.persetujuanAt
  );
  const hasOnboarded = Boolean(profile && profile.onboardingSelesai);

  return { isReady, firebaseUser, hasConsent, hasOnboarded };
}

function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isReady, firebaseUser, hasConsent, hasOnboarded } = useUserStage();
  if (!isReady) return <LoadingSkeleton />;
  if (!firebaseUser) return <>{children}</>;
  if (!hasConsent) return <Navigate to="/persetujuan" replace />;
  if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/beranda" replace />;
}

function ConsentRoute({ children }: { children: React.ReactNode }) {
  const { isReady, firebaseUser, hasConsent, hasOnboarded } = useUserStage();
  if (!isReady) return <LoadingSkeleton />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (hasConsent && !hasOnboarded) return <Navigate to="/onboarding" replace />;
  if (hasConsent && hasOnboarded) return <Navigate to="/beranda" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isReady, firebaseUser, hasConsent, hasOnboarded } = useUserStage();
  if (!isReady) return <LoadingSkeleton />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!hasConsent) return <Navigate to="/persetujuan" replace />;
  if (hasOnboarded) return <Navigate to="/beranda" replace />;
  return <>{children}</>;
}

function ProtectedAppRoute({ children }: { children: React.ReactNode }) {
  const { isReady, firebaseUser, hasConsent, hasOnboarded } = useUserStage();
  if (!isReady) return <LoadingSkeleton />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!hasConsent) return <Navigate to="/persetujuan" replace />;
  if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  return (
    <RoadmapProvider>
      <BimbinganRevisiProvider>
        <JurnalProvider>
          <AiAssistantProvider>
            <AppLayout>{children}</AppLayout>
          </AiAssistantProvider>
        </JurnalProvider>
      </BimbinganRevisiProvider>
    </RoadmapProvider>
  );
}

function GuestLandingRoute() {
  const { isReady, firebaseUser, hasConsent, hasOnboarded } = useUserStage();
  if (!isReady) return <LoadingSkeleton />;
  if (!firebaseUser) return <LandingPage />;
  if (!hasConsent) return <Navigate to="/persetujuan" replace />;
  if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/beranda" replace />;
}

function OptionalAppPremiumRoute() {
  const { isReady, firebaseUser, hasConsent, hasOnboarded } = useUserStage();
  if (!isReady) return <LoadingSkeleton />;
  if (firebaseUser && hasConsent && hasOnboarded) {
    return (
      <ProtectedAppRoute>
        <PremiumPage />
      </ProtectedAppRoute>
    );
  }
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PremiumPage />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GuestLandingRoute />} />

            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <LoginPage />
                </GuestOnlyRoute>
              }
            />

            <Route
              path="/persetujuan"
              element={
                <ConsentRoute>
                  <PersetujuanPage />
                </ConsentRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <OnboardingPage />
                </OnboardingRoute>
              }
            />

            <Route
              path="/beranda"
              element={
                <ProtectedAppRoute>
                  <BerandaPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedAppRoute>
                  <RoadmapPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/bimbingan"
              element={
                <ProtectedAppRoute>
                  <BimbinganPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/revisi"
              element={
                <ProtectedAppRoute>
                  <RevisiPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/jurnal"
              element={
                <ProtectedAppRoute>
                  <JurnalPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/asisten"
              element={
                <ProtectedAppRoute>
                  <AsistenPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/profil"
              element={
                <ProtectedAppRoute>
                  <ProfilPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/pengaturan"
              element={
                <ProtectedAppRoute>
                  <PengaturanPage />
                </ProtectedAppRoute>
              }
            />
            <Route
              path="/langganan"
              element={
                <ProtectedAppRoute>
                  <LanggananPage />
                </ProtectedAppRoute>
              }
            />
            <Route path="/premium" element={<OptionalAppPremiumRoute />} />
            <Route
              path="/admin"
              element={
                <ProtectedAppRoute>
                  <AdminPage />
                </ProtectedAppRoute>
              }
            />

            <Route path="/syarat" element={<LegalPage jenis="syarat" />} />
            <Route path="/privasi" element={<LegalPage jenis="privasi" />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
