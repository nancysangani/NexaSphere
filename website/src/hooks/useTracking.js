import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

export const useTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views automatically whenever the URL path changes
    trackEvent('page_view', `Visited ${location.pathname}`);
  }, [location]);
};
