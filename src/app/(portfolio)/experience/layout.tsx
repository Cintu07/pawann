// page.tsx here is a client component, which can't export metadata, so its title and canonical live here
export const metadata = {
  title: "experience · pawan kalyan",
  description: "where i've worked: founding engineer at cortex, and before that.",
  alternates: { canonical: "/experience" },
};

export default function ExperienceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
