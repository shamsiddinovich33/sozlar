import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { StreakHeatmap } from "@/components/charts/streak-heatmap";
import { WeeklyActivityChart } from "@/components/charts/weekly-activity-chart";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { DeleteAccount } from "@/components/profile/delete-account";
import { DevicesList, type DeviceItem } from "@/components/profile/devices-list";
import { HardestWords } from "@/components/profile/hardest-words";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { StatTiles } from "@/components/profile/stat-tiles";
import { ThemeSetting } from "@/components/profile/theme-setting";
import { auth } from "@/lib/auth";
import { getCloudinaryConfig } from "@/lib/cloudinary";
import { formatRelativeUz } from "@/lib/dates";
import { listDeviceSessions } from "@/lib/device-sessions";
import { getProfileAccount, getProfileStats } from "@/lib/queries/profile";
import { requireUser } from "@/lib/session";
import { describeUserAgent, formatLocation } from "@/lib/user-agent";

export const metadata: Metadata = { title: "Profil" };

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-4 rounded-xl bg-card p-5 shadow-sm sm:p-6">
      <div className="grid gap-1">
        <h3 id={id} className="font-bold">
          {title}
        </h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function ProfilePage() {
  const { id } = await requireUser();
  const [account, stats, deviceRows, session] = await Promise.all([
    getProfileAccount(id),
    getProfileStats(id),
    listDeviceSessions(id),
    auth(),
  ]);
  if (!account) redirect("/login");

  const currentId = session?.sessionId;
  const now = new Date();
  const devices: DeviceItem[] = deviceRows
    .map((row) => {
      const { browser, os, kind } = describeUserAgent(row.userAgent);
      return {
        id: row.id,
        title: `${browser} · ${os}`,
        kind,
        location: formatLocation(row.city, row.country),
        signedIn: formatRelativeUz(row.createdAt, now),
        lastSeen: formatRelativeUz(row.lastSeenAt, now),
        current: row.id === currentId,
      };
    })
    // The current device first
    .sort((a, b) => Number(b.current) - Number(a.current));

  return (
    <div className="grid grid-cols-1 gap-8">
      <header className="flex flex-wrap items-center gap-4">
        <AvatarUploader
          name={account.name ?? account.username}
          image={account.image}
          uploadEnabled={getCloudinaryConfig() !== null}
        />
        <div className="grid min-w-0 gap-0.5">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">
            {account.name ?? account.username}
          </h1>
          {account.username && <p className="text-muted-foreground">@{account.username}</p>}
        </div>
      </header>

      <section aria-label="Statistika" className="grid gap-4">
        <StatTiles stats={stats} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-w-0 rounded-xl bg-card p-5 shadow-sm">
            <WeeklyActivityChart data={stats.weekly} />
          </div>
          <div className="min-w-0 rounded-xl bg-card p-5 shadow-sm">
            <StreakHeatmap
              weeks={stats.heatmap}
              streak={stats.streak}
              activeDays={stats.activeDays}
            />
          </div>
        </div>
      </section>

      <HardestWords words={stats.hardest} />

      <section aria-labelledby="settings-title" className="grid gap-4">
        <h2 id="settings-title" className="text-lg font-bold">
          Sozlamalar
        </h2>
        <SettingsSection id="settings-profile" title="Profil ma'lumotlari">
          <ProfileForm
            defaults={{
              name: account.name ?? "",
              username: account.username ?? "",
              email: account.email,
            }}
          />
        </SettingsSection>
        <SettingsSection id="settings-password" title="Parol">
          <PasswordForm hasPassword={account.hasPassword} />
        </SettingsSection>
        <SettingsSection
          id="settings-devices"
          title="Qurilmalar"
          description="Akkauntingizga kirilgan qurilmalar. Tanimagan qurilmangizni chiqarib yuboring va parolingizni o'zgartiring."
        >
          <DevicesList devices={devices} currentTracked={!!currentId} />
        </SettingsSection>
        <SettingsSection id="settings-theme" title="Mavzu">
          <ThemeSetting />
        </SettingsSection>
        <SettingsSection
          id="settings-danger"
          title="Hisobni o'chirish"
          description="Hisobingiz va undagi barcha ma'lumotlar butunlay o'chiriladi."
        >
          <div>
            <DeleteAccount username={account.username ?? ""} hasPassword={account.hasPassword} />
          </div>
        </SettingsSection>
      </section>
    </div>
  );
}
