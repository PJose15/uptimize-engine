import { redirect } from 'next/navigation';

/** The platform front door is the command center. */
export default function RootPage() {
    redirect('/command-center');
}
