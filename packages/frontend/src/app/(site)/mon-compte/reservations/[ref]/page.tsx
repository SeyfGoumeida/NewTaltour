'use client';

import { useParams } from 'next/navigation';
import BookingDetail from '@/components/compte/BookingDetail';

export default function ReservationPage() {
  const { ref } = useParams<{ ref: string }>();
  return <BookingDetail reference={decodeURIComponent(ref)} />;
}
