import { Suspense } from 'react';
import { Loading } from '@/components/ui';
import Booking from './Booking';

export const metadata = { title: 'Ma réservation' };

export default function ReservationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Booking />
    </Suspense>
  );
}
