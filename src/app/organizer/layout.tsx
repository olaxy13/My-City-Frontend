import { OrganizerAuthProvider } from '@/context/OrganizerAuthContext';

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizerAuthProvider>
      {children}
    </OrganizerAuthProvider>
  );
}

