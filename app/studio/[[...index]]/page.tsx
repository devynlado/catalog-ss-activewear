import { redirect } from 'next/navigation';
import { getServerProfile } from '@/lib/supabase-server';
import { StudioPage } from './StudioPage';

export const metadata = {
  title: 'Portfolio CMS | Garment Decor',
  robots: 'noindex',
};

export default async function StudioRoute() {
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  // Set token in localStorage before any client JS runs so Studio sees it on first read
  const injectScript =
    projectId &&
    token &&
    `(function(){try{var k='__sanity_auth_token_'+${JSON.stringify(projectId)};var t=${JSON.stringify(token)};if(t)localStorage.setItem(k,t);}catch(e){}})();`;

  return (
    <>
      {injectScript ? (
        <script
          dangerouslySetInnerHTML={{ __html: injectScript }}
          suppressHydrationWarning
        />
      ) : null}
      <StudioPage />
    </>
  );
}
