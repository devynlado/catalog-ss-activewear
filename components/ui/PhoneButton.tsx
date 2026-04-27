'use client';

import { Phone } from 'lucide-react';
import { useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface PhoneButtonProps {
  phoneNumber?: string;
  formattedNumber?: string;
  className?: string;
  showIcon?: boolean;
  iconClassName?: string;
  children?: ReactNode;
}

/**
 * PhoneButton component that handles phone links gracefully across devices:
 * - On mobile: tapping calls the number directly
 * - On desktop: redirects to contact page (avoids "Pick an app" dialog on Windows)
 */
export function PhoneButton({
  phoneNumber = '+18559427636',
  formattedNumber = '(855) 942-7636',
  className = '',
  showIcon = true,
  iconClassName = 'h-5 w-5',
  children,
}: PhoneButtonProps) {
  const router = useRouter();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if this is likely a mobile device that can make calls
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // On mobile, let the tel: link work normally
    if (isMobile) {
      return;
    }
    
    // On desktop, redirect to contact page instead
    e.preventDefault();
    router.push('/contact');
  }, [router]);

  // If children are provided, render them instead of the default content
  if (children) {
    return (
      <a
        href={`tel:${phoneNumber}`}
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={`tel:${phoneNumber}`}
      onClick={handleClick}
      className={className}
    >
      {showIcon && <Phone className={iconClassName} />}
      {formattedNumber}
    </a>
  );
}
