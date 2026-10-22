import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { RentalRequestForm } from '@/components/booking/RentalRequestForm';
import type { RentalDuration, ReferralSource } from '@/types/models';
// Retained for the dormant full-booking components; this page never mounts them.
export interface BookingFormData {
    trailerId: string;
    trailerSlug: string;
    date: string;
    time: string;
    duration: RentalDuration;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    referralSource: ReferralSource;
    referralDetail: string;
}
export const metadata = { title: 'Request a Trailer Rental', description: 'Send a rental request. JB must confirm availability. No payment or deposit hold is taken online.' };
export default function BookPage() { return <><Navbar /><main id="main-content" className="min-h-screen pt-28 pb-24 px-4 md:px-8 max-w-3xl mx-auto"><h1 className="text-4xl font-headline font-bold uppercase mb-4">Request a trailer rental</h1><p className="text-lg mb-8">Send your preferred trailer and pickup time. JB must confirm availability and arrangements before your rental is reserved. No payment or deposit hold is taken here.</p><RentalRequestForm /></main><Footer /></>; }
